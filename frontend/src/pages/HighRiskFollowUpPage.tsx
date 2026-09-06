import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { useAuth } from "@/auth/auth";
import { useLanguageStore } from "@/i18n/useLanguageStore";

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

function getScopedPatients(facility: string, role?: string): FollowUpPatient[] {
  if (role === "DISTRICT") {
    return [
      {
        id: "P-DIST-01",
        name: "Bikash Ghosh",
        age: 58,
        condition: "Post-Myocardial Infarction Tertiary Care",
        risk: "High",
        followUp: "Today",
        facility: facility,
        status: "Due Today",
      },
      {
        id: "P-DIST-02",
        name: "Priya Murmu",
        age: 24,
        condition: "Severe Eclampsia & Post-Operative ICU Care",
        risk: "High",
        followUp: "Today",
        facility: facility,
        status: "Due Today",
      },
      {
        id: "P-DIST-03",
        name: "Subhash Chandra",
        age: 67,
        condition: "Cardiac Ischemia with Refractory Heart Failure",
        risk: "High",
        followUp: "Yesterday",
        facility: facility,
        status: "Overdue",
      },
      {
        id: "P-DIST-04",
        name: "Meenakshi Das",
        age: 50,
        condition: "Tertiary Oncology Referral Care",
        risk: "Moderate",
        followUp: "Tomorrow",
        facility: facility,
        status: "Scheduled",
      },
    ];
  }

  if (role === "BLOCK") {
    return [
      {
        id: "P-BLK-01",
        name: "Rahul Sharma",
        age: 28,
        condition: "Severe Asthma & Acute Respiratory Distress",
        risk: "High",
        followUp: "Today",
        facility: facility,
        status: "Due Today",
      },
      {
        id: "P-BLK-02",
        name: "Anita Devi",
        age: 32,
        condition: "Preeclampsia & Gestational Hypertension",
        risk: "High",
        followUp: "Yesterday",
        facility: facility,
        status: "Overdue",
      },
      {
        id: "P-BLK-03",
        name: "Gopal Mondal",
        age: 61,
        condition: "COPD Acute Exacerbation & Inpatient Care",
        risk: "High",
        followUp: "Tomorrow",
        facility: facility,
        status: "Scheduled",
      },
      {
        id: "P-BLK-04",
        name: "Sunita Roy",
        age: 45,
        condition: "Uncontrolled Type 2 Diabetes with Neuropathy",
        risk: "Moderate",
        followUp: "Sep 12",
        facility: facility,
        status: "Scheduled",
      },
    ];
  }

  // ASHA Village Tier
  return [
    {
      id: "P-VIL-01",
      name: "Anita Devi",
      age: 32,
      condition: "High-Risk Pregnancy (Preeclampsia)",
      risk: "High",
      followUp: "Today",
      facility: facility,
      status: "Due Today",
    },
    {
      id: "P-VIL-02",
      name: "Rahul Sharma",
      age: 28,
      condition: "Severe Asthma & Respiratory Follow-up",
      risk: "High",
      followUp: "Tomorrow",
      facility: facility,
      status: "Scheduled",
    },
    {
      id: "P-VIL-03",
      name: "Maya Bauri",
      age: 44,
      condition: "Severe Anemia (Hb 6.8 g/dL)",
      risk: "High",
      followUp: "Yesterday",
      facility: facility,
      status: "Overdue",
    },
  ];
}

function statusStyle(status: FollowUpPatient["status"]) {
  if (status === "Overdue") {
    return "bg-red-100 text-red-700 border border-red-300";
  }

  if (status === "Due Today") {
    return "bg-yellow-100 text-yellow-800 border border-yellow-300";
  }

  return "bg-emerald-100 text-emerald-800 border border-emerald-300";
}

export function HighRiskFollowUpPage() {
  const { user } = useAuth();
  const { tPortal, language } = useLanguageStore();

  const activeFacility = useMemo(() => {
    if (user?.facilityOrVillage) return user.facilityOrVillage;
    if (user?.facility) return user.facility;
    if (user?.role === "DISTRICT") return "Bankura District General Hospital";
    if (user?.role === "BLOCK") return "Belur Block Primary Health Centre";
    return "Rampur Village / Belur Sector";
  }, [user]);

  const patients = useMemo(() => {
    return getScopedPatients(activeFacility, user?.role);
  }, [activeFacility, user?.role]);

  const dueToday = patients.filter((p) => p.status === "Due Today").length;
  const overdue = patients.filter((p) => p.status === "Overdue").length;
  const scheduled = patients.filter((p) => p.status === "Scheduled").length;

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN CONTENT */}
      <main className="min-h-screen md:ml-64">
        {/* HEADER */}
        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {user?.role === "DISTRICT" ? "District Health Office Command" : user?.role === "BLOCK" ? "Block Health Office" : "ASHA Frontline Portal"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-on-surface">
                {tPortal("highRiskTitle", "High-Risk Follow-up", language)}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {tPortal("highRiskSubtitle", "Prioritize patients requiring immediate clinical attention and monitor adherence across the care continuum.", language)}
              </p>
            </div>

            {/* Scope Badge */}
            <div className="self-start sm:self-auto rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5">
              <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">
                Scoped Facility Jurisdiction
              </span>
              <span className="text-xs font-bold text-primary flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-sm">domain</span>
                <span className="truncate max-w-[240px]">{activeFacility}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-8">
          {/* SUMMARY CARDS */}
          <div className="grid gap-5 md:grid-cols-3">
            <SummaryCard
              title={tPortal("dueToday", "Due for Follow-Up Today")}
              value={dueToday}
              icon="today"
              colorClass="bg-amber-100 text-amber-800"
            />
            <SummaryCard
              title={tPortal("highRisk", "Scheduled")}
              value={scheduled}
              icon="event_available"
              colorClass="bg-emerald-100 text-emerald-800"
            />
            <SummaryCard
              title={tPortal("overdue", "Overdue")}
              value={overdue}
              icon="priority_high"
              colorClass="bg-red-100 text-red-700"
              danger
            />
          </div>

          {/* PATIENT LIST */}
          <div className="rounded-3xl border border-outline-variant bg-surface p-5 md:p-7 shadow-xs">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-outline-variant/60">
              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  {tPortal("totalHighRisk", "Patients Requiring Follow-up")}
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Showing records assigned strictly to <strong className="text-on-surface">{activeFacility}</strong>
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-container border border-outline-variant self-start">
                {patients.length} Active Records
              </span>
            </div>

            {/* COLUMN HEADERS */}
            <div className="mb-3 hidden px-5 lg:grid lg:grid-cols-[minmax(220px,1.3fr)_110px_120px_minmax(190px,1.2fr)_200px] lg:items-center lg:gap-5">
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("patientAndGeo", "Patient")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("triageLevel", "Risk")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("lastContact", "Follow-up")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("facilities", "Facility")}
              </div>
              <div className="text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("status", "Status")}
              </div>
            </div>

            {/* PATIENT ROWS */}
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="rounded-2xl border border-outline-variant p-5 transition hover:shadow-sm hover:border-primary/40 bg-surface-container-lowest"
                >
                  <div className="grid items-center gap-4 lg:grid-cols-[minmax(220px,1.3fr)_110px_120px_minmax(190px,1.2fr)_200px]">
                    {/* PATIENT */}
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
                        <span className="material-symbols-outlined text-xl">person</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface text-sm">
                          {patient.name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {patient.id} · {patient.age} yrs
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-primary">
                          {patient.condition}
                        </p>
                      </div>
                    </div>

                    {/* RISK */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Risk:</span>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          patient.risk === "High"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {patient.risk}
                      </span>
                    </div>

                    {/* FOLLOW-UP */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Follow-up:</span>
                      <span className="text-xs font-bold text-on-surface">
                        {patient.followUp}
                      </span>
                    </div>

                    {/* FACILITY */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Facility:</span>
                      <span className="text-xs font-semibold text-on-surface truncate block" title={patient.facility}>
                        {patient.facility}
                      </span>
                    </div>

                    {/* STATUS + ACTION */}
                    <div className="flex items-center gap-2.5 lg:justify-end">
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle(
                          patient.status
                        )}`}
                      >
                        {patient.status}
                      </span>

                      <Link
                        to={`/episode/${patient.id}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-on-primary transition hover:bg-primary-hover shadow-2xs"
                      >
                        <span>View</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
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

interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
  colorClass: string;
  danger?: boolean;
}

function SummaryCard({ title, value, icon, colorClass, danger = false }: SummaryCardProps) {
  return (
    <div
      className={`rounded-3xl border p-5 sm:p-6 transition shadow-2xs ${
        danger ? "border-red-200 bg-red-50/40" : "border-outline-variant bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {title}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-on-surface tracking-tight">
            {value}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}