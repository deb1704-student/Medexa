import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import get_db
from tests.test_referral_router_identity_map_regression import _make_referral_fixture

@pytest.mark.asyncio
async def test_referral_fhir_bundle_export(db_session):
    referral = await _make_referral_fixture(db_session)
    await db_session.commit()

    # Direct the FastAPI dependency to the active test database session
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get(f"/referrals/{referral.id}/fhir")
            assert res.status_code == 200, f"Failed with {res.status_code}: {res.text}"
            bundle = res.json()

            # Verify FHIR R4 Bundle structure
            assert bundle["resourceType"] == "Bundle"
            assert bundle["type"] == "collection"
            assert len(bundle["entry"]) >= 2

            # Verify Patient Resource
            patient_entry = bundle["entry"][0]["resource"]
            assert patient_entry["resourceType"] == "Patient"
            assert patient_entry["id"] == referral.patient_id

            # Verify ServiceRequest Resource
            service_req = bundle["entry"][1]["resource"]
            assert service_req["resourceType"] == "ServiceRequest"
            assert service_req["id"] == referral.id
            assert "subject" in service_req
            assert "requester" in service_req
            assert "performer" in service_req
    finally:
        app.dependency_overrides.pop(get_db, None)
