from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.referral import Referral, ReferralStateTransition
from app.models.continuity import ReferralSla, BackReferral
from app.schemas.referral import ReferralCreate, ReferralOut, ReferralTransitionRequest
from app.schemas.continuity import (
    BackReferralCreate,
    BackReferralOut,
    ReferralFailureReasonRequest,
)
from app.schemas.auth import TokenPayload
from app.services.referral_state_machine import validate_transition, IllegalTransitionError
from app.services.sla_engine import compute_initial_sla_due_dates
from app.services.sla_rescue_engine import check_and_trigger_rescue, resolve_rescue_actions_for_referral

router = APIRouter(prefix="/referrals", tags=["referrals"])


async def _get_referral_with_history(db: AsyncSession, referral_id: str) -> Referral | None:
    result = await db.execute(
        select(Referral)
        .where(Referral.id == referral_id)
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
        )
    )
    return result.scalar_one_or_none()


async def _get_and_check_rescue(db: AsyncSession, referral_id: str) -> Referral | None:
    """Every read of a referral re-checks whether it's now SLA-breached
    and, if so, logs a rescue action before returning — this is what
    makes Referral Rescue feel "live" without needing a background job
    scheduler for the hackathon prototype. A production system would
    likely run this as a periodic sweep instead; documented here as a
    known simplification, not an oversight."""
    referral = await _get_referral_with_history(db, referral_id)
    if referral is None:
        return None
    rescue = await check_and_trigger_rescue(db, referral)
    if rescue is not None:
        await db.commit()
        referral = await _get_referral_with_history(db, referral_id)
    return referral


@router.post("", response_model=ReferralOut, status_code=201)
async def create_referral(
    payload: ReferralCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    A referral is created in DRAFT. The first real transition (DRAFT ->
    SENT) goes through the same enforced /transition endpoint as every
    other state change. An SLA row is created here, once, from the
    configured stage windows (sla_engine.py) — every subsequent stage's
    deadline is fixed relative to creation time, not recomputed later.
    """
    existing = await _get_referral_with_history(db, payload.id)
    if existing is not None:
        return existing

    referral = Referral(
        id=payload.id,
        care_episode_id=payload.care_episode_id,
        patient_id=payload.patient_id,
        from_facility_id=payload.from_facility_id,
        to_facility_id=payload.to_facility_id,
        current_state=payload.current_state,
        reason=payload.reason,
        created_by=payload.created_by,
        sync_status="synced",
    )
    db.add(referral)

    db.add(
        ReferralStateTransition(
            referral_id=referral.id,
            from_state=None,
            to_state=referral.current_state,
            changed_by=current_user.sub,
            changed_at=datetime.now(timezone.utc),
            device_local_timestamp=payload.created_at,
        )
    )

    sla_dates = compute_initial_sla_due_dates(payload.created_at)
    db.add(ReferralSla(referral_id=referral.id, **sla_dates))

    await db.commit()
    return await _get_referral_with_history(db, referral.id)


@router.get("/{referral_id}", response_model=ReferralOut)
async def get_referral(referral_id: str, db: AsyncSession = Depends(get_db)):
    referral = await _get_and_check_rescue(db, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral


@router.patch("/{referral_id}/transition", response_model=ReferralOut)
async def transition_referral(
    referral_id: str,
    payload: ReferralTransitionRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    THE enforcement point. An illegal transition is rejected here with
    409, never silently persisted, regardless of what the client sent.
    On a successful transition, any open rescue actions for this
    referral are resolved — the thing they were warning about no longer
    applies once the referral has moved forward.

    Idempotency: the transition's own id is client-generated. If this
    exact transition id already exists, treat a retried sync push as
    already-applied rather than erroring or double-applying it.
    """
    referral = await _get_referral_with_history(db, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")

    already_applied = await db.get(ReferralStateTransition, payload.id)
    if already_applied is not None:
        return await _get_referral_with_history(db, referral_id)

    try:
        validate_transition(referral.current_state, payload.to_state)
    except IllegalTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    transition = ReferralStateTransition(
        id=payload.id,
        referral_id=referral.id,
        from_state=referral.current_state,
        to_state=payload.to_state,
        changed_by=current_user.sub,
        changed_at=datetime.now(timezone.utc),
        device_local_timestamp=payload.device_local_timestamp,
        note=payload.note,
    )
    db.add(transition)

    referral.current_state = payload.to_state
    referral.sync_status = "synced"

    await resolve_rescue_actions_for_referral(db, referral.id)

    await db.commit()
    return await _get_referral_with_history(db, referral_id)


@router.get("/episode/{care_episode_id}", response_model=list[ReferralOut])
async def list_episode_referrals(care_episode_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Referral)
        .where(Referral.care_episode_id == care_episode_id)
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
        )
    )
    return list(result.scalars().all())


@router.patch("/{referral_id}/failure-reason", response_model=ReferralOut)
async def set_failure_reason(
    referral_id: str,
    payload: ReferralFailureReasonRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Recording why a referral failed is a distinct action from a state
    transition — it can be set on a REJECTED/CANCELLED/EXPIRED/
    PATIENT_NO_SHOW referral to feed the district dashboard's failure-
    reason breakdown (canonical context Section 13), without needing a
    new terminal state for every possible reason.
    """
    referral = await db.get(Referral, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")

    referral.failure_reason = payload.failure_reason
    await db.commit()
    return await _get_referral_with_history(db, referral_id)


@router.post("/back-referral", response_model=BackReferralOut, status_code=201)
async def create_back_referral(
    payload: BackReferralCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Back-referral packet (canonical context Section 9) — the receiving
    facility's structured outcome sent back to the originating worker.
    One per referral; posting again with the same id is idempotent for
    safe offline-sync retries, same pattern as everywhere else.
    """
    existing = await db.get(BackReferral, payload.id)
    if existing is not None:
        return existing

    referral = await db.get(Referral, payload.referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")

    back_referral = BackReferral(
        id=payload.id,
        referral_id=payload.referral_id,
        outcome=payload.outcome,
        treatment=payload.treatment,
        medication=payload.medication,
        follow_up_date=payload.follow_up_date,
        warning_signs=payload.warning_signs,
        instructions=payload.instructions,
        recorded_by=payload.recorded_by,
        recorded_at=payload.recorded_at,
    )
    db.add(back_referral)
    await db.commit()
    await db.refresh(back_referral)
    return back_referral


class SyncTransitionPayload(ReferralTransitionRequest):
    """Shape matching the frontend sync queue's payload exactly — see
    sync/syncEngine.ts's entityMap: "referralTransition" -> POST
    /referrals/transition."""

    referral_id: str
    from_state: str | None = None


@router.post("/transition", response_model=ReferralOut)
async def sync_referral_transition(
    payload: SyncTransitionPayload,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sync-queue entry point. Re-validates the transition server-side
    exactly like the interactive PATCH endpoint — an offline-created
    transition gets no less scrutiny than one made online."""
    referral = await _get_referral_with_history(db, payload.referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")

    already_applied = await db.get(ReferralStateTransition, payload.id)
    if already_applied is not None:
        return await _get_referral_with_history(db, payload.referral_id)

    try:
        validate_transition(referral.current_state, payload.to_state)
    except IllegalTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    transition = ReferralStateTransition(
        id=payload.id,
        referral_id=referral.id,
        from_state=referral.current_state,
        to_state=payload.to_state,
        changed_by=current_user.sub,
        changed_at=datetime.now(timezone.utc),
        device_local_timestamp=payload.device_local_timestamp,
        note=payload.note,
    )
    db.add(transition)
    referral.current_state = payload.to_state
    referral.sync_status = "synced"

    await resolve_rescue_actions_for_referral(db, referral.id)

    await db.commit()
    return await _get_referral_with_history(db, payload.referral_id)
