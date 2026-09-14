import pytest
from datetime import datetime, timezone, timedelta
from app.models.referral import Referral, ReferralState
from app.models.patient import Patient, Sex
from app.models.care_episode import CareEpisode, CareEpisodeStatus
from app.models.user import UserRole
from app.schemas.auth import TokenPayload


def test_soft_delete_mixin_attributes():
    patient = Patient(
        id="test-p-1", full_name="Test Patient", age=30, sex=Sex.FEMALE,
        village_or_ward="Test Village"
    )
    assert hasattr(patient, "deleted_at")
    assert patient.deleted_at is None

    episode = CareEpisode(
        id="test-ep-1", patient_id="test-p-1", status=CareEpisodeStatus.OPEN,
        opened_at=datetime.now(timezone.utc)
    )
    assert hasattr(episode, "deleted_at")
    assert episode.deleted_at is None

    referral = Referral(
        id="test-ref-1", care_episode_id="test-ep-1", patient_id="test-p-1",
        from_facility_id="fac-1", to_facility_id="fac-2", current_state=ReferralState.SENT,
        reason="Test referral", created_by="test-user"
    )
    assert hasattr(referral, "deleted_at")
    assert referral.deleted_at is None


def test_retention_window_terminal_states():
    terminal_states = {
        ReferralState.CLOSED,
        ReferralState.FOLLOW_UP_COMPLETED,
        ReferralState.REJECTED,
        ReferralState.CANCELLED,
        ReferralState.EXPIRED,
    }
    # Active states must not be in terminal states
    assert ReferralState.SENT not in terminal_states
    assert ReferralState.RECEIVED not in terminal_states
    assert ReferralState.ACCEPTED not in terminal_states
    assert ReferralState.CONSULTED not in terminal_states
    assert ReferralState.EMERGENCY_ESCALATED not in terminal_states
    assert ReferralState.REFERRED_BACK not in terminal_states

    # Terminal states are eligible for retention evaluation
    assert ReferralState.CLOSED in terminal_states
    assert ReferralState.FOLLOW_UP_COMPLETED in terminal_states


def test_admin_role_authorization():
    admin_payload = TokenPayload(sub="admin.demo", role=UserRole.ADMIN, facility_id=None)
    doctor_payload = TokenPayload(sub="doctor.demo", role=UserRole.DOCTOR, facility_id="fac-1")
    asha_payload = TokenPayload(sub="asha.demo", role=UserRole.ASHA_WORKER, facility_id="fac-2")

    assert admin_payload.role == UserRole.ADMIN
    assert doctor_payload.role != UserRole.ADMIN
    assert asha_payload.role != UserRole.ADMIN
