import asyncio
from app.core.database import AsyncSessionLocal
from app.models.referral import Referral

async def main():
    async with AsyncSessionLocal() as session:
        r = await session.get(Referral, "d496a637-4f0f-415d-9b99-2a0da7c5ecae")
        if r:
            clean_text = "Cardiovascular issues, including heart attacks and coronary artery disease, are the top cause of death for men. Risk factors include high blood pressure, smoking, and high cholesterol."
            print("Before:", r.reason)
            r.reason = clean_text
            await session.commit()
            print("Cleaned successfully!")

if __name__ == "__main__":
    asyncio.run(main())
