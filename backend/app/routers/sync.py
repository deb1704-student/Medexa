import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.schemas.sync import SyncBatchRequest, SyncBatchResponse, SyncMutationResult
from app.models.sync_ledger import SyncIdempotencyKey
from app.models.patient import Patient
from app.models.referral import Referral
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/sync", tags=["Offline Sync"])

@router.post("/replay", response_model=SyncBatchResponse)
async def replay_offline_mutations(
    batch: SyncBatchRequest,
    db: AsyncSession = Depends(get_db)
):
    results = []
    success = 0
    duplicates = 0
    failures = 0

    for item in batch.mutations:
        stmt = select(SyncIdempotencyKey).where(SyncIdempotencyKey.client_mutation_id == item.mutation_id)
        res = await db.execute(stmt)
        existing = res.scalars().first()

        if existing:
            duplicates += 1
            results.append(SyncMutationResult(
                mutation_id=item.mutation_id,
                status="DUPLICATE_SKIPPED",
                entity_id=existing.entity_id
            ))
            continue

        try:
            entity_id = None
            p = item.payload

            if item.action_type == "CREATE_PATIENT":
                pat_id = str(p.get("id")) if p.get("id") else f"pat-{uuid.uuid4().hex[:8]}"
                patient = Patient(
                    id=pat_id,
                    full_name=p.get("full_name", p.get("name", "Unknown")),
                    age=int(p.get("age", 0)),
                    sex=p.get("sex", p.get("gender", "OTHER")),
                    village_or_ward=p.get("village_or_ward", p.get("village", "Unknown")),
                    phone=p.get("phone")
                )
                db.add(patient)
                entity_id = pat_id

            elif item.action_type == "CREATE_REFERRAL":
                ref_id = str(p.get("id")) if p.get("id") else f"ref-{uuid.uuid4().hex[:8]}"
                referral = Referral(
                    id=ref_id,
                    patient_id=p["patient_id"],
                    from_facility_id=p["from_facility_id"],
                    to_facility_id=p["to_facility_id"],
                    current_state=p.get("current_state", "INITIATED"),
                    clinical_urgency=p.get("clinical_urgency", "GREEN"),
                    priority=p.get("priority", "ROUTINE")
                )
                db.add(referral)
                entity_id = ref_id

            elif item.action_type == "RECORD_TRANSITION":
                audit = AuditLog(
                    entity_type="REFERRAL",
                    entity_id=p["referral_id"],
                    action="TRANSITION",
                    performed_by_id=p.get("performed_by_id", "system"),
                    details={
                        "from_state": p.get("from_state"),
                        "to_state": p.get("to_state"),
                        "notes": p.get("notes")
                    }
                )
                db.add(audit)
                entity_id = p["referral_id"]

            ledger_entry = SyncIdempotencyKey(
                client_mutation_id=item.mutation_id,
                action_type=item.action_type,
                entity_id=entity_id,
                status="PROCESSED"
            )
            db.add(ledger_entry)
            await db.commit()

            success += 1
            results.append(SyncMutationResult(
                mutation_id=item.mutation_id,
                status="APPLIED",
                entity_id=entity_id
            ))

        except Exception as e:
            await db.rollback()
            failures += 1
            results.append(SyncMutationResult(
                mutation_id=item.mutation_id,
                status="FAILED",
                error=str(e)
            ))

    return SyncBatchResponse(
        processed_count=len(batch.mutations),
        success_count=success,
        duplicate_count=duplicates,
        failure_count=failures,
        results=results
    )
