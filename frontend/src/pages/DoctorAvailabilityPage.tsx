import { useMemo, useState, useEffect } from "react";
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

const DEFAULT_DISTRICT_DOCTORS: DoctorOnDuty[] = [
  {
    id: "DOC-D-01",
    name: "Dr. A. Sen",
    specialty: "Cardiology & Intensive Care",
    department: "Tertiary Cardiology",
    status: "Available",
    shift: "09:00 AM – 03:00 PM",
    room: "CCU Specialist Chamber 101",
    facility: "Diamond Harbour DH",
  },
  {
    id: "DOC-D-02",
    name: "Dr. S. Chatterjee",
    specialty: "General & Laparoscopic Surgery",
    department: "Surgical Services",
    status: "In Consultation",
    shift: "08:30 AM – 02:30 PM",
    room: "OT Complex & OPD 104",
    facility: "Diamond Harbour DH",
  },
  {
    id: "DOC-D-03",
    name: "Dr. R. N. Mukherjee",
    specialty: "Critical Care & Pulmonology",
    department: "Respiratory & ICU",
    status: "Available",
    shift: "09:00 AM – 04:00 PM",
    room: "ICU Specialist Desk",
    facility: "Diamond Harbour DH",
  },
  {
    id: "DOC-D-04",
    name: "Dr. Sunita Bhattacharya",
    specialty: "Pediatric Neonatology",
    department: "Pediatrics & SNCU",
    status: "In Consultation",
    shift: "09:00 AM – 02:00 PM",
    room: "SNCU Wing Chamber 2",
    facility: "Diamond Harbour DH",
  },
  {
    id: "DOC-D-05",
    name: "Dr. Pradeep Karmakar",
    specialty: "Orthopedics & Trauma Surgery",
    department: "Orthopedic Surgery",
    status: "On Leave",
    shift: "Approved Leave",
    room: "Trauma OPD 108",
    facility: "Diamond Harbour DH",
  },
  {
    id: "DOC-D-06",
    name: "Dr. Alok Nath",
    specialty: "Emergency Medicine",
    department: "108 Triage Command",
    status: "Off Duty",
    shift: "02:00 PM – 09:00 PM (Evening)",
    room: "Emergency Bay 1",
    facility: "Diamond Harbour DH",
  },
];

const DEFAULT_CHC_DOCTORS: DoctorOnDuty[] = [
  {
    id: "DOC-B-01",
    name: "Dr. Anirban Roy",
    specialty: "General Medicine & Health Admin",
    department: "CHC Outpatient Department",
    status: "Available",
    shift: "09:00 AM – 02:00 PM",
    room: "MOIC Chamber 1",
    facility: "Dwariknagar Rural Hospital",
  },
  {
    id: "DOC-B-02",
    name: "Dr. Meera Banik",
    specialty: "Obstetrics & Gynecology",
    department: "Maternal & Child Health",
    status: "In Consultation",
    shift: "09:00 AM – 02:00 PM",
    room: "Maternity OPD Room 3",
    facility: "Dwariknagar Rural Hospital",
  },
  {
    id: "DOC-B-03",
    name: "Dr. Kalyan Mondal",
    specialty: "Pediatrics & Immunization",
    department: "Child Wellness Clinic",
    status: "Available",
    shift: "10:00 AM – 03:00 PM",
    room: "Pediatric Clinic Room 4",
    facility: "Dwariknagar Rural Hospital",
  },
  {
    id: "DOC-B-04",
    name: "Dr. Tapan Samanta",
    specialty: "General Duty Medical Officer",
    department: "Inpatient Ward & 108 Triage",
    status: "Off Duty",
    shift: "08:00 PM – 08:00 AM (Night)",
    room: "Inpatient Ward Office",
    facility: "Dwariknagar Rural Hospital",
  },
  {
    id: "DOC-B-05",
    name: "Dr. Arundhati Das",
    specialty: "Community Medicine & NCDs",
    department: "Chronic Care Unit",
    status: "Available",
    shift: "09:30 AM – 02:30 PM",
    room: "NCD Clinic Room 2",
    facility: "Dwariknagar Rural Hospital",
  },
];

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
  const isDistrict = user?.role === "DISTRICT";

  const [filter, setFilter] = useState<string>("ALL");
  const [currentTime, setCurrentTime] = useState(new Date());

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeFacility = useMemo(() => {
    if (user?.facilityOrVillage) return user.facilityOrVillage;
    if (user?.facility) return user.facility;
    return isDistrict ? "Diamond Harbour DH" : "Dwariknagar Rural Hospital";
  }, [user, isDistrict]);

  const storageKey = useMemo(() => {
    const rolePrefix = isDistrict ? "DISTRICT" : "CHC";
    const facilitySlug = activeFacility.replace(/\s+/g, "_").toLowerCase();
    return `medexa_doctors_${rolePrefix}_${facilitySlug}`;
  }, [isDistrict, activeFacility]);

  const [doctors, setDoctors] = useState<DoctorOnDuty[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    const defaults = isDistrict ? DEFAULT_DISTRICT_DOCTORS : DEFAULT_CHC_DOCTORS;
    return defaults.map((d) => ({ ...d, facility: activeFacility }));
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(doctors));
    } catch (e) {
      console.warn("Could not save doctors roster to localStorage:", e);
    }
  }, [doctors, storageKey]);

  // Add Doctor Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docSpecialty, setDocSpecialty] = useState("");
  const [docDepartment, setDocDepartment] = useState("");
  const [docShift, setDocShift] = useState("09:00 AM – 03:00 PM");
  const [docRoom, setDocRoom] = useState("OPD Room 1");
  const [docStatus, setDocStatus] = useState<DoctorStatus>("Available");

  // Edit Doctor Modal State
  const [editingDoc, setEditingDoc] = useState<DoctorOnDuty | null>(null);
  const [editShift, setEditShift] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editStatus, setEditStatus] = useState<DoctorStatus>("Available");

  const availableCount = doctors.filter((d) => d.status === "Available").length;
  const inConsultCount = doctors.filter((d) => d.status === "In Consultation").length;
  const offDutyCount = doctors.filter((d) => d.status === "Off Duty" || d.status === "On Leave").length;

  const filteredDoctors = useMemo(() => {
    if (filter === "ALL") return doctors;
    return doctors.filter((d) => d.status === filter);
  }, [doctors, filter]);

  const isTodaySelected = selectedDate === todayStr;

  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split("-");
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handleQuickStatusChange = (id: string, newStatus: DoctorStatus) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newDoc: DoctorOnDuty = {
      id: `DOC-${isDistrict ? "D" : "B"}-${Date.now().toString().slice(-4)}`,
      name: docName.trim(),
      specialty: docSpecialty.trim() || "General Medicine",
      department: docDepartment.trim() || "Clinical OPD",
      shift: docShift.trim() || "09:00 AM – 03:00 PM",
      room: docRoom.trim() || "OPD Chamber",
      status: docStatus,
      facility: activeFacility,
    };

    setDoctors((prev) => [newDoc, ...prev]);
    setIsAddModalOpen(false);
    setDocName("");
    setDocSpecialty("");
    setDocDepartment("");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    setDoctors((prev) =>
      prev.map((d) =>
        d.id === editingDoc.id
          ? {
              ...d,
              specialty: editSpecialty.trim() || d.specialty,
              shift: editShift.trim() || d.shift,
              room: editRoom.trim() || d.room,
              status: editStatus,
            }
          : d
      )
    );

    setEditingDoc(null);
  };

  const handleDeleteDoctor = (id: string) => {
    if (window.confirm("Remove this doctor from the roster?")) {
      setDoctors((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset doctor duty roster to standard defaults for this facility?")) {
      const defaults = isDistrict ? DEFAULT_DISTRICT_DOCTORS : DEFAULT_CHC_DOCTORS;
      setDoctors(defaults.map((d) => ({ ...d, facility: activeFacility })));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="min-h-screen md:ml-64">
        {/* HEADER */}
        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {isDistrict ? "Regional Hospital Duty Command" : "Community Health Centre (CHC) Duty Roster"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-on-surface">
                {tPortal("doctorAvailabilityTitle", "Doctor Availability", language)}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {tPortal("doctorAvailabilitySubtitle", "Real-time duty status, scheduled shifts, and clinical department coverage", language)}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition"
                title="Reset roster to default"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-xs hover:bg-primary/90 transition"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Add Doctor</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-8">
          {/* PROMINENT LIVE CLOCK & CALENDAR VIEW / PICKER BAR */}
          <section className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-surface to-primary/5 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Prominent Live Time Display */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-700 text-white shadow-md">
                  <span className="material-symbols-outlined text-3xl animate-pulse">schedule</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-900">
                      Live Hospital Time (IST)
                    </span>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <div className="mt-1 text-2xl sm:text-3xl font-black text-on-surface tracking-tight font-mono">
                    {currentTime.toLocaleTimeString("en-US", { hour12: true })}
                  </div>
                  <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Calendar Date Picker & Quick Presets */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="rounded-2xl border border-outline-variant bg-surface p-2 shadow-2xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-700 text-xl ml-2">calendar_month</span>
                  <div className="pr-2">
                    <label htmlFor="roster-date-picker" className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {tPortal("checkDateAvailability", "Check Date Availability")}
                    </label>
                    <input
                      id="roster-date-picker"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-on-surface outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isTodaySelected
                        ? "bg-indigo-700 text-white shadow-xs"
                        : "bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high"
                    }`}
                  >
                    {tPortal("today", "Today")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDate(tomorrowStr)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                      selectedDate === tomorrowStr
                        ? "bg-indigo-700 text-white shadow-xs"
                        : "bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high"
                    }`}
                  >
                    {tPortal("tomorrow", "Tomorrow")}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Date Indicator Banner */}
            <div className="mt-4 pt-4 border-t border-indigo-200/60 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-indigo-700">event</span>
                <span>{tPortal("activeScheduleDate", "Active Schedule Date")}: <strong className="text-on-surface">{formattedSelectedDate}</strong></span>
              </span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full ${isTodaySelected ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"}`}>
                {isTodaySelected ? `● ${tPortal("liveRealTimeView", "Live Real-Time View")}` : `📅 ${tPortal("scheduledShiftPlan", "Scheduled Shift Plan")}`}
              </span>
            </div>
          </section>

          {/* KPI CARDS */}
          <div className="grid gap-5 md:grid-cols-3">
            <div
              onClick={() => setFilter(filter === "Available" ? "ALL" : "Available")}
              className={`cursor-pointer rounded-3xl border p-5 sm:p-6 transition shadow-2xs min-h-[140px] flex flex-col justify-between ${
                filter === "Available"
                  ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500"
                  : "border-outline-variant bg-surface hover:border-emerald-400"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant break-words">
                    {tPortal("availableNow", "Available On Date")}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-700 tracking-tight">
                    {availableCount}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-800 font-semibold break-words">{tPortal("readyForPatients", "Ready for patient consultations")}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => setFilter(filter === "In Consultation" ? "ALL" : "In Consultation")}
              className={`cursor-pointer rounded-3xl border p-5 sm:p-6 transition shadow-2xs min-h-[140px] flex flex-col justify-between ${
                filter === "In Consultation"
                  ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500"
                  : "border-outline-variant bg-surface hover:border-blue-400"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant break-words">
                    {tPortal("inConsultation", "In Consultation")}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-blue-700 tracking-tight">
                    {inConsultCount}
                  </p>
                  <p className="mt-1 text-[11px] text-blue-800 font-semibold break-words">{tPortal("activeConsultations", "Actively examining patients")}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                  <span className="material-symbols-outlined text-2xl">stethoscope</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => setFilter(filter === "Off Duty" ? "ALL" : "Off Duty")}
              className={`cursor-pointer rounded-3xl border p-5 sm:p-6 transition shadow-2xs min-h-[140px] flex flex-col justify-between ${
                filter === "Off Duty"
                  ? "border-slate-500 bg-slate-100 ring-2 ring-slate-500"
                  : "border-outline-variant bg-surface hover:border-slate-400"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant break-words">
                    {tPortal("offDuty", "Off Duty / On Leave")}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-700 tracking-tight">
                    {offDutyCount}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600 font-semibold break-words">{tPortal("shiftEnded", "Shift ended or on approved leave")}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <span className="material-symbols-outlined text-2xl">bedtime</span>
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
                  Verified roster for <strong className="text-on-surface">{activeFacility}</strong> on <span className="font-semibold text-primary">{formattedSelectedDate}</span>
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
            <div className="mb-3 hidden px-5 lg:grid lg:grid-cols-[minmax(200px,1.2fr)_minmax(180px,1.1fr)_140px_140px_160px_100px] lg:items-center lg:gap-4">
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
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("status", "Current Status")}
              </div>
              <div className="text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Actions
              </div>
            </div>

            {/* DOCTOR ROWS */}
            <div className="space-y-3">
              {filteredDoctors.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-outline-variant rounded-2xl">
                  <p className="text-sm font-semibold text-on-surface-variant">
                    No doctors found for this filter. Click "+ Add Doctor" to schedule one.
                  </p>
                </div>
              ) : (
                filteredDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-outline-variant p-4 sm:p-5 transition hover:shadow-sm hover:border-primary/40 bg-surface-container-lowest"
                  >
                    <div className="grid items-center gap-4 lg:grid-cols-[minmax(200px,1.2fr)_minmax(180px,1.1fr)_140px_140px_160px_100px]">
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
                          <span className="truncate">{doc.shift}</span>
                        </span>
                      </div>

                      {/* STATUS SELECTOR / BADGE */}
                      <div>
                        <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Status:</span>
                        <select
                          value={doc.status}
                          onChange={(e) => handleQuickStatusChange(doc.id, e.target.value as DoctorStatus)}
                          className={`rounded-xl border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${statusBadge(
                            doc.status
                          )}`}
                        >
                          <option value="Available">Available</option>
                          <option value="In Consultation">In Consultation</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Off Duty">Off Duty</option>
                        </select>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center lg:justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDoc(doc);
                            setEditSpecialty(doc.specialty);
                            setEditShift(doc.shift);
                            setEditRoom(doc.room);
                            setEditStatus(doc.status);
                          }}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition"
                          title="Edit doctor details"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoctor(doc.id)}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-red-50 hover:text-red-700 transition"
                          title="Remove doctor from roster"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ADD DOCTOR MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_add</span>
                <span>Add Doctor to Duty Roster</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Doctor Name (with title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Tanmoy Banerjee"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology, Pediatrics"
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Outpatient Unit"
                    value={docDepartment}
                    onChange={(e) => setDocDepartment(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Duty Shift Hours
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM – 03:00 PM"
                    value={docShift}
                    onChange={(e) => setDocShift(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Room / Chamber
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OPD Room 3"
                    value={docRoom}
                    onChange={(e) => setDocRoom(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Initial Duty Status
                </label>
                <select
                  value={docStatus}
                  onChange={(e) => setDocStatus(e.target.value as DoctorStatus)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="Available">Available</option>
                  <option value="In Consultation">In Consultation</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-xs hover:bg-primary/90"
                >
                  Save to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface">
                Edit Duty Details: {editingDoc.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  required
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Duty Shift Hours
                  </label>
                  <input
                    type="text"
                    required
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Room / Chamber
                  </label>
                  <input
                    type="text"
                    required
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Duty Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as DoctorStatus)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="Available">Available</option>
                  <option value="In Consultation">In Consultation</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-xs hover:bg-primary/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
