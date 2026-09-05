"""Import validated Medexa West Bengal master data into PostgreSQL.

This script imports reference/master data only. Synthetic operational data is
intentionally a separate concern and should be loaded by the demo seed script.

Usage:
    python -m scripts.import_wb_data --data-dir ../datasets/wb_final

Validation runs first. The database transaction is rolled back on any error.
Existing rows with the same source primary key are updated, making the import
safe to re-run after a corrected dataset is validated.
"""
from __future__ import annotations

import argparse
import asyncio
import csv
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.facility import AvailabilityLevel, CoordinateStatus, Facility, FacilityType
from app.models.facility_service import CapacityStatus, FacilityService
from app.models.geography import Block, District, LocalBody, Location, Subdistrict
from scripts.validate_wb_data import validate


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def clean(value: str | None) -> str | None:
    value = (value or "").strip()
    return value or None


def bool_value(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "y"}


def enum_or_none(enum_cls, value: str | None):
    value = clean(value)
    return enum_cls(value) if value else None


def dt(value: str | None) -> datetime:
    value = clean(value)
    if not value:
        return datetime.now(timezone.utc)
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


async def upsert_by_id(db: AsyncSession, model, row_id: str, values: dict):
    obj = await db.get(model, row_id)
    if obj is None:
        obj = model(id=row_id, **values)
        db.add(obj)
    else:
        for key, value in values.items():
            setattr(obj, key, value)
    return obj


async def import_data(data_dir: Path) -> None:
    if validate(data_dir) != 0:
        raise RuntimeError("Dataset validation failed; import aborted.")

    districts = read_csv(data_dir / "medexa_districts.csv")
    subdistricts = read_csv(data_dir / "medexa_subdistricts.csv")
    blocks = read_csv(data_dir / "medexa_blocks.csv")
    local_bodies = read_csv(data_dir / "medexa_local_bodies.csv")
    locations = read_csv(data_dir / "medexa_locations.csv")
    facilities = read_csv(data_dir / "medexa_facilities.csv")
    service_path = data_dir / "medexa_synthetic_facility_services.csv"
    services = read_csv(service_path) if service_path.exists() else []

    async with AsyncSessionLocal() as db:
        async with db.begin():
            for row in districts:
                await upsert_by_id(db, District, clean(row["district_code"]), {
                    "state_code": clean(row["state_code"]) or "WB",
                    "state_name": clean(row["state_name"]) or "West Bengal",
                    "district_code": clean(row["district_code"]),
                    "name": clean(row["district_name"]) or "Unknown",
                })

            district_ids = {r["district_code"]: r["district_code"] for r in districts}
            for row in subdistricts:
                await upsert_by_id(db, Subdistrict, clean(row["subdistrict_code"]), {
                    "district_id": district_ids[clean(row["district_code"])],
                    "district_code": clean(row["district_code"]),
                    "name": clean(row["subdistrict_name"]) or "Unknown",
                    "subdistrict_code": clean(row["subdistrict_code"]),
                })

            for row in blocks:
                await upsert_by_id(db, Block, clean(row["block_code"]), {
                    "district_id": district_ids[clean(row["district_code"])],
                    "district_code": clean(row["district_code"]),
                    "name": clean(row["block_name"]) or "Unknown",
                    "block_code": clean(row["block_code"]),
                })

            for row in local_bodies:
                await upsert_by_id(db, LocalBody, clean(row["localbody_code"]), {
                    "district_id": district_ids[clean(row["district_code"])],
                    "district_code": clean(row["district_code"]),
                    "name": clean(row["localbody_name"]) or "Unknown",
                    "localbody_code": clean(row["localbody_code"]),
                })

            for row in locations:
                await upsert_by_id(db, Location, clean(row["location_id"]), {
                    "state_code": clean(row["state_code"]) or "WB",
                    "state_name": clean(row["state_name"]) or "West Bengal",
                    "district_id": district_ids[clean(row["district_code"])],
                    "district_code": clean(row["district_code"]),
                    "subdistrict_id": clean(row["subdistrict_code"]),
                    "subdistrict_code": clean(row["subdistrict_code"]),
                    "block_id": clean(row["block_code"]),
                    "block_code": clean(row["block_code"]),
                    "local_body_id": clean(row["localbody_code"]),
                    "localbody_code": clean(row["localbody_code"]),
                    "village_code": clean(row["village_code"]),
                    "name": clean(row["village_name"]) or "Unknown",
                    "village_status": clean(row["village_status"]),
                    "census_2011_code": clean(row["census_2011_code"]),
                })

            for row in facilities:
                facility_type = clean(row["facility_type"])
                lat = float(row["latitude"]) if clean(row["latitude"]) else None
                lon = float(row["longitude"]) if clean(row["longitude"]) else None
                values = {
                    "name": clean(row["name"]) or "Unnamed facility",
                    "facility_type": enum_or_none(FacilityType, facility_type.lower() if facility_type else None),
                    "ownership": clean(row["ownership"]),
                    "district": clean(row["district"]),
                    "district_mapping_confident": bool_value(row["district_mapping_confident"]),
                    "subdistrict": clean(row["subdistrict"]),
                    "pincode": clean(row["pincode"]),
                    "latitude": lat,
                    "longitude": lon,
                    "coordinate_status": CoordinateStatus(clean(row["coordinate_status"])),
                    "coordinate_confidence": clean(row["coordinate_confidence"]),
                    "coordinate_source": clean(row["coordinate_source"]),
                    "source": clean(row["source"]),
                    "source_record_id": clean(row["source_record_id"]),
                    "verification_status": clean(row["verification_status"]),
                    "facility_category": clean(row["facility_category"]),
                    "facility_care_type": clean(row["facility_care_type"]),
                    "medicine_system": clean(row["medicine_system"]),
                    "telephone": clean(row["telephone"]),
                    "mobile_number": clean(row["mobile_number"]),
                    "emergency_number": clean(row["emergency_number"]),
                    "website": clean(row["website"]),
                    "specialties_raw": clean(row["specialties_raw"]),
                    "service_availability": AvailabilityLevel(clean(row["service_availability_default"])),
                    "diagnostic_availability": AvailabilityLevel(clean(row["diagnostic_availability_default"])),
                    "medicine_availability": AvailabilityLevel(clean(row["medicine_availability_default"])),
                }
                await upsert_by_id(db, Facility, clean(row["id"]), values)

            now = datetime.now(timezone.utc)
            for row in services:
                service_id = clean(row["facility_service_id"])
                obj = await db.get(FacilityService, service_id)
                values = {
                    "facility_id": clean(row["facility_id"]),
                    "service_name": clean(row["service_name"]) or "Unknown",
                    "available": bool_value(row["available"]),
                    "capacity_status": CapacityStatus(clean(row["capacity_status"])),
                    "last_updated": dt(row["last_updated"]) if clean(row["last_updated"]) else now,
                }
                if obj is None:
                    db.add(FacilityService(id=service_id, **values))
                else:
                    for key, value in values.items():
                        setattr(obj, key, value)

        print("West Bengal master-data import completed successfully.")
        print(f"  districts:      {len(districts):>6}")
        print(f"  subdistricts:   {len(subdistricts):>6}")
        print(f"  blocks:          {len(blocks):>6}")
        print(f"  local bodies:    {len(local_bodies):>6}")
        print(f"  locations:      {len(locations):>6}")
        print(f"  facilities:     {len(facilities):>6}")
        print(f"  services:       {len(services):>6}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, required=True)
    args = parser.parse_args()
    asyncio.run(import_data(args.data_dir))


if __name__ == "__main__":
    main()
