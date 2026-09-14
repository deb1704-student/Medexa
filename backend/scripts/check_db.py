import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def check():
    async with AsyncSessionLocal() as db:
        r = await db.execute(text("SELECT COUNT(*) FROM facilities"))
        print(f"Facilities: {r.scalar()}")
        r2 = await db.execute(text("SELECT COUNT(*) FROM users"))
        print(f"Users: {r2.scalar()}")
        r3 = await db.execute(text("SELECT COUNT(*) FROM referrals"))
        print(f"Referrals: {r3.scalar()}")
        r4 = await db.execute(text("SELECT id FROM facilities WHERE id IN ('MED-WB-FAC-000372', 'MED-WB-FAC-000003', 'MED-WB-FAC-000349')"))
        found = [row[0] for row in r4.fetchall()]
        print(f"Key facilities present: {found}")

asyncio.run(check())
