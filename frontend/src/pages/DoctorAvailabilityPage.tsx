import { useMemo, useState } from "react";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { useAuth } from "@/auth/auth";
import { useLanguageStore } from "@/i18n/useLanguageStore";

export type DoctorStatus = "Available" | "In Consultation" | "On Leave" | "Off Duty";

export interface DoctorOnDuty {
  id: string;
  name: string;
  specialty: string;
  department: string;
  status: DoctorStatus;
  shift: string;
  room: string;
  facility: string;
}

function getScopedDoctors(facility: string, role?: string): DoctorOnDuty[] {
  if (role === "DISTRICT") {
    return [
      {
        id: "DOC-D-01",
        name: "Dr. A. Sen",
        specialty: "Cardiology & Intensive Care",
        department: "Tertiary Cardiology",
        status: "Available",
        shift: "09:00 AM – 03:00 PM",
        room: "CCU Specialist Chamber 101",
        facility: facility,
      },
      {
        id: "DOC-D-02",
        name: "Dr. S. Chatterjee",
        specialty: "General & Laparoscopic Surgery",
        department: "Surgical Services",
        status: "In Consultation",
        shift: "08:30 AM – 02:30 PM",
        room: "OT Complex & OPD 104",
        facility: facility,
      },
      {
        id: "DOC-D-03",
        name: "Dr. R. N. Mukherjee",
        specialty: "Critical Care & Pulmonology",
        department: "Respiratory & ICU",
        status: "Available",
        shift: "09:00 AM – 04:00 PM",
        room: "ICU Specialist Desk",
        facility: facility,
      },
      {
        id: "DOC-D-04",
        name: "Dr. Sunita Bhattacharya",
        specialty: "Pediatric Neonatology",
        department: "Pediatrics & SNCU",
        status: "In Consultation",
        shift: "09:00 AM – 02:00 PM",
        room: "SNCU Wing Chamber 2",
        facility: facility,
      },
      {
        id: "DOC-D-05",
        name: "Dr. Pradeep Karmakar",
        specialty: "Orthopedics & Trauma Surgery",
        department: "Orthopedic Surgery",
        status: "On Leave",
        shift: "Approved Leave",
        room: "Trauma OPD 108",
        facility: facility,
      },
      {
        id: "DOC-D-06",
        name: "Dr. Alok Nath",
        specialty: "Emergency Medicine",
        department: "108 Triage Command",
        status: "Off Duty",
        shift: "02:00 PM – 09:00 PM (Evening)",
        room: "Emergency Bay 1",
        facility: facility,
      },
    ];
  }

  // Block PHC / CHC
  return [
    {
      id: "DOC-B-01",
      name: "Dr. Anirban Roy",
      specialty: "General Medicine & Health Admin",
      department: "Block Outpatient Department",
      status: "Available",
      shift: "09:00 AM – 02:00 PM",
      room: "BMOH Chamber 1",
      facility: facility,
    },
    {
      id: "DOC-B-02",
      name: "Dr. Meera Banik",
      specialty: "Obstetrics & Gynecology",
      department: "Maternal & Child Health",
      status: "In Consultation",
      shift: "09:00 AM – 02:00 PM",
      room: "Maternity OPD Room 3",
      facility: facility,
    },
    {
      id: "DOC-B-03",
      name: "Dr. Kalyan Mondal",
      specialty: "Pediatrics & Immunization",
      department: "Child Wellness Clinic",
      status: "Available",
      shift: "10:00 AM – 03:00 PM",
      room: "Pediatric Clinic Room 4",
      facility: facility,
    },
    {
      id: "DOC-B-04",
      name: "Dr. Tapan Samanta",
      specialty: "General Duty Medical Officer",
      department: "Inpatient Ward & 108 Triage",
      status: "Off Duty",
      shift: "08:00 PM – 08:00 AM (Night)",
      room: "Inpatient Ward Office",
      facility: facility,
    },
    {
      id: "DOC-B-05",
      name: "Dr. Arundhati Das",
      specialty: "Community Medicine & NCDs",
      department: "Chronic Care Unit",
      status: "Available",
      shift: "09:30 AM – 02:30 PM",
      room: "NCD Clinic Room 2",
      facility: facility,
    },
  ];
}

function statusBadge(status: DoctorStatus) {
  switch (status) {
    case "Available":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "In Consultation":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "On Leave":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "Off Duty":
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

export function DoctorAvailabilityPage() {
  const { user } = useAuth();
  const { tPortal, language } = useLanguageStore();
  const [filter, setFilter] = useState<string>("ALL");

  const activeFacility = useMemo(() => {
    if (user?.facilityOrVillage) return user.facilityOrVillage;
    if (user?.facility) return user.facility;
    if (user?.role === "DISTRICT") return "Bankura District General Hospital";
    return "Belur Block Primary Health Centre";
  }, [user]);

  const doctors = useMemo(() => {
    return getScopedDoctors(activeFacility, user?.role);
  }, [activeFacility, user?.role]);

  const availableCount = doctors.filter((d) => d.status === "Available").length;
  const inConsultCount = doctors.filter((d) => d.status === "In Consultation").length;
  const offDutyCount = doctors.filter((d) => d.status === "Off Duty" || d.status === "On Leave").length;

  const filteredDoctors = useMemo(() => {
    if (filter === "ALL") return doctors;
    return doctors.filter((d) => d.status === filter);
  }, [doctors, filter]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="min-h-screen md:ml-64">
        {/* HEADER */}
        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {user?.role === "DISTRICT" ? "Tertiary Command & Specialist Duty" : "Block Medical Officer Duty Roster"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-on-surface">
                {tPortal("doctorAvailabilityTitle", "Doctor Availability", language)}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {tPortal("doctorAvailabilitySubtitle", "Real-time duty status and department coverage", language)}
              </p>
            </div>

            <div className="self-start sm:self-auto rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5">
              <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">
                Duty Roster Facility
              </span>
              <span className="text-xs font-bold text-primary flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-sm">local_hospital</span>
                <span className="truncate max-w-[240px]">{activeFacility}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-8">
          {/* KPI CARDS (PRESERVED 3-CARD PATTERN) */}
          <div className="grid gap-5 md:grid-cols-3">
            <div
              onClick={() => setFilter(filter === "Available" ? "ALL" : "Available")}
              className={`cursor-pointer rounded-3xl border p-5 sm:p-6 transition shadow-2xs ${
                filter === "Available"
                  ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500"
                  : "border-outline-variant bg-surface hover:border-emerald-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {tPortal("availableNow", "Available Now")}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-700 tracking-tight">
                    {availableCount}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-800 font-semibold">{tPortal("readyForPatients", "Ready for patient consultations")}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => setFilter(filter === "In Consultation" ? "ALL" : "In Consultation")}
              className={`cursor-pointer rounded-3xl border p-5 sm:p-6 transition shadow-2xs ${
                filter === "In Consultation"
                  ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500"
                  : "border-outline-variant bg-surface hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {tPortal("inConsultation", "In Consultation")}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-blue-700 tracking-tight">
                    {inConsultCount}
                  </p>
                  <p className="mt-1 text-[11px] text-blue-800 font-semibold">{tPortal("activeConsultations", "Actively examining patients")}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                  <span className="material-symbols-outlined text-2xl">stethoscope</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => setFilter(filter === "Off Duty" ? "ALL" : "Off Duty")}
              className={`cursor-pointer rounded-3xl border p-5 sm:p-6 transition shadow-2xs ${
                filter === "Off Duty"
                  ? "border-slate-500 bg-slate-100 ring-2 ring-slate-500"
                  : "border-outline-variant bg-surface hover:border-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {tPortal("offDuty", "Off Duty / On Leave")}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-700 tracking-tight">
                    {offDutyCount}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600 font-semibold">{tPortal("shiftEnded", "Shift ended or on approved leave")}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-700">
                  <span className="material-symbols-outlined text-2xl">schedule</span>
                </div>
              </div>
            </div>
          </div>

          {/* DOCTOR ROSTER TABLE */}
          <div className="rounded-3xl border border-outline-variant bg-surface p-5 md:p-7 shadow-xs">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/60">
              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  {tPortal("doctorRoster", "Clinical Duty Roster")}
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Verified roster for <strong className="text-on-surface">{activeFacility}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {filter !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setFilter("ALL")}
                    className="text-xs font-bold text-primary underline"
                  >
                    {tPortal("clear", "Clear Filter")}
                  </button>
                )}
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-container border border-outline-variant">
                  {filteredDoctors.length} {filteredDoctors.length === 1 ? "Doctor" : "Doctors"} Listed
                </span>
              </div>
            </div>

            {/* COLUMN HEADERS */}
            <div className="mb-3 hidden px-5 lg:grid lg:grid-cols-[minmax(220px,1.2fr)_minmax(180px,1.1fr)_160px_160px_140px] lg:items-center lg:gap-5">
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("doctorName", "Doctor Name")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("specialty", "Specialty / Department")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("room", "Room / Desk")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("shiftHours", "Duty Shift")}
              </div>
              <div className="text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("status", "Current Status")}
              </div>
            </div>

            {/* DOCTOR ROWS */}
            <div className="space-y-3">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-outline-variant p-5 transition hover:shadow-sm hover:border-primary/40 bg-surface-container-lowest"
                >
                  <div className="grid items-center gap-4 lg:grid-cols-[minmax(220px,1.2fr)_minmax(180px,1.1fr)_160px_160px_140px]">
                    {/* DOCTOR NAME */}
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
                        <span className="material-symbols-outlined text-xl">medical_services</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface text-sm">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          Reg ID: {doc.id}
                        </p>
                      </div>
                    </div>

                    {/* SPECIALTY / DEPT */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Specialty:</span>
                      <p className="text-xs font-bold text-on-surface truncate">
                        {doc.specialty}
                      </p>
                      <p className="text-[11px] text-on-surface-variant truncate">
                        {doc.department}
                      </p>
                    </div>

                    {/* ROOM */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Room:</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface">
                        <span className="material-symbols-outlined text-xs text-on-surface-variant">door_front</span>
                        <span>{doc.room}</span>
                      </span>
                    </div>

                    {/* SHIFT */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Shift:</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        <span>{doc.shift}</span>
                      </span>
                    </div>

                    {/* STATUS BADGE */}
                    <div className="flex items-center lg:justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge(
                          doc.status
                        )}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            doc.status === "Available"
                              ? "bg-emerald-500 animate-pulse"
                              : doc.status === "In Consultation"
                              ? "bg-blue-500"
                              : doc.status === "On Leave"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          }`}
                        />
                        <span>{doc.status}</span>
                      </span>
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
