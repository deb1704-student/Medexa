import asyncio
from app.core.database import AsyncSessionLocal
from app.models.facility import Facility

async def main():
    async with AsyncSessionLocal() as session:
        for fid in ["MED-WB-FAC-000372", "MED-WB-FAC-000003"]:
            f = await session.get(Facility, fid)
            if f:
                print(f"ID: {f.id}, Name: {f.name}, Type: {f.facility_type}, Subdist: {f.subdistrict}, Dist: {f.district}")
            else:
                print(f"Facility {fid} not found")

if __name__ == "__main__":
    asyncio.run(main())
