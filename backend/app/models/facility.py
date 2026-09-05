from sqlalchemy import String, Float, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.core.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin


class FacilityType(str, enum.Enum):
    SUB_CENTRE = "sub_centre"
    PHC = "phc"
    RURAL_HOSPITAL = "rural_hospital"
    DISTRICT_HOSPITAL = "district_hospital"


class AvailabilityLevel(str, enum.Enum):
    AVAILABLE = "available"
    LIMITED = "limited"
    UNAVAILABLE = "unavailable"


class Facility(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    FHIR resource: Organization/Location, simplified. Seeded from the
    Health Facility Registry / data.gov.in per the Build Guide's data
    sources (Section 10) — never hand-invented for the demo.
    """

    __tablename__ = "facilities"

    name: Mapped[str] = mapped_column(String(255), index=True)
    facility_type: Mapped[FacilityType] = mapped_column(SAEnum(FacilityType))
    district: Mapped[str] = mapped_column(String(100), index=True)
    village_or_ward: Mapped[str | None] = mapped_column(String(150), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Care-pathway visibility fields (Build Guide Section 6) — visibility
    # only, NOT live inventory management. Seeded/updated periodically,
    # not a real-time stock system.
    service_availability: Mapped[AvailabilityLevel] = mapped_column(
        SAEnum(AvailabilityLevel), default=AvailabilityLevel.AVAILABLE
    )
    diagnostic_availability: Mapped[AvailabilityLevel] = mapped_column(
        SAEnum(AvailabilityLevel), default=AvailabilityLevel.AVAILABLE
    )
    medicine_availability: Mapped[AvailabilityLevel] = mapped_column(
        SAEnum(AvailabilityLevel), default=AvailabilityLevel.AVAILABLE
    )
