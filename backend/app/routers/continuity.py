from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.continuity import ContinuityRiskScore as ContinuityRiskScoreModel, FollowUpTask
from app.schemas.continuity import (
    ContinuityRiskScoreRequest,
    ContinuityRiskScoreOut,
    FollowUpTaskOut,
)
from app.schemas.auth import TokenPayload
from app.services.continuity_risk_engine import compute_continuity_risk

router = APIRouter(prefix="/continuity", tags=["continuity"])


@router.post("/risk-score/{care_episode_id}", response_model=ContinuityRiskScoreOut)
async def score_and_record_continuity_risk(
    care_episode_id: str,
    payload: ContinuityRiskScoreRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Authoritative CONTINUITY risk scoring — a structurally separate
    concept from clinical risk (POST /triage/score). Each call persists
    a new ContinuityRiskScore row rather than overwriting a single
    field, so risk trend over time and "why was this patient flagged"
    stay auditable even after the underlying factors change.
    """
    score, level, reasons, recommended_action = compute_continuity_risk(payload)

    record = ContinuityRiskScoreModel(
        care_episode_id=care_episode_id,
        score=score,
        level=level,
        reasons=reasons,
        recommended_action=recommended_action,
        computed_at=datetime.now(timezone.utc),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/risk-score/{care_episode_id}/history", response_model=list[ContinuityRiskScoreOut])
async def get_continuity_risk_history(care_episode_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ContinuityRiskScoreModel)
        .where(ContinuityRiskScoreModel.care_episode_id == care_episode_id)
        .order_by(ContinuityRiskScoreModel.computed_at.desc())
    )
    return list(result.scalars().all())


@router.get("/follow-ups", response_model=list[FollowUpTaskOut])
async def list_follow_ups(
    assigned_to: str | None = None,
    status_filter: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Backs the frontline worker dashboard's "who needs attention now?"
    view (canonical context Section 27) — filterable by worker and
    status so a worker's home screen only shows their own overdue/
    pending follow-ups, not the whole district's.
    """
    stmt = select(FollowUpTask)
    if assigned_to:
        stmt = stmt.where(FollowUpTask.assigned_to == assigned_to)
    if status_filter:
        stmt = stmt.where(FollowUpTask.status == status_filter)
    stmt = stmt.order_by(FollowUpTask.due_at.asc())
    result = await db.execute(stmt)
    return list(result.scalars().all())
