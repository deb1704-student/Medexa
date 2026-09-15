from pydantic import BaseModel, Field
from typing import Any, List, Optional
from datetime import datetime

class SyncMutationItem(BaseModel):
    mutation_id: str = Field(..., description="Client-generated unique UUID for idempotency")
    action_type: str = Field(..., description="CREATE_PATIENT, CREATE_REFERRAL, RECORD_TRANSITION")
    timestamp: datetime
    payload: dict[str, Any]

class SyncBatchRequest(BaseModel):
    client_id: str
    mutations: List[SyncMutationItem]

class SyncMutationResult(BaseModel):
    mutation_id: str
    status: str  # APPLIED, DUPLICATE_SKIPPED, FAILED
    entity_id: Optional[str] = None
    error: Optional[str] = None

class SyncBatchResponse(BaseModel):
    processed_count: int
    success_count: int
    duplicate_count: int
    failure_count: int
    results: List[SyncMutationResult]
