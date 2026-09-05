import math

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.facility import Facility
from app.schemas.facility import FacilityOut, FacilityPathwayOption

router = APIRouter(prefix="/facilities", tags=["facilities"])


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Standard great-circle distance. Sufficient accuracy for
    facility-ranking purposes; we're not doing turn-by-turn routing."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


@router.get("", response_model=list[FacilityOut])
async def list_facilities(district: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Facility)
    if district:
        stmt = stmt.where(Facility.district == district)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{facility_id}/pathway-options", response_model=list[FacilityPathwayOption])
async def get_pathway_options(facility_id: str, db: AsyncSession = Depends(get_db)):
    """
    Build Guide Section 6: Care-Pathway Visibility. Ranks nearby
    facilities by a combination of distance AND availability — NOT
    naive nearest-facility sort, which is an important distinction for
    the "affordability without a financial module" narrative. A facility
    that's slightly farther but has medicine/diagnostics available beats
    a closer one that's out of stock.
    """
    origin = await db.get(Facility, facility_id)
    if origin is None or origin.latitude is None or origin.longitude is None:
        raise HTTPException(status_code=404, detail="Facility not found or missing coordinates")

    result = await db.execute(
        select(Facility).where(Facility.id != facility_id).where(Facility.latitude.is_not(None))
    )
    candidates = list(result.scalars().all())

    def availability_score(f: Facility) -> int:
        levels = {"available": 0, "limited": 1, "unavailable": 2}
        return (
            levels[f.service_availability.value]
            + levels[f.diagnostic_availability.value]
            + levels[f.medicine_availability.value]
        )

    options = []
    for f in candidates:
        distance = _haversine_km(origin.latitude, origin.longitude, f.latitude, f.longitude)
        options.append((f, distance))

    # Rank by a blend: availability first (fewer shortages = better),
    # distance as tiebreaker. This is intentionally simple and explainable
    # — defend it as "appropriateness over pure proximity" if asked.
    options.sort(key=lambda pair: (availability_score(pair[0]), pair[1]))

    return [
        FacilityPathwayOption(
            facility_id=f.id,
            facility_name=f.name,
            distance_km=round(distance, 1),
            service_availability=f.service_availability,
            diagnostic_availability=f.diagnostic_availability,
            medicine_availability=f.medicine_availability,
        )
        for f, distance in options[:5]  # top 5 — enough choice without overwhelming the worker
    ]
