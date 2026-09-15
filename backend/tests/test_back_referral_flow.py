import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import get_db
from app.core.security import TokenPayload
from app.models.user import UserRole
from app.models.referral import ReferralState, Referral
from app.routers.auth import get_current_user
from tests.test_referral_router_identity_map_regression import _make_referral_fixture

@pytest.mark.asyncio
async def test_full_back_referral_lifecycle(db_session):
    referral = await _make_referral_fixture(db_session)
    referral_id = str(referral.id)
    to_facility_id = str(referral.to_facility_id)

    referral.current_state = ReferralState.CONSULTED
    await db_session.commit()

    async def override_get_db():
        yield db_session

    doctor_role = UserRole.DOCTOR.value if hasattr(UserRole.DOCTOR, "value") else "doctor"
    async def override_get_current_user():
        return TokenPayload(
            sub="test-doctor-1",
            username="dr_sen",
            role=doctor_role,
            facility_id=to_facility_id
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            random_id = uuid.uuid4().hex[:8]
            payload = {
                "id": f"br-{random_id}",
                "referral_id": referral_id,
                "outcome": "DISCHARGED_STABLE",
                "treatment": "IV Fluids and Ceftriaxone completed",
                "medication": ["Cefixime 200mg", "Paracetamol 500mg"],
                "warning_signs": ["Fever > 102F", "Persistent Vomiting"],
                "follow_up_date": "2026-09-21T10:00:00Z",
                "instructions": "Daily temperature check by ASHA worker.",
                "recorded_by": "Dr. Sen",
                "recorded_at": "2026-09-14T18:00:00Z"
            }

            headers = {"Authorization": "Bearer test-mock-token"}
            res = await ac.post("/referrals/back-referral", json=payload, headers=headers)
            if res.status_code == 404:
                res = await ac.post("/api/v1/referrals/back-referral", json=payload, headers=headers)

            assert res.status_code in (200, 201), f"Failed with {res.status_code}: {res.text}"
            data = res.json()
            assert data["outcome"] == "DISCHARGED_STABLE"
            assert len(data["medication"]) == 2

            # Direct database assertion verifying the state change persisted
            db_ref = await db_session.get(Referral, referral_id, populate_existing=True)
            current_str = db_ref.current_state.value if hasattr(db_ref.current_state, "value") else str(db_ref.current_state)
            assert current_str == "REFERRED_BACK"

            # Route response assertion
            ref_res = await ac.get(f"/referrals/{referral_id}", headers=headers)
            if ref_res.status_code == 404:
                ref_res = await ac.get(f"/api/v1/referrals/{referral_id}", headers=headers)

            assert ref_res.status_code == 200
            assert ref_res.json()["current_state"] == "REFERRED_BACK"
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
