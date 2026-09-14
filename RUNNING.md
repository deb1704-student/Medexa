# Medexa — Verified Run Guide

Complete, verified operational guide to running Medexa (PostgreSQL + FastAPI Backend + React/Vite Frontend) end-to-end on Windows.

All commands and configurations in this guide have been tested and verified on this system.

---

## ⚡ Quick Start (One Command)

If PostgreSQL and Python packages are installed, launch all services with:

```powershell
npm run dev:all
```
*(or run `powershell -ExecutionPolicy Bypass -File ./scripts/start-all.ps1` from the repo root)*

This automatically:
1. Verifies/starts PostgreSQL on port `5432`
2. Starts the FastAPI backend on `http://127.0.0.1:8000`
3. Starts the Vite frontend on `http://localhost:5173`

---

## 📋 Prerequisites & Verified Versions

| Tool | Recommended Version | Tested & Verified In This Run | Binary Location / Command |
|------|-------------------|-------------------------------|---------------------------|
| **Node.js** | 18+ (LTS) | `v24.16.0` | `node -v` (`C:\Program Files\nodejs\node.exe`) |
| **npm** | 9+ | `11.13.0` | `npm -v` |
| **Python** | 3.10 - 3.13 | `3.13.9` | `python --version` (`C:\Users\souvi\anaconda3\python.exe`) |
| **PostgreSQL** | 15 - 17 | `17.11` (x86_64 portable) | `& "$env:USERPROFILE\pgsql\bin\postgres.exe"` |

---

## 🚀 Step-by-Step Bring-Up & Verification

### Step 1. Database: Start PostgreSQL & Verify Connectivity

1. **Check if PostgreSQL is running:**
   ```powershell
   & "$env:USERPROFILE\pgsql\bin\pg_isready.exe" -h 127.0.0.1 -p 5432
   ```

2. **Start PostgreSQL server (Portable Binaries):**
   ```powershell
   & "$env:USERPROFILE\pgsql\bin\pg_ctl.exe" -D "$env:USERPROFILE\pgsql\data" -l "$env:USERPROFILE\pgsql\data\server.log" start
   ```
   *Alternative direct process:*
   ```powershell
   & "$env:USERPROFILE\pgsql\bin\postgres.exe" -D "$env:USERPROFILE\pgsql\data"
   ```

3. **Verify Database Connectivity & Tables:**
   ```powershell
   & "$env:USERPROFILE\pgsql\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -d medexa -c "\dt"
   ```

4. **Verify Demo Workers:**
   ```powershell
   & "$env:USERPROFILE\pgsql\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -d medexa -c "SELECT worker_id, name, role FROM workers;"
   ```

---

### Step 2. Environment Configuration

#### Backend Configuration: `backend/.env`
Ensure `backend/.env` exists and contains:
```ini
DATABASE_URL=postgresql+asyncpg://medexa_user:medexa_pass@localhost:5432/medexa
DATABASE_URL_SYNC=postgresql+psycopg2://medexa_user:medexa_pass@localhost:5432/medexa
JWT_SECRET_KEY=replace-this-with-a-real-random-secret-before-any-real-deployment
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=720
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]

COMPLETION_RATE_ALERT_BELOW_PERCENT=80.0
FOLLOW_UP_COMPLIANCE_ALERT_BELOW_PERCENT=70.0
REFERRAL_DELAY_ALERT_ABOVE_HOURS=12.0

CLINICAL_RISK_HIGH_THRESHOLD=6
CLINICAL_RISK_MODERATE_THRESHOLD=3

CONTINUITY_RISK_HIGH_THRESHOLD=6
CONTINUITY_RISK_MEDIUM_THRESHOLD=3

SLA_ACKNOWLEDGEMENT_HOURS=6
SLA_APPOINTMENT_HOURS=24
SLA_CONSULTATION_HOURS=48
SLA_BACK_REFERRAL_HOURS=72
SLA_FOLLOW_UP_HOURS=168
```

#### Frontend Configuration: `frontend/.env`
Ensure `frontend/.env` exists and contains:
```ini
VITE_API_BASE_URL=/api
```
*(Vite dev server in `frontend/vite.config.ts` proxies `/api/*` to `http://localhost:8000/*` with CORS enabled).*

---

### Step 3. Pin `bcrypt` / `passlib` & Install Dependencies

1. **Verify installed versions:**
   ```powershell
   pip show bcrypt passlib
   ```

2. **Enforce exact version pinning:**
   ```powershell
   pip install --force-reinstall "bcrypt==4.0.1" "passlib[bcrypt]>=1.7.4"
   ```

3. **Install all backend requirements:**
   ```powershell
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Verify that the backend server, migration tool, and seed script use the same Python interpreter:**
   ```powershell
   python -c "import bcrypt, passlib; print('bcrypt:', bcrypt.__version__, '| passlib:', passlib.__version__)"
   ```

---

### Step 4. Run Migrations & Seed Data

1. **Apply Alembic migrations:**
   ```powershell
   cd backend
   python -m alembic upgrade head
   ```

2. **Seed or Re-seed Operational Demo Data:**
   ```powershell
   python -m scripts.clean_and_reseed
   cd ..
   ```

3. **Confirm worker accounts in database:**
   ```powershell
   & "$env:USERPROFILE\pgsql\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -d medexa -c "SELECT worker_id, name, role FROM workers;"
   ```

---

### Step 5. Start Backend & Frontend

#### Terminal 1: Backend Server (FastAPI)
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Health Check: `http://localhost:8000/health` (Returns `{"status": "ok"}`)
- API Documentation: `http://localhost:8000/docs`

#### Terminal 2: Frontend Server (Vite)
```powershell
cd frontend
npm run dev
```
- Application Portal: `http://localhost:5173`

---

## 🔑 Demo Login Credentials

The frontend provides dedicated portal entry points for each tier of the public-health referral chain:

| Care Tier / Role | Frontend Portal URL | Frontline Worker ID | PIN | Backend Account | Password | Role Description & Scope |
|------------------|---------------------|---------------------|-----|-----------------|----------|--------------------------|
| **ASHA Worker** | `http://localhost:5173/login/asha` | `ASHA-WB-401` | `1234` | `asha.demo` | `demo1234` | Kavita Roy • Rampur / Shibpur Village, Maharajganj PHC |
| **CHC / PHC Doctor** | `http://localhost:5173/login/block` | `BHO-WB-204` | `4321` | `doctor.demo` | `demo1234` | Dr. Anirban Roy • Dwariknagar Rural Hospital (CHC) |
| **Regional / District Hospital** | `http://localhost:5173/login/district` | `CMOH-DIST-101` | `5678` | `officer.demo` | `demo1234` | Dr. A. Sen • South 24 Parganas District General Hospital |

*Note: The frontend login forms include convenient one-click "Use Demo" buttons that automatically pre-fill the corresponding Worker ID and PIN.*

---

## 🧪 End-to-End Verification Checklist

Run through these verified test scenarios:

1. **ASHA Login (`ASHA-WB-401` / `1234`):**
   - Access `http://localhost:5173/login/asha`, submit credentials.
   - Lands on `/dashboard/referrals/asha`.
   - Browser Network tab confirms zero 401 Unauthorized responses.

2. **CHC Doctor Login (`BHO-WB-204` / `4321`):**
   - Access `http://localhost:5173/login/block`, submit credentials.
   - Lands on `/dashboard/referrals/block-office`.

3. **Regional Hospital Login (`CMOH-DIST-101` / `5678`):**
   - Access `http://localhost:5173/login/district`, submit credentials.
   - Lands on `/dashboard/referrals/district-office` or `/dashboard`.

4. **Wrong PIN Rejection:**
   - Attempt login on any portal with an incorrect PIN (e.g. `9999`).
   - Displays generic rejection: `"Invalid Worker ID or PIN for this portal."` without leaking credential specifics.

5. **Cross-Role URL Access Rejection:**
   - While logged in as ASHA, navigate directly by URL to `http://localhost:5173/dashboard/referrals/block-office`.
   - Blocked by `ProtectedRoute` and redirected to `/access-denied`.

6. **Real Referral Flow & Data Persistence:**
   - As ASHA, complete a Digital Triage Assessment and submit a Referral to Dwariknagar CHC (`MED-WB-FAC-000003`).
   - Confirm referral appears in ASHA's case list with status `SENT`.
   - Log out and log in as CHC Doctor (`BHO-WB-204`). Confirm referral appears in the CHC Admission / Referral Queue.
   - Accept referral (status updates to `ACCEPTED`), then generate a Back-Referral (status updates to `CLOSED`).
   - Log out and re-login as ASHA. Confirm the referral is still present and updated in PostgreSQL.

7. **Automated E2E Verification Suite:**
   - Run the automated 15-check end-to-end verification script:
     ```powershell
     python "C:\Users\souvi\.gemini\antigravity-ide\brain\74e65d0b-9864-4932-b841-434b6d4da850\scratch\verify_e2e_full.py"
     ```

---

## 🛠️ Troubleshooting & Known Gotchas

### 1. `AttributeError: module 'bcrypt' has no attribute '__about__'`
- **Root Cause:** `passlib 1.7.4` relies on internal attributes of `bcrypt` that were removed in `bcrypt >= 5.0.0`.
- **Fix:** Pin and reinstall `bcrypt==4.0.1`:
  ```powershell
  python -m pip install --force-reinstall "bcrypt==4.0.1"
  ```
  Ensure all running processes (backend server, migration tools, seed scripts) are launched using the **exact same** Python interpreter (`python --version`).

### 2. `ConnectionRefusedError: [WinError 1225] The remote computer refused the network connection`
- **Root Cause:** PostgreSQL portable server is not running or listening on port `5432`.
- **Fix:** Check readiness and start the server:
  ```powershell
  & "$env:USERPROFILE\pgsql\bin\pg_isready.exe" -h 127.0.0.1 -p 5432
  & "$env:USERPROFILE\pgsql\bin\pg_ctl.exe" -D "$env:USERPROFILE\pgsql\data" -l "$env:USERPROFILE\pgsql\data\server.log" start
  ```

### 3. Missing tables / `relation "users" does not exist`
- **Root Cause:** Alembic migrations have not been run on a newly initialized database.
- **Fix:** In `backend/`, run:
  ```powershell
  python -m alembic upgrade head
  python -m scripts.seed_operational_demo
  ```

### 4. API calls returning 404 or CORS errors in browser
- **Root Cause:** Missing proxy rewrite in Vite dev server or mismatched `VITE_API_BASE_URL`.
- **Fix:**
  - Verify `frontend/.env` has `VITE_API_BASE_URL=/api`.
  - Verify `backend/.env` has `CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]`.
  - Vite dev server automatically proxies `/api/*` to `http://localhost:8000/*` with prefix stripping.
