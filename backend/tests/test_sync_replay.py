import pytest
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_sync_replay_idempotency(db_session):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        mutation_id = f"test-mutation-{uuid.uuid4()}"
        patient_id = f"pat-{uuid.uuid4().hex[:8]}"

        payload = {
            "client_id": "test_client_asha_1",
            "mutations": [
                {
                    "mutation_id": mutation_id,
                    "action_type": "CREATE_PATIENT",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "payload": {
                        "id": patient_id,
                        "full_name": "Sync Test Patient",
                        "age": 28,
                        "sex": "FEMALE",
                        "village_or_ward": "Nandigram Block 1",
                        "phone": "9876543210"
                    }
                }
            ]
        }

        # 1. First replay - must be APPLIED
        res1 = await ac.post("/api/v1/sync/replay", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["success_count"] == 1
        assert data1["duplicate_count"] == 0
        assert data1["results"][0]["status"] == "APPLIED"

        # 2. Duplicate replay - must be DUPLICATE_SKIPPED
        res2 = await ac.post("/api/v1/sync/replay", json=payload)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["success_count"] == 0
        assert data2["duplicate_count"] == 1
        assert data2["results"][0]["status"] == "DUPLICATE_SKIPPED"
