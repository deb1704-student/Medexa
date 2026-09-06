# Medexa

> **Multi-Level Healthcare System — Connected Care from Village to District**  
> Integrated Care Continuity & Referral Intelligence Platform for Rural and Underserved Healthcare.

Medexa is an offline-first healthcare continuity platform designed to address care-continuity failures across public healthcare tiers (Village/ASHA, Block Primary Health Center, and District Hospital).

---

## Repository Structure

```
Medexa-New-frontend/
├── docs/                                  # Canonical architecture & build guides
│   ├── MEDEXA_CANONICAL_PROJECT_CONTEXT.md  # Core project domain context & vision
│   ├── MEDEXA_FRONTEND_MASTER_ARCHITECTURE.md # Frontend architecture & state model
│   └── SIH26133_Complete_Build_Guide.md    # Step-by-step implementation guide
├── frontend/                              # Frontend React + TypeScript PWA application
│   ├── public/                            # Static assets and geo-datasets
│   │   └── geo-data/                      # Precomputed state/district/block/village data
│   ├── scripts/                           # Offline data generators & verification suites
│   │   ├── generate-geo-data.mjs          # Precomputes census-based geo datasets
│   │   ├── verify-geocascade.mjs          # Validates 4-tier geography cascade
│   │   └── verify-rbac.mjs                # Validates RBAC & route protection matrix
│   ├── src/                               # Application source code
│   │   ├── api/                           # API client layer
│   │   ├── auth/                          # Authentication, sessions & RBAC rules
│   │   ├── components/                    # UI components (portals, triage, layout)
│   │   ├── hooks/                         # Custom hooks (sync status, language, etc.)
│   │   ├── i18n/                          # Internationalization dictionaries (EN, HI, BN)
│   │   ├── models/                        # Domain models & referral state machine
│   │   ├── sync/                          # Dexie IndexedDB offline storage & sync queue
│   │   └── utils/                         # Risk calculators & scoring engines
│   ├── .dockerignore                      # Docker ignore rules for frontend build
│   ├── .env.example                       # Template for environment configuration
│   ├── Dockerfile                         # Production-grade multi-stage container build
│   ├── index.html                         # HTML entry point
│   ├── package.json                       # Frontend dependencies and dev scripts
│   ├── tailwind.config.ts                 # Tailwind design tokens & themes
│   └── vite.config.ts                     # Vite bundler & PWA configuration
├── .gitignore                             # Repository-level ignore rules
├── docker-compose.yml                     # Local orchestration configuration
├── package.json                           # Root convenience scripts proxying to frontend
└── README.md                              # This file
```

---

## Quick Start

### Option 1: From Repository Root (Convenience Proxy)

The repository root includes proxy scripts that route commands to `frontend/`:

```bash
# 1. Install dependencies
npm --prefix frontend install

# 2. Start Vite development server
npm run dev

# 3. Build production bundle
npm run build

# 4. Run automated test suites
npm run verify:geo
npm run verify:rbac
```

### Option 2: Directly in `frontend/`

```bash
cd frontend

# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Run type check and production build
npm run build

# Run verification test suites
npm run verify:geo
npm run verify:rbac
```

### Option 3: Running with Docker

```bash
# Build and run the frontend container
docker compose up --build

# Access the application at http://localhost:5173
```

---

## Environment Configuration

Configuration is located in `frontend/.env`. A template is provided in `frontend/.env.example`:

```env
# Frontend API base path (proxies /api to backend service)
VITE_API_BASE_URL=/api
```

---

## Architecture & Verification

- **Role-Based Access Control (RBAC)**: Validates ASHA (village-level), Block MOIC (facility-level), and District Officer permissions. Verify with `npm run verify:rbac`.
- **4-Tier Geography Cascade**: Fast, precomputed census dataset covering State &rarr; District &rarr; Block &rarr; Village/Facility. Verify with `npm run verify:geo`.
- **Offline-First Data Store**: Built with IndexedDB (Dexie) to queue offline triage records and background-sync upon reconnection.
- **Multilingual Support**: Real-time language switching (English, Hindi, Bengali) across public landing and authenticated portals.

For in-depth architectural reasoning, consult the documents in [docs/](docs/).
