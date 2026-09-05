import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { PatientEpisodePage } from "@/pages/PatientEpisodePage";
import { DistrictDashboardPage } from "@/pages/DistrictDashboardPage";
import { DigitalTriagePage } from "@/pages/DigitalTriagePage";
import { ReferralsPage } from "@/pages/ReferralsPage";
import { ReferralDetailsPage } from "@/pages/ReferralDetailsPage";
import { FacilitiesPage } from "@/pages/FacilitiesPage";
import { MedicineAvailabilityPage } from "@/pages/MedicineAvailabilityPage";
import { DiagnosticsPage } from "@/pages/DiagnosticsPage";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { HighRiskFollowUpPage } from "@/pages/HighRiskFollowUpPage";
import { ReportsPage } from "@/pages/ReportsPage";

import { BrandMark } from "@/components/common/BrandMark";

import "@/styles/globals.css";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/episode/:careEpisodeId"
          element={<PatientEpisodePage />}
        />

        <Route
          path="/episode/:careEpisodeId/triage"
          element={<DigitalTriagePage />}
        />

        <Route
          path="/dashboard"
          element={<DistrictDashboardPage />}
        />

        <Route
          path="/dashboard/referrals"
          element={<ReferralsPage />}
        />

        <Route
          path="/dashboard/referrals/:referralId"
          element={<ReferralDetailsPage />}
        />

        <Route
          path="/dashboard/facilities"
          element={<FacilitiesPage />}
        />
        <Route
        path="/dashboard/medicines"
        element={<MedicineAvailabilityPage />}
        />

        <Route
        path="/dashboard/diagnostics"
        element={<DiagnosticsPage />}
        />

        <Route
        path="/dashboard/appointments"
        element={<AppointmentsPage />}
        />

        <Route
        path="/dashboard/follow-up"
        element={<HighRiskFollowUpPage />}
        />
        <Route
          path="/dashboard/reports"
          element={<ReportsPage />}
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

/* =========================================================
   HOME PAGE
   ========================================================= */

function HomePage() {
  const demoEpisodeId =
    "550e8400-e29b-41d4-a716-446655440002";

  return (
    <div className="min-h-screen bg-[#f5f9f8] text-on-background">

      {/* HEADER */}
      <header className="relative z-20 border-b border-outline-variant bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-[90px] max-w-7xl items-center px-5 md:px-8">
          <Link to="/" className="block">
            <BrandMark />
          </Link>
        </div>
      </header>

      {/* MAIN HERO */}
      <main className="relative min-h-[calc(100vh-150px)] overflow-hidden">

        {/* BACKGROUND IMAGE */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/medical-bg.png')",
            opacity: 0.95,
          }}
        />

        {/* LIGHT OVERLAY */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

        {/* BOTTOM FADE */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f5f9f8] to-transparent" />

        {/* CONTENT */}
        <div className="relative z-10 mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-24">

          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">

            {/* =================================================
                LEFT SIDE
                ================================================= */}

            <section className="max-w-3xl">

              {/* BADGE */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-5 py-2.5 text-sm font-semibold text-primary shadow-sm backdrop-blur-md">

                <span className="material-symbols-outlined text-[19px]">
                  health_and_safety
                </span>

                Public Healthcare Continuity Platform

              </div>

              {/* HEADING */}
              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-[#111918] md:text-6xl lg:text-[64px]">

                Continuity of care,

                <span className="block text-primary">
                  wherever care happens.
                </span>

              </h1>

              {/* DESCRIPTION */}
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#344342] md:text-xl">

                Medexa helps frontline health workers assess patients,
                coordinate referrals and follow up on care —

                <span className="block">
                  even when connectivity is limited.
                </span>

              </p>

              {/* BUTTONS */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">

                {/* OPEN PATIENT EPISODE */}
                <Link
                  to={`/episode/${demoEpisodeId}`}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-base font-bold text-on-primary shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <span className="material-symbols-outlined">
                    person
                  </span>

                  Open Patient Episode
                </Link>

                {/* DISTRICT DASHBOARD */}
                <Link
                  to="/dashboard"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-primary/40 bg-white/70 px-8 py-3 text-base font-bold text-primary shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md"
                >
                  <span className="material-symbols-outlined">
                    dashboard
                  </span>

                  District Dashboard
                </Link>

              </div>

            </section>

            {/* =================================================
                RIGHT SIDE — TODAY'S WORKFLOW
                ================================================= */}

            <section className="relative">

              {/* SOFT GLOW */}
              <div className="absolute -inset-5 rounded-[3rem] bg-white/5 blur-3xl" />

              {/* WORKFLOW PANEL */}
              <div className="relative rounded-[2rem] border border-white/30 bg-white/5 p-6 shadow-xl backdrop-blur-[2px] md:p-7">

                {/* WORKFLOW HEADER */}
                <div className="mb-7 flex items-start justify-between">

                  <div>

                    <p className="text-base font-semibold text-[#3f4b4a]">
                      Care Continuity
                    </p>

                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#111918]">
                      Today's workflow
                    </h2>

                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-md">

                    <span className="material-symbols-outlined text-[28px]">
                      medical_services
                    </span>

                  </div>

                </div>

                {/* =================================================
                    DIGITAL TRIAGE
                    ================================================= */}

                <Link
                  to={`/episode/${demoEpisodeId}/triage`}
                  className="group block rounded-2xl border border-white/40 bg-white/25 p-5 shadow-sm backdrop-blur-[1px] transition hover:-translate-y-0.5 hover:bg-white/35 hover:shadow-md"
                >

                  <div className="flex items-center gap-5">

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-container/80 text-primary">

                      <span className="material-symbols-outlined text-[30px]">
                        clinical_notes
                      </span>

                    </div>

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <span className="text-sm font-bold text-primary">
                          01
                        </span>

                        <p className="text-lg font-bold text-[#111918]">
                          Digital Triage
                        </p>

                      </div>

                      <p className="mt-1 text-sm leading-6 text-[#4c5655]">
                        Assess risk and identify patients needing attention.
                      </p>

                    </div>

                  </div>

                </Link>

                {/* =================================================
                    SMART REFERRAL
                    ================================================= */}

                <Link
                  to="/dashboard/referrals"
                  className="group mt-4 block rounded-2xl border border-white/40 bg-white/25 p-5 shadow-sm backdrop-blur-[1px] transition hover:-translate-y-0.5 hover:bg-white/35 hover:shadow-md"
                >

                  <div className="flex items-center gap-5">

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-container/80 text-primary">

                      <span className="material-symbols-outlined text-[30px]">
                        account_tree
                      </span>

                    </div>

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <span className="text-sm font-bold text-primary">
                          02
                        </span>

                        <p className="text-lg font-bold text-[#111918]">
                          Smart Referral
                        </p>

                      </div>

                      <p className="mt-1 text-sm leading-6 text-[#4c5655]">
                        Connect patients with the appropriate facility.
                      </p>

                    </div>

                  </div>

                </Link>

                {/* =================================================
                    REFERRAL TRACKING
                    ================================================= */}

                <Link
                  to="/dashboard/referrals"
                  className="group mt-4 block rounded-2xl border border-white/40 bg-white/25 p-5 shadow-sm backdrop-blur-[1px] transition hover:-translate-y-0.5 hover:bg-white/35 hover:shadow-md"
                >

                  <div className="flex items-center gap-5">

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-container/80 text-primary">

                      <span className="material-symbols-outlined text-[30px]">
                        route
                      </span>

                    </div>

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <span className="text-sm font-bold text-primary">
                          03
                        </span>

                        <p className="text-lg font-bold text-[#111918]">
                          Referral Tracking
                        </p>

                      </div>

                      <p className="mt-1 text-sm leading-6 text-[#4c5655]">
                        Follow the patient's journey until care is completed.
                      </p>

                    </div>

                  </div>

                </Link>

                {/* =================================================
                    OFFLINE READY
                    ================================================= */}

                <div className="mt-5 rounded-2xl bg-slate-100/20 p-5 backdrop-blur-[1px]">

                  <div className="flex items-center gap-5">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/50 text-primary shadow-sm">

                      <span className="material-symbols-outlined text-[28px]">
                        wifi_off
                      </span>

                    </div>

                    <div>

                      <p className="text-base font-bold text-[#111918]">
                        Offline-ready
                      </p>

                      <p className="mt-1 text-sm text-[#4c5655]">
                        Work continues when connectivity is unavailable.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </section>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-20 border-t border-outline-variant bg-white/80 backdrop-blur">

        <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">

          <p className="text-sm text-on-surface-variant">
            © 2026 Medexa — Supporting stronger continuity in public healthcare.
          </p>

        </div>

      </footer>

    </div>
  );
}

/* =========================================================
   NOT FOUND PAGE
   ========================================================= */

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">

      <div className="text-center">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-on-primary">

          <span className="material-symbols-outlined text-[30px]">
            medical_services
          </span>

        </div>

        <h1 className="mt-6 text-4xl font-bold text-on-surface">
          Page not found
        </h1>

        <p className="mt-3 text-on-surface-variant">
          The page you are looking for does not exist.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary"
        >
          <span className="material-symbols-outlined">
            home
          </span>

          Return to Main Page
        </Link>

      </div>

    </div>
  );
}