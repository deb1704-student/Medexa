import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";

interface FollowUpPatient {
  id: string;
  name: string;
  age: number;
  condition: string;
  risk: "High" | "Moderate";
  followUp: string;
  facility: string;
  status: "Due Today" | "Scheduled" | "Overdue";
}

const PATIENTS: FollowUpPatient[] = [
  {
    id: "P-001",
    name: "Patient A",
    age: 54,
    condition: "Hypertension",
    risk: "High",
    followUp: "Today",
    facility: "Rural Health Center",
    status: "Due Today",
  },
  {
    id: "P-002",
    name: "Patient B",
    age: 42,
    condition: "Diabetes",
    risk: "High",
    followUp: "Tomorrow",
    facility: "District Hospital",
    status: "Scheduled",
  },
  {
    id: "P-003",
    name: "Patient C",
    age: 67,
    condition: "Cardiac Risk",
    risk: "High",
    followUp: "Yesterday",
    facility: "Rural Hospital",
    status: "Overdue",
  },
  {
    id: "P-004",
    name: "Patient D",
    age: 36,
    condition: "High Fever",
    risk: "Moderate",
    followUp: "Sep 8",
    facility: "Community Clinic",
    status: "Scheduled",
  },
];

function statusStyle(status: FollowUpPatient["status"]) {
  if (status === "Overdue") {
    return "bg-red-100 text-red-700";
  }

  if (status === "Due Today") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-green-100 text-green-700";
}

export function HighRiskFollowUpPage() {
  const dueToday = PATIENTS.filter(
    (patient) => patient.status === "Due Today",
  ).length;

  const overdue = PATIENTS.filter(
    (patient) => patient.status === "Overdue",
  ).length;

  const scheduled = PATIENTS.filter(
    (patient) => patient.status === "Scheduled",
  ).length;

  return (
    <div className="min-h-screen bg-background">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <DashboardSidebar />

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="min-h-screen md:ml-64">

        {/* =================================================
            HEADER
            ================================================= */}

        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">

          <p className="text-sm font-medium text-primary">
            District Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold text-on-surface">
            High-Risk Follow-up
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Monitor patients who require timely follow-up after clinical
            assessment and prioritize those needing immediate attention.
          </p>

        </header>

        <div className="p-6 md:p-10">

          {/* =================================================
              SUMMARY CARDS
              ================================================= */}

          <div className="grid gap-5 md:grid-cols-3">

            {/* DUE TODAY */}

            <SummaryCard
              title="Due Today"
              value={dueToday}
              icon="today"
            />

            {/* SCHEDULED */}

            <SummaryCard
              title="Scheduled"
              value={scheduled}
              icon="event_available"
            />

            {/* OVERDUE */}

            <SummaryCard
              title="Overdue"
              value={overdue}
              icon="priority_high"
              danger
            />

          </div>

          {/* =================================================
              PATIENT LIST
              ================================================= */}

          <div className="mt-8 rounded-2xl border border-outline-variant bg-surface p-5 md:p-6">

            {/* SECTION HEADER */}

            <div className="mb-6">

              <h2 className="text-lg font-bold text-on-surface">
                Patients Requiring Follow-up
              </h2>

              <p className="mt-1 text-sm text-on-surface-variant">
                Prioritize patients based on clinical risk and follow-up
                status.
              </p>

            </div>

            {/* =================================================
                COLUMN HEADERS
                ================================================= */}

            <div className="mb-3 hidden px-5 lg:grid lg:grid-cols-[minmax(220px,1.3fr)_110px_120px_minmax(170px,1fr)_220px] lg:items-center lg:gap-5">

              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Patient
              </div>

              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Risk
              </div>

              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Follow-up
              </div>

              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Facility
              </div>

              <div className="text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Status
              </div>

            </div>

            {/* =================================================
                PATIENT ROWS
                ================================================= */}

            <div className="space-y-3">

              {PATIENTS.map((patient) => (
                <div
                  key={patient.id}
                  className="rounded-2xl border border-outline-variant p-5 transition hover:shadow-sm"
                >

                  {/* =================================================
                      DESKTOP FIXED GRID

                      Patient | Risk | Follow-up | Facility | Status/View
                      ================================================= */}

                  <div className="grid items-center gap-5 lg:grid-cols-[minmax(220px,1.3fr)_110px_120px_minmax(170px,1fr)_220px]">

                    {/* =================================================
                        PATIENT
                        ================================================= */}

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-primary">

                        <span className="material-symbols-outlined">
                          person
                        </span>

                      </div>

                      <div className="min-w-0">

                        <p className="truncate font-bold text-on-surface">
                          {patient.name}
                        </p>

                        <p className="text-sm text-on-surface-variant">
                          {patient.id} · {patient.age} years
                        </p>

                        <p className="mt-1 truncate text-sm font-medium text-on-surface">
                          {patient.condition}
                        </p>

                      </div>

                    </div>

                    {/* =================================================
                        RISK
                        ================================================= */}

                    <div>

                      <p className="text-xs text-on-surface-variant lg:hidden">
                        Risk
                      </p>

                      <p
                        className={`mt-1 font-bold ${
                          patient.risk === "High"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {patient.risk}
                      </p>

                    </div>

                    {/* =================================================
                        FOLLOW-UP
                        ================================================= */}

                    <div>

                      <p className="text-xs text-on-surface-variant lg:hidden">
                        Follow-up
                      </p>

                      <p className="mt-1 font-semibold text-on-surface">
                        {patient.followUp}
                      </p>

                    </div>

                    {/* =================================================
                        FACILITY
                        ================================================= */}

                    <div>

                      <p className="text-xs text-on-surface-variant lg:hidden">
                        Facility
                      </p>

                      <p className="mt-1 truncate font-semibold text-on-surface">
                        {patient.facility}
                      </p>

                    </div>

                    {/* =================================================
                        STATUS + VIEW
                        ================================================= */}

                    <div className="flex items-center gap-3 lg:justify-end">

                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${statusStyle(
                          patient.status,
                        )}`}
                      >
                        {patient.status}
                      </span>

                      <Link
                        to={`/episode/${patient.id}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
                      >

                        <span>
                          View
                        </span>

                        <span className="material-symbols-outlined text-[18px]">
                          arrow_forward
                        </span>

                      </Link>

                    </div>

                  </div>

                </div>
              ))}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
  danger?: boolean;
}

function SummaryCard({
  title,
  value,
  icon,
  danger = false,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-6">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-on-surface-variant">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-on-surface">
            {value}
          </p>

        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            danger
              ? "bg-error-container text-error"
              : "bg-gray-200 text-primary"
          }`}
        >

          <span className="material-symbols-outlined">
            {icon}
          </span>

        </div>

      </div>

    </div>
  );
}