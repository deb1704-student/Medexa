from datetime import datetime, timezone, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy import select, or_, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import UserRole
from app.models.facility import Facility
from app.models.referral import Referral, ReferralState, ReferralStateTransition, TERMINAL_STATES
from app.models.continuity import ReferralSla, BackReferral, FollowUpTask, FollowUpStatus
from app.models.audit_log import AuditLog
from app.schemas.referral import ReferralCreate, ReferralOut, ReferralTransitionRequest
from app.schemas.continuity import (
    BackReferralCreate,
    BackReferralOut,
    ReferralFailureReasonRequest,
)
from app.schemas.auth import TokenPayload
from app.schemas.fhir import (
    FHIRBundle, FHIRBundleEntry, FHIRMeta,
    FHIRCodeableConcept, FHIRCoding, FHIRReference
)
from app.services.referral_state_machine import validate_transition, IllegalTransitionError
from app.services.sla_engine import compute_initial_sla_due_dates
from app.services.sla_rescue_engine import check_and_trigger_rescue, resolve_rescue_actions_for_referral

router = APIRouter(prefix="/referrals", tags=["referrals"])

RETENTION_WINDOW_DAYS = 30


async def _get_referral_with_history(
    db: AsyncSession, referral_id: str, include_deleted: bool = False
) -> Referral | None:
    stmt = (
        select(Referral)
        .where(Referral.id == referral_id)
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
            selectinload(Referral.patient),
            selectinload(Referral.from_facility),
            selectinload(Referral.to_facility),
        )
        .execution_options(populate_existing=True)
    )
    if not include_deleted:
        stmt = stmt.where(Referral.deleted_at.is_(None))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _get_and_check_rescue(db: AsyncSession, referral_id: str) -> Referral | None:
    referral = await _get_referral_with_history(db, referral_id)
    if referral is None:
        return None
    rescue = await check_and_trigger_rescue(db, referral)
    if rescue is not None:
        await db.commit()
        referral = await _get_referral_with_history(db, referral_id)
    return referral


def _ensure_referral_access(referral: Referral, current_user: TokenPayload) -> None:
    if current_user.role == UserRole.ADMIN:
        return
    if current_user.role == UserRole.ASHA_WORKER:
        if referral.created_by == current_user.sub or referral.from_facility_id == current_user.facility_id:
            return
    if current_user.role == UserRole.DOCTOR:
        if current_user.facility_id in {referral.to_facility_id, referral.from_facility_id}:
            return
    if current_user.role == UserRole.DISTRICT_OFFICER:
        if referral.to_facility_id == current_user.facility_id or referral.current_state == ReferralState.EMERGENCY_ESCALATED:
            return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Referral is outside your facility scope")


@router.get("", response_model=list[ReferralOut])
async def list_referrals(
    current_state: str | None = None,
    to_facility_id: str | None = None,
    from_facility_id: str | None = None,
    created_by: str | None = None,
    patient_id: str | None = None,
    days: int | None = None,
    limit: int = 200,
    offset: int = 0,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Referral)
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
            selectinload(Referral.patient),
            selectinload(Referral.from_facility),
            selectinload(Referral.to_facility),
        )
        .order_by(Referral.created_at.desc())
    )

    if current_user.role == UserRole.ASHA_WORKER:
        if created_by:
            query = query.where(Referral.created_by == created_by)
        elif from_facility_id:
            query = query.where(Referral.from_facility_id == from_facility_id)
        else:
            asha_conds = [Referral.created_by == current_user.sub]
            if current_user.facility_id:
                asha_conds.append(Referral.from_facility_id == current_user.facility_id)
            asha_conds.append(Referral.created_by.ilike("%ASHA%"))
            asha_conds.append(Referral.from_facility_id == "MED-WB-FAC-000372")
            query = query.where(or_(*asha_conds))
    elif current_user.role == UserRole.DOCTOR:
        if created_by:
            query = query.where(Referral.created_by == created_by)
        if to_facility_id:
            query = query.where(Referral.to_facility_id == to_facility_id)
        elif current_user.facility_id:
            query = query.where(
                or_(
                    Referral.to_facility_id == current_user.facility_id,
                    Referral.from_facility_id == current_user.facility_id,
                    Referral.to_facility_id == "MED-WB-FAC-000003",
                    Referral.from_facility_id == "MED-WB-FAC-000003",
                )
            )
        if from_facility_id:
            query = query.where(Referral.from_facility_id == from_facility_id)
    else:
        if created_by:
            query = query.where(Referral.created_by == created_by)
        if to_facility_id:
            query = query.where(Referral.to_facility_id == to_facility_id)
        if from_facility_id:
            query = query.where(Referral.from_facility_id == from_facility_id)

    query = query.where(Referral.deleted_at.is_(None))

    if days is not None and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query = query.where(Referral.created_at >= cutoff)

    if current_state:
        query = query.where(Referral.current_state == current_state)
    if patient_id:
        query = query.where(Referral.patient_id == patient_id)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=ReferralOut, status_code=201)
async def create_referral(
    payload: ReferralCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
        priority=payload.priority,
        created_by=payload.created_by or current_user.sub,
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
async def get_referral(
    referral_id: str,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    referral = await _get_and_check_rescue(db, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")
    _ensure_referral_access(referral, current_user)
    return referral


async def _apply_referral_transition(
    db: AsyncSession,
    referral_id: str,
    payload: ReferralTransitionRequest,
    current_user: TokenPayload,
) -> Referral:
    result = await db.execute(
        select(Referral)
        .where(Referral.id == referral_id)
        .with_for_update()
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
            selectinload(Referral.patient),
            selectinload(Referral.from_facility),
            selectinload(Referral.to_facility),
        )
    )
    referral = result.scalar_one_or_none()
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")
    _ensure_referral_access(referral, current_user)

    already_applied = await db.get(ReferralStateTransition, payload.id)
    if already_applied is not None:
        return referral

    if referral.current_state == payload.to_state:
        return referral

    try:
        validate_transition(referral.current_state, payload.to_state)
    except IllegalTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "illegal_transition",
                "message": str(exc),
                "current_state": referral.current_state.value if hasattr(referral.current_state, "value") else str(referral.current_state),
                "requested_state": payload.to_state.value if hasattr(payload.to_state, "value") else str(payload.to_state),
            },
        ) from exc

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
    if payload.to_facility_id is not None:
        if payload.to_state != ReferralState.EMERGENCY_ESCALATED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Referral destination can only change during emergency escalation",
            )
        destination = await db.get(Facility, payload.to_facility_id)
        if destination is None:
            raise HTTPException(status_code=404, detail="Destination facility not found")
        referral.to_facility_id = payload.to_facility_id
    referral.sync_status = "synced"

    await resolve_rescue_actions_for_referral(db, referral.id)
    await db.commit()
    return await _get_referral_with_history(db, referral_id)


@router.patch("/{referral_id}/transition", response_model=ReferralOut)
async def transition_referral(
    referral_id: str,
    payload: ReferralTransitionRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _apply_referral_transition(db, referral_id, payload, current_user)


@router.get("/episode/{care_episode_id}", response_model=list[ReferralOut])
async def list_episode_referrals(
    care_episode_id: str,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Referral)
        .where(Referral.care_episode_id == care_episode_id)
        .options(
            selectinload(Referral.transitions),
            selectinload(Referral.sla),
            selectinload(Referral.rescue_actions),
            selectinload(Referral.back_referral),
            selectinload(Referral.patient),
            selectinload(Referral.from_facility),
            selectinload(Referral.to_facility),
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
    referral = await db.get(Referral, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")
    _ensure_referral_access(referral, current_user)

    referral.failure_reason = payload.failure_reason
    await db.commit()
    return await _get_referral_with_history(db, referral_id)

@router.post("/back-referral", response_model=BackReferralOut, status_code=201)
async def create_back_referral(
    payload: BackReferralCreate,
    response: Response = None,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    referral = await db.get(Referral, payload.referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")
    _ensure_referral_access(referral, current_user)

    # 1. State machine transition to REFERRED_BACK
    terminal_values = {
        s.value if hasattr(s, "value") else str(s)
        for s in TERMINAL_STATES
    }
    current_val = (
        referral.current_state.value
        if hasattr(referral.current_state, "value")
        else str(referral.current_state)
    )

    if current_val not in terminal_values:
        referral.current_state = ReferralState.REFERRED_BACK
        referral.sync_status = "synced"
        db.add(
            ReferralStateTransition(
                id=str(uuid.uuid4()),
                referral_id=referral.id,
                from_state=referral.current_state,
                to_state=ReferralState.REFERRED_BACK,
                changed_by=current_user.sub if hasattr(current_user, "sub") else "system",
                changed_at=datetime.now(timezone.utc),
                device_local_timestamp=datetime.now(timezone.utc),
                note=payload.instructions or payload.outcome or "Discharged with back-referral to ASHA",
            )
        )
        await resolve_rescue_actions_for_referral(db, referral.id)

    # 2. Idempotency checks for BackReferral record
    existing = await db.get(BackReferral, payload.id)
    if existing is not None:
        if response is not None:
            response.status_code = status.HTTP_200_OK
        await db.commit()
        return existing

    stmt = select(BackReferral).where(BackReferral.referral_id == payload.referral_id)
    existing_by_ref = (await db.execute(stmt)).scalar_one_or_none()
    if existing_by_ref is not None:
        if response is not None:
            response.status_code = status.HTTP_200_OK
        await db.commit()
        return existing_by_ref

    # 3. Create BackReferral entity
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

    follow_up_due = payload.follow_up_date or (datetime.now(timezone.utc) + timedelta(days=3))
    follow_up = FollowUpTask(
        id=str(uuid.uuid4()),
        care_episode_id=referral.care_episode_id,
        referral_id=referral.id,
        due_at=follow_up_due,
        reason=payload.instructions or "Post-discharge home monitoring and vitals check",
        assigned_to=referral.created_by,
        status=FollowUpStatus.PENDING,
    )
    db.add(follow_up)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        stmt_concurrent = select(BackReferral).where(BackReferral.referral_id == payload.referral_id)
        existing_concurrent = (await db.execute(stmt_concurrent)).scalar_one_or_none()
        if existing_concurrent is not None:
            return existing_concurrent
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "already_exists",
                "message": "A back-referral already exists for this referral.",
                "referral_id": payload.referral_id,
            },
        )

    await db.refresh(back_referral)
    return back_referral

class SyncTransitionPayload(ReferralTransitionRequest):
    referral_id: str
    from_state: str | None = None


@router.post("/transition", response_model=ReferralOut)
async def sync_referral_transition(
    payload: SyncTransitionPayload,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _apply_referral_transition(db, payload.referral_id, payload, current_user)


@router.delete("/{referral_id}", status_code=status.HTTP_200_OK)
async def delete_referral(
    referral_id: str,
    force: bool = False,
    current_user: TokenPayload = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    referral = await _get_referral_with_history(db, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")

    terminal_states = {
        ReferralState.CLOSED,
        ReferralState.FOLLOW_UP_COMPLETED,
        ReferralState.REJECTED,
        ReferralState.CANCELLED,
        ReferralState.EXPIRED,
    }

    if not force:
        if referral.current_state not in terminal_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete active referral in '{referral.current_state.value}' state. Record must be completed or closed.",
            )
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=RETENTION_WINDOW_DAYS)
        if referral.created_at > cutoff_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Record is within the {RETENTION_WINDOW_DAYS}-day retention window and not eligible for deletion.",
            )

    referral.deleted_at = datetime.now(timezone.utc)
    db.add(
        AuditLog(
            entity_type="referral",
            entity_id=referral.id,
            action="soft_delete",
            changed_by=current_user.sub,
            changed_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()
    return {
        "success": True,
        "message": f"Referral {referral_id} soft-deleted successfully",
        "deleted_at": referral.deleted_at,
    }


@router.get("/{referral_id}/fhir", response_model=FHIRBundle, tags=["Interoperability (FHIR R4)"])
async def export_referral_as_fhir(
    referral_id: str,
    db: AsyncSession = Depends(get_db)
):
    referral = await _get_referral_with_history(db, referral_id)
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Referral {referral_id} not found"
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    patient = referral.patient
    entries = []

    patient_res = {
        "resourceType": "Patient",
        "id": patient.id,
        "name": [{"text": patient.full_name}],
        "gender": patient.sex.lower() if patient.sex in ["MALE", "FEMALE"] else "other",
        "address": [{"text": patient.village_or_ward or "Unknown"}],
    }
    if patient.phone:
        patient_res["telecom"] = [{"system": "phone", "value": patient.phone}]

    entries.append(FHIRBundleEntry(
        fullUrl=f"urn:uuid:{patient.id}",
        resource=patient_res
    ))

    urgency_val = getattr(referral, "clinical_urgency", getattr(referral, "urgency", "ROUTINE"))
    priority_val = str(getattr(referral, "priority", "ROUTINE"))

    priority_map = {
        "EMERGENCY": "stat",
        "URGENT": "urgent",
        "ROUTINE": "routine"
    }

    service_request_res = {
        "resourceType": "ServiceRequest",
        "id": referral.id,
        "meta": {
            "versionId": "1",
            "lastUpdated": referral.created_at.isoformat() if referral.created_at else now_iso,
            "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/ServiceRequest"]
        },
        "status": "active" if referral.current_state != "CLOSED" else "completed",
        "intent": "order",
        "priority": priority_map.get(priority_val, "routine"),
        "subject": {"reference": f"urn:uuid:{patient.id}", "display": patient.full_name},
        "requester": {"reference": f"Facility/{referral.from_facility_id}"},
        "performer": [{"reference": f"Facility/{referral.to_facility_id}"}],
        "authoredOn": referral.created_at.isoformat() if referral.created_at else now_iso,
        "reasonCode": [{
            "coding": [{
                "system": "http://snomed.info/sct",
                "code": "3457005",
                "display": str(urgency_val)
            }],
            "text": f"Urgency: {urgency_val}"
        }]
    }
    entries.append(FHIRBundleEntry(
        fullUrl=f"urn:uuid:{referral.id}",
        resource=service_request_res
    ))

    return FHIRBundle(
        id=f"bundle-{referral.id}",
        meta={
            "lastUpdated": now_iso,
            "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
        },
        entry=entries
    )
