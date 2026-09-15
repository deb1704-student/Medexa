import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class SyncIdempotencyKey(Base):
    __tablename__ = "sync_idempotency_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_mutation_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PROCESSED", nullable=False)
    response_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
