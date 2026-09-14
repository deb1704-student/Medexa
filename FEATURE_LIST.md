# Medexa — Feature Matrix & Functional System Audit

> **Smart Care Continuity for Rural and Underserved Healthcare**  
> Problem Statement ID: **SIH26133** | Smart India Hackathon 2026  
> Date of Audit: September 2026 | Environment: Windows / PostgreSQL 17 / FastAPI / React 18 PWA  

---

## 📑 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Complete Feature List by Domain](#complete-feature-list-by-domain)
3. [System Audit: Functional vs. Mock Analysis](#system-audit-functional-vs-mock-analysis)
4. [Identified Gaps & Technical Debt](#identified-gaps--technical-debt)
5. [Actionable Improvement Roadmap](#actionable-improvement-roadmap)
6. [Verification & Test Commands](#verification--test-commands)

---

## 1. Executive Summary

Medexa is an offline-first public healthcare continuity and referral tracking platform designed for rural frontline workers (ASHAs), Block Medical Officers, and District Health Officials.

- **Automated Test Results**:
  - **Backend (Pytest)**: 39 / 39 tests passing (`pytest tests`)
  - **Frontend (Vitest)**: 18 / 18 tests passing (`npm test -- --run`)
  - **Referral State Machine**: 502 transitions verified legal (`scripts.verify_referral_integrity`)
- **Core Status**: The primary care-continuity pipeline (Intake $\to$ Triage $\to$ Risk Calculation $\to$ 11-State Referral Machine $\to$ SLA Rescue Engine $\to$ Back-Referral $\to$ Home Follow-up Task) is **100% functional and persisted to PostgreSQL**. Secondary support modules (Diagnostics, Drug Inventory, Doctor Rosters, Teleconsultation) are **interactive UI prototypes with local client-side state**.

---

## 2. Complete Feature List by Domain

### 1. 📴 Offline-First Frontline Operation (ASHA Tier)
- **Local Persistence via Dexie.js (IndexedDB)**: Stores patients, care episodes, triage logs, referrals, transitions, and follow-up tasks locally when disconnected.
- **Background Sync Engine (`frontend/src/sync/syncEngine.ts`)**: Automatically queues local writes (`syncQueue`) and pushes to backend REST endpoints with backoff retries upon network reconnection.
- **Live Sync Status Indicator (`SyncIndicator.tsx`)**: Real-time visual indicator displaying offline status, pending queue count, and live sync confirmations.
- **PWA Ready**: Offline caching configured via Service Workers.

### 2. 🆔 Single Immutable Patient Identity & Care Episodes
- **Permanent UUID Identifier**: Every patient is allocated an immutable UUID `patient_id` retained across primary, secondary, and tertiary health tiers.
- **Care Episodes (`/api/care-episodes`)**: Groups clinical events (triage, referrals, lab tests, prescriptions) under a unified `care_episode_id`.
- **Slide-out Patient Record Drawer (`PatientRecordDrawer.tsx`)**: Unified longitudinal view of a patient's historical vitals, past diagnoses, previous referrals, and treatment notes.

### 3. 🩺 Digital Triage & Clinical Decision Support
- **Standardized Vitals & Symptoms Form (`TriageForm.tsx`)**: Digital intake capturing SpO2, blood pressure (systolic/diastolic), pulse rate, body temperature, and clinical observation notes.
- **Rule-Based Clinical Risk Engine (`clinical_risk_engine.py`)**: Transparent, deterministic classification into `LOW`, `MODERATE`, `HIGH`, or `EMERGENCY`.
- **Continuity Risk Scoring (`continuity_risk_engine.py`)**: Evaluates vulnerability based on past travel barriers, missed follow-ups, and referral delays.
- **Instant Referral Conversion**: Severe or high-risk assessments can be immediately converted into pre-filled referral dispatches.

### 4. 🔄 Closed-Loop 11-State Referral State Machine
- **Strict State Progression (`referral_state_machine.py`)**:
  ```text
  DRAFT ➔ SENT ➔ RECEIVED ➔ ACCEPTED ➔ APPOINTMENT_QUEUED ➔ 
  ARRIVED ➔ CONSULTED ➔ REFERRED_BACK ➔ FOLLOW_UP_DUE ➔ FOLLOW_UP_COMPLETED ➔ CLOSED
  ```
  *(Alternative valid branch states: `REJECTED`, `EXPIRED`, `EMERGENCY_ESCALATED`)*.
- **Audit Logging**: Every state change records `changed_by`, `changed_at`, device local timestamps, and clinical notes.
- **Visual Referral Status Stepper (`ReferralStatusStepper.tsx`)**: Step-by-step progress tracker indicating active, past, and upcoming milestones.
- **Multi-parameter Search & Filter (`SearchSortFilter.tsx`)**: Search by patient name, UHID, state filter, and priority sorting.

### 5. ⏱️ Service Level Agreement (SLA) & Automated Rescue Engine
- **Stage-Aware SLA Windows (`sla_engine.py`)**:
  - **Acknowledgement**: Within 6 hours (`SLA_ACKNOWLEDGEMENT_HOURS`)
  - **Appointment**: Within 24 hours (`SLA_APPOINTMENT_HOURS`)
  - **Consultation**: Within 48 hours (`SLA_CONSULTATION_HOURS`)
  - **Back-Referral**: Within 72 hours (`SLA_BACK_REFERRAL_HOURS`)
  - **Home Follow-Up Visit**: Within 168 hours / 7 days (`SLA_FOLLOW_UP_HOURS`)
- **Automated SLA Rescue Actions (`sla_rescue_engine.py`)**:
  - Background detection of overdue referrals without altering clinical diagnoses.
  - Generates `ReferralRescueAction` records (`NOTIFY_REFERRING_WORKER` on initial breach, `ESCALATE_TO_SUPERVISOR` on repeat breaches).
  - Auto-resolves open rescue actions when the referral progresses past the stalled state.
- **Frontend Badges & Countdowns (`slaStatus.ts`)**: Visual statuses for `on_track`, `at_risk` ($\le 2$ hours remaining), and `breached`.

### 6. 🏥 Facility Pathways & Emergency Escalations
- **Care Pathway Recommendation (`facility_pathway.py`)**: Recommends appropriate next-tier facility (Sub-Centre $\to$ PHC $\to$ CHC $\to$ District Hospital).
- **Emergency Escalation Modal (`EmergencyEscalationModal.tsx`)**: Bypasses routine queues to route critical cases directly to tertiary facilities.
- **Facility Scorecards (`FacilityScorecardModal.tsx`)**: Operational view of bed capacity, acceptance rate, and referral processing times.

### 7. 📬 Structured Back-Referral & Post-Discharge Follow-Up
- **Discharge Care Packet**: Captures discharge summary, prescribed medications, warning signs, and post-discharge instructions.
- **Automated Home Visit Tasks**: Generates a scheduled `FollowUpTask` assigned to the originating village ASHA worker due within 48–72 hours.
- **High-Risk Follow-Up Queue (`HighRiskFollowUpPage.tsx`)**: Prioritized checklist for ASHA workers during home visits.

### 8. 💊 Resource, Doctor & Pharmacy Tracking
- **Medicine Availability Tracker (`MedicineAvailabilityPage.tsx`)**: Stock levels and low-stock alerts for essential medicines.
- **ASHA Medicine Dispensing Log (`AshaDispensingLog.tsx`)**: Frontline dispensing records for oral rehydration, basic antibiotics, and iron tablets.
- **Doctor & Specialist Roster (`DoctorAvailabilityPage.tsx`)**: On-duty schedules, on-call specialists, and consultation room allocations.
- **Diagnostics & Lab Queue (`DiagnosticsPage.tsx`)**: Ordering and turnaround tracking for CBC, ECG, chest X-Ray, and ultrasound.
- **Teleconsultation Interface (`TeleconsultationModal.tsx`)**: Virtual consultation window between frontline clinics and hospital specialists.

### 9. 🗺️ Administrative Geography (LGD Hierarchy)
- **Local Government Directory (LGD) Hierarchy**: Standard 5-tier cascading geography:
  $$\text{State} \longrightarrow \text{District} \longrightarrow \text{Sub-District / Block} \longrightarrow \text{Gram Panchayat / Village} \longrightarrow \text{Facility}$$
- **Pre-populated Pilot Geography**: Real West Bengal public health structure (South 24 Parganas, Diamond Harbour, Kakdwip, Sagar, etc.).

### 10. 📊 District Oversight, Analytics & Dashboards
- **Role-Scoped Portals**:
  - **ASHA Frontline Portal** (`/dashboard/referrals/asha`)
  - **Block PHC / CHC Portal** (`/dashboard/referrals/block-office`)
  - **District General Hospital Portal** (`/dashboard/referrals/district-office`)
- **Live Aggregated Metrics (`dashboard_aggregation.py`)**:
  - Referral completion rate (%)
  - Average transit & turnaround times
  - SLA breach counts & compliance percentages
  - Follow-up visit adherence rates
- **Visual Referral Charts (`ReferralCharts.tsx`)**: Funnel stage conversions and volume distribution.

### 11. 🔐 Security, RBAC & Accessibility
- **Role-Based Access Control (RBAC)**: Enforced roles (`ASHA_WORKER`, `DOCTOR`, `DISTRICT_OFFICER`, `ADMIN`) with facility data isolation.
- **Dual Authentication**: 4-digit PIN authentication for frontline ease + standard JWT credentials for administrative access.
- **Multilingual Support (`LanguageSelector.tsx`)**: UI translations for English, Bengali, and Hindi.

---

## 3. System Audit: Functional vs. Mock Analysis

| Feature Area | Backend API & DB | Frontend UI | Operational Assessment |
|---|---|---|---|
| **User Authentication & PIN Login** | ✅ Fully Functional (`/api/auth/login`, `/api/auth/worker-login`) | ✅ Fully Functional (PIN & Demo buttons) | **Production-grade** |
| **Patient Registration & Identity** | ✅ Fully Functional (`/api/patients`) | ✅ Fully Functional (Modal & Drawer) | **Production-grade** |
| **Care Episodes** | ✅ Fully Functional (`/api/care-episodes`) | ✅ Fully Functional | **Production-grade** |
| **Digital Triage & Vitals** | ✅ Fully Functional (`/api/triage`) | ✅ Fully Functional (`TriageForm.tsx`) | **Production-grade** |
| **Clinical & Continuity Risk** | ✅ Fully Functional (Rule engines in Python) | ✅ Fully Functional (Risk badges) | **Production-grade** |
| **Referral Lifecycle Transitions** | ✅ Fully Functional (`/api/referrals`, `/transition`) | ✅ Fully Functional (`ReferralTracker.tsx`) | **Production-grade** |
| **SLA & Rescue Actions** | ✅ Fully Functional (`referral_slas`, `referral_rescue_actions`) | ✅ Fully Functional (Live countdowns) | **Production-grade** |
| **Back-Referral & Follow-ups** | ✅ Fully Functional (`/referrals/back-referral`, `/continuity/follow-ups`) | ✅ Fully Functional (`HighRiskFollowUpPage.tsx`) | **Production-grade** |
| **Offline Synchronization** | ✅ Fully Functional (Batch endpoints) | ✅ Fully Functional (Dexie.js + sync queue) | **Production-grade** |
| **District KPIs & Analytics** | ✅ Fully Functional (`/api/dashboard/facility`) | ✅ Fully Functional (Live metric cards) | **Production-grade** |
| **Diagnostics & Lab Tests** | ❌ No backend model or router | ⚠️ Simulated (uses local `DEFAULT_DISTRICT_DIAGNOSTICS`) | **UI Prototype** (Needs backend API) |
| **Doctor Availability Roster** | ❌ No backend model or router | ⚠️ Simulated (uses local `DEFAULT_DISTRICT_DOCTORS`) | **UI Prototype** (Needs backend API) |
| **Medicine Stock & Inventory** | ❌ No central pharmacy DB table | ⚠️ Simulated (uses local `DEFAULT_DISTRICT_DRUGS`) | **UI Prototype** (Needs backend API) |
| **Teleconsultation** | ❌ No WebRTC / video signaling server | ⚠️ Simulated (Mock video interface & timer) | **UI Prototype** (Needs WebRTC service) |
| **Emergency Ambulance Dispatch** | ⚠️ Updates DB state to `EMERGENCY_ESCALATED` | ⚠️ Simulated SMS / 108 CAD API dispatch | **Hybrid** (State transitions work, SMS is mocked) |

---

## 4. Identified Gaps & Technical Debt

1. **Synthetic Seed Data Foreign Key Inconsistencies**:
   - Running `python -m scripts.verify_dataset_integrity` identifies **6 integrity errors** where `Referral.patient_id` does not match `CareEpisode.patient_id` due to a hardcoded placeholder UUID (`550e8400-e29b-41d4-a716-446655440000`) in historical seed files.
2. **One-Way vs. Bidirectional Sync**:
   - The offline sync engine effectively pushes frontline offline changes **upstream** to the backend.
   - However, changes made at the hospital tier (e.g. doctor accepting a referral) require the frontend to pull latest records via GET requests rather than having an incremental delta-pull engine.
3. **Hybrid Data in Reports Page (`ReportsPage.tsx`)**:
   - The aggregate metric cards at the top load live data from `/api/dashboard/facility`, but the bottom facility breakdown table relies on a static `facilityReports` mock array.

---

## 5. Actionable Improvement Roadmap

### Phase 1: High Priority / Quick Wins
- [ ] **Fix Seed Data Inconsistencies**: Update `seed_operational_demo.py` to ensure `care_episode.patient_id == referral.patient_id` across all synthetic records so `scripts.verify_dataset_integrity` passes with 0 errors.
- [ ] **Connect Reports Breakdown**: Bind `ReportsPage.tsx` facility table directly to the live facility breakdown returned by `referralApi.getDashboard()`.
- [ ] **Simulated Mode Badges**: Add clear visual indicators (*"Demo Prototype / Simulated"*) on Teleconsultation and Emergency CAD Dispatch to distinguish them from the live referral database.

### Phase 2: Medium Priority / Functional Extensions
- [ ] **Backend Persistence for Diagnostics**:
  - Add `DiagnosticOrder` model (`test_name`, `facility_id`, `status`, `ordered_by`, `result_notes`).
  - Add `/api/diagnostics` router and connect to `DiagnosticsPage.tsx`.
- [ ] **Backend Pharmacy & Drug Stock Inventory**:
  - Add `MedicineStock` model (`drug_name`, `facility_id`, `quantity`, `unit`, `reorder_threshold`).
  - Add `/api/medicines` router and link ASHA dispensing to auto-decrement stock.
- [ ] **Doctor Roster API**:
  - Add `DoctorShift` model and `/api/doctors/availability` endpoints.

### Phase 3: Long-Term Enhancements
- [ ] **Full Bidirectional Offline Sync**: Implement timestamp-based delta sync (`GET /api/sync/delta?since=<timestamp>`) for bi-directional offline synchronization.
- [ ] **Real WebRTC Signaling Server**: Add a lightweight WebSocket signaling service for live frontline-to-hospital teleconsultations.

---

## 6. Verification & Test Commands

Run the following commands from the repository root to verify system integrity:

```powershell
# 1. Verify Backend Unit & Risk Engine Tests (39 tests)
cd backend
python -m pytest tests
cd ..

# 2. Verify Frontend Unit Tests (18 tests)
cd frontend
npm test -- --run
cd ..

# 3. Verify Referral State Machine Integrity (502 transitions)
cd backend
python -m scripts.verify_referral_integrity
cd ..

# 4. Run Full Dataset Integrity Checker
cd backend
python -m scripts.verify_dataset_integrity
cd ..
```
