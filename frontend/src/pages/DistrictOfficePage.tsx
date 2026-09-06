import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { PortalHeader } from "@/components/common/PortalHeader";
import { useReferralAuth } from "@/sync/referralAuth";
import { useReferralStore, useScopedReferrals, type UnifiedReferral } from "@/sync/referralStore";
import { DistrictOfficeAuthModal } from "@/components/referral/DistrictOfficeAuthModal";
import { ReferralStatusStepper } from "@/components/common/ReferralStatusStepper";
import { PatientRecordDrawer } from "@/components/common/PatientRecordDrawer";
import { MOCK_PATIENT_CASES, type PatientCase } from "@/sync/mockPatientCases";
import { GeoCascadeSelect, type GeoValue } from "@/components/common/GeoCascadeSelect";
import { useLanguageStore } from "@/i18n/useLanguageStore";

const safeStr = (val: unknown): string => {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return "";
  return String(val);
};

export function DistrictOfficePage() {
  const { isDistrictOfficerAuthenticated, districtOfficerUser, logoutDistrictOfficer } = useReferralAuth();
  const { admitDistrictPatient, backReferPatient } = useReferralStore();
  const referrals = useScopedReferrals();
  const { tPortal, language } = useLanguageStore();

  const isDistrictOfficer = isDistrictOfficerAuthenticated();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [triageFilter, setTriageFilter] = useState("All");

  // Admit / Consultation Modal
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<UnifiedReferral | null>(null);
  const [admitDoctor, setAdmitDoctor] = useState("Dr. A. Sen (Chief Cardiologist)");
  const [admitWard, setAdmitWard] = useState("District Hospital ICU - Bed 04");
  const [admitNotes, setAdmitNotes] = useState("Patient admitted under emergency tertiary protocol. Continuous vitals monitoring active.");
  const [admitGeo, setAdmitGeo] = useState<GeoValue>({
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Rampur Village",
  });

  // Back-Refer Modal
  const [backReferModalOpen, setBackReferModalOpen] = useState(false);
  const [backReferCase, setBackReferCase] = useState<UnifiedReferral | null>(null);
  const [followUpDays, setFollowUpDays] = useState(3);
  const [backReferInstructions, setBackReferInstructions] = useState(
    "Patient vitals stabilized. Discharged for home-based care. ASHA worker to perform BP and pulse check every 48 hours. Ensure adherence to prescribed oral medication."
  );

  const [recordDrawerOpen, setRecordDrawerOpen] = useState(false);
  const [selectedPatientForRecord, setSelectedPatientForRecord] = useState<PatientCase | null>(null);

  const handleOpenRecordForReferral = (item: UnifiedReferral) => {
    const match = MOCK_PATIENT_CASES.find(
      (p) =>
        p.id === item.patientId ||
        p.referralId === item.id ||
        p.name.toLowerCase() === item.patientName.toLowerCase()
    );
    if (match) {
      setSelectedPatientForRecord(match);
    } else {
      const adHoc: PatientCase = {
        id: item.patientId,
        referralId: item.id,
        name: item.patientName,
        age: parseInt(item.ageGender) || 28,
        gender: item.ageGender.includes("M") ? "Male" : "Female",
        village: item.village,
        block: item.block,
        district: item.district,
        state: item.state,
        phone: "+91 98321 00000",
        abhaId: "91-8842-1092-9901",
        condition: item.category,
        conditionCategory: "Hypertension",
        riskLevel: item.triageLevel,
        careStage: "Consultation",
        vitals: {
          bp: "128/82 mmHg",
          pulse: "80 bpm",
          spo2: "98%",
          temp: "98.4°F",
          weight: "58 kg",
        },
        lastUpdated: item.referralDate,
        assignedAsha: item.fromFacilityOrWorker,
        referralFacility: item.toFacility,
        doctorName: item.assignedDoctor,
        notes: item.clinicalNotes,
        timeline: [
          {
            id: `EV-${item.id}-1`,
            date: item.referralDate,
            stage: "Tertiary Evaluation",
            title: `Admitted at ${item.toFacility}`,
            description: item.clinicalNotes,
            facility: item.toFacility,
            doctor: item.assignedDoctor,
          },
        ],
      };
      setSelectedPatientForRecord(adHoc);
    }
    setRecordDrawerOpen(true);
  };

  const list = Array.isArray(referrals) ? referrals : [];

  // District cases: strictly scoped to the officer's assigned district for tertiary care
  const districtCases = useMemo(() => {
    if (!districtOfficerUser) return [];

    const officerFacility = (districtOfficerUser.facilityOrVillage || "").toLowerCase();
    const officerDistrict = officerFacility.includes("purulia") ? "purulia" : "bankura";

    return list.filter(
      (r) =>
        r &&
        (r.district || "").toLowerCase().includes(officerDistrict) &&
        (r.targetLevel === "DISTRICT_OFFICE" ||
          r.status === "Escalated to District" ||
          r.status === "In Consultation" ||
          r.toFacility.toLowerCase().includes("district"))
    );
  }, [list, districtOfficerUser]);

  const filteredCases = useMemo(() => {
    const q = safeStr(search).toLowerCase().trim();

    return districtCases.filter((item) => {
      if (!item) return false;
      const pName = safeStr(item.patientName).toLowerCase();
      const pId = safeStr(item.patientId).toLowerCase();
      const refId = safeStr(item.id).toLowerCase();
      const fromFac = safeStr(item.fromFacilityOrWorker).toLowerCase();
      const village = safeStr(item.village).toLowerCase();
      const block = safeStr(item.block).toLowerCase();

      const matchSearch =
        !q ||
        pName.includes(q) ||
        pId.includes(q) ||
        refId.includes(q) ||
        fromFac.includes(q) ||
        village.includes(q) ||
        block.includes(q);

      const matchTriage = triageFilter === "All" || item.triageLevel === triageFilter;

      return matchSearch && matchTriage;
    });
  }, [districtCases, search, triageFilter]);

  // Statistics
  const totalCases = districtCases.length;
  const emergencyCount = districtCases.filter((r) => r && (r.triageLevel === "RED" || r.priority === "Emergency")).length;
  const admittedCount = districtCases.filter((r) => r && r.status === "In Consultation").length;
  const backReferredCount = list.filter((r) => r && r.status === "Back-Referred").length;

  const handleOpenAdmit = (item: UnifiedReferral) => {
    if (!isDistrictOfficer) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedCase(item);
    setAdmitGeo({
      state: item.state || districtOfficerUser?.state || "West Bengal",
      district: item.district || districtOfficerUser?.district || "Bankura",
      block: item.block || "Joypur Block",
      village: item.village || "Rampur Village",
    });
    setAdmitDoctor(districtOfficerUser?.name || "Dr. A. Sen (Chief Specialist)");
    setAdmitModalOpen(true);
  };

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    admitDistrictPatient(selectedCase.id, admitDoctor, admitWard, admitNotes);
    setAdmitModalOpen(false);
    setSelectedCase(null);
  };

  const handleOpenBackRefer = (item: UnifiedReferral) => {
    if (!isDistrictOfficer) {
      setAuthModalOpen(true);
      return;
    }
    setBackReferCase(item);
    setBackReferModalOpen(true);
  };

  const handleBackReferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backReferCase) return;

    backReferPatient(backReferCase.id, backReferInstructions, followUpDays);
    setBackReferModalOpen(false);
    setBackReferCase(null);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        <main className="min-h-screen flex-1 md:ml-64 p-4 sm:p-6 md:p-8">
          {/* Dedicated Role-Scoped Portal Header */}
          <PortalHeader
            portalName={tPortal("districtReferrals", "District Office Portal", language)}
            portalIcon="local_hospital"
            tierBadge={tPortal("districtOfficeCommand", "District Tier (DH / Tertiary)", language)}
            themeColor="purple"
            user={districtOfficerUser}
            onLogout={logoutDistrictOfficer}
            onOpenAuth={() => setAuthModalOpen(true)}
            allReferralsPath="/"
          />

          {!isDistrictOfficer ? (
            /* LOCK SCREEN CARD: ZERO PATIENT DATA VISIBLE */
            <div className="mx-auto max-w-xl py-6 sm:py-10">
              <div className="rounded-3xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-700 mb-4">
                  <span className="material-symbols-outlined text-4xl">lock</span>
                </div>
                <span className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-700 mb-2">
                  {tPortal("districtOfficeCommand", "District Health & Tertiary Tier")}
                </span>
                <h2 className="text-2xl font-bold text-on-surface">
                  {tPortal("districtOfficeCommand", "District Officer Authentication Required")}
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant max-w-md mx-auto">
                  Access to tertiary hospital admissions, ICU beds, specialist consultations, and back-referrals requires verified CMOH / Specialist credentials.
                </p>

                <div className="mt-6 border-t border-outline-variant pt-6 text-left">
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3.5 px-6 font-bold text-white shadow-md hover:bg-purple-800 active:scale-[0.98] transition"
                  >
                    <span className="material-symbols-outlined">key</span>
                    <span>Login as District Officer</span>
                  </button>

                  <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-xs">
                    <p className="font-bold text-on-surface flex items-center gap-1.5 mb-2">
                      <span className="material-symbols-outlined text-base text-purple-700">badge</span>
                      <span>Registered District Medical Officers (Registry Database):</span>
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-outline-variant/60">
                        <div>
                          <p className="font-bold text-on-surface">Dr. Swapan Banerjee (DHO-WB-101)</p>
                          <p className="text-[11px] text-on-surface-variant">Bankura District General Hospital • PIN: 9876</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            useReferralAuth.getState().verifyAndLogin("DHO-WB-101", "9876", "district_officer");
                          }}
                          className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-700 hover:text-white transition"
                        >
                          Quick Login
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-outline-variant/60">
                        <div>
                          <p className="font-bold text-on-surface">Dr. Arundhati Ghosh (DHO-WB-102)</p>
                          <p className="text-[11px] text-on-surface-variant">Purulia District Hospital • PIN: 9876</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            useReferralAuth.getState().verifyAndLogin("DHO-WB-102", "9876", "district_officer");
                          }}
                          className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-700 hover:text-white transition"
                        >
                          Quick Login
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <Link
                      to="/#portals"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span>Return to Portal Chooser</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED DISTRICT PORTAL CONTENT */
            <div className="space-y-6">
              {/* Geographic Hierarchy Context */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-purple-50/50 px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-purple-950 font-medium">
                  <span className="material-symbols-outlined text-base text-purple-700">local_hospital</span>
                  <span><strong>District Tertiary Tier:</strong> West Bengal → Bankura District General Hospital & CMOH Administration</span>
                </div>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-bold text-purple-900">
                  {districtOfficerUser?.facilityOrVillage || "District General Hospital"}
                </span>
              </div>

            {/* Metrics */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
                <p className="text-xs font-medium text-on-surface-variant">Total District Queue</p>
                <h3 className="mt-2 text-3xl font-bold text-purple-900">{totalCases}</h3>
                <p className="mt-2 text-xs text-on-surface-variant">Escalated from Block Offices</p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5 shadow-sm">
                <p className="text-xs font-medium text-red-800">Emergency Red Cases</p>
                <h3 className="mt-2 text-3xl font-bold text-red-700 animate-pulse">{emergencyCount}</h3>
                <p className="mt-2 text-xs text-red-700">Immediate specialist attention required</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
                <p className="text-xs font-medium text-on-surface-variant">Admitted / In Consultation</p>
                <h3 className="mt-2 text-3xl font-bold text-blue-700">{admittedCount}</h3>
                <p className="mt-2 text-xs text-on-surface-variant">Under specialist evaluation</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
                <p className="text-xs font-medium text-on-surface-variant">Back-Referred to ASHA</p>
                <h3 className="mt-2 text-3xl font-bold text-teal-700">{backReferredCount}</h3>
                <p className="mt-2 text-xs text-on-surface-variant">Home follow-up coordinated</p>
              </div>
            </section>

            {/* Search & Filter */}
            <section className="rounded-3xl border border-outline-variant bg-surface-container-low p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search patient, referral ID, village, or block..."
                    className="w-full rounded-xl border border-outline-variant bg-surface px-10 py-2.5 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant">Triage:</span>
                  {["All", "RED", "YELLOW", "GREEN"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTriageFilter(lvl)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        triageFilter === lvl
                          ? "bg-purple-700 text-white"
                          : "bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Referrals Table */}
            <section className="overflow-hidden rounded-3xl border border-outline-variant bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="border-b border-outline-variant bg-surface-container-low">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Patient & Administrative Hierarchy
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Referral Pathway & Origin
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Triage & Priority
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Status & Last Update
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        District Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-outline-variant">
                    {filteredCases.map((item) => (
                      <tr key={item.id} className="transition hover:bg-surface-container-low">
                        {/* Patient */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-900">
                              {safeStr(item.patientName).charAt(0) || "P"}
                            </div>
                            <div>
                              <p className="font-bold text-on-surface">{item.patientName}</p>
                              <p className="text-xs text-on-surface-variant">
                                {item.patientId} • {item.ageGender} • <span className="font-mono text-purple-700">{item.id}</span>
                              </p>
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-900 font-medium">
                                <span className="material-symbols-outlined text-[13px]">location_on</span>
                                <span>{item.village}, {item.block} ({item.district})</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Pathway */}
                        <td className="px-6 py-5">
                          <p className="text-xs text-on-surface-variant">
                            From: <strong className="text-on-surface">{item.fromFacilityOrWorker}</strong>
                          </p>
                          <p className="text-xs text-purple-900 font-semibold mt-0.5">
                            To: {item.toFacility}
                          </p>
                          <p className="mt-1 text-[11px] text-on-surface-variant line-clamp-1" title={item.clinicalNotes}>
                            {item.clinicalNotes}
                          </p>
                        </td>

                        {/* Triage */}
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              item.triageLevel === "RED"
                                ? "bg-red-100 text-red-800 animate-pulse"
                                : item.triageLevel === "YELLOW"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            Triage {item.triageLevel}
                          </span>
                          <p className="mt-1 text-xs text-on-surface-variant font-medium">
                            {item.priority} Priority • {item.escortTransport}
                          </p>
                        </td>

                        {/* Status & 6-Stage Stepper */}
                        <td className="px-6 py-5">
                          <ReferralStatusStepper currentStage={item.status} isCompact />
                          <p className="mt-1 text-xs text-on-surface font-medium">{item.lastAction}</p>
                          <p className="text-[11px] text-on-surface-variant">Doctor: {item.assignedDoctor}</p>
                        </td>

                        {/* Management Actions */}
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.status !== "In Consultation" && item.status !== "Back-Referred" && (
                              <button
                                type="button"
                                onClick={() => handleOpenAdmit(item)}
                                className="inline-flex items-center gap-1 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-800"
                              >
                                <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
                                Admit Patient
                              </button>
                            )}

                            {item.status === "In Consultation" && (
                              <button
                                type="button"
                                onClick={() => handleOpenBackRefer(item)}
                                className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-800"
                              >
                                <span className="material-symbols-outlined text-[15px]">assignment_return</span>
                                Back-Refer to ASHA
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenRecordForReferral(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container"
                              title="View Longitudinal Health Record"
                            >
                              <span className="material-symbols-outlined text-[15px]">history_edu</span>
                              <span>Record</span>
                            </button>

                            <Link
                              to={`/dashboard/referrals/${item.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container"
                            >
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCases.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                    local_hospital
                  </span>
                  <h3 className="mt-3 font-bold">No referrals in District queue</h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    No cases match the current filter or search criteria.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      </div>

      {/* District Auth Modal */}
      <DistrictOfficeAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Admit Patient Modal */}
      {admitModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-outline-variant bg-surface p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                  <span className="material-symbols-outlined text-2xl">how_to_reg</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">Admit to District Hospital</h2>
                  <p className="text-xs text-on-surface-variant">
                    Accept referral for {selectedCase.patientName} ({selectedCase.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdmitModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Assigned District Specialist *
                </label>
                <input
                  type="text"
                  required
                  value={admitDoctor}
                  onChange={(e) => setAdmitDoctor(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Department / Ward / Bed Allocation *
                </label>
                <input
                  type="text"
                  required
                  value={admitWard}
                  onChange={(e) => setAdmitWard(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-purple-600"
                />
              </div>

              {/* Confirmed Patient Jurisdiction: State -> District -> Block -> Village */}
              <div className="rounded-2xl border border-purple-200/70 bg-purple-50/40 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-2.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">pin_drop</span>
                  Confirmed Patient Jurisdiction (State → District → Block → Village)
                </p>
                <GeoCascadeSelect
                  value={admitGeo}
                  onChange={setAdmitGeo}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Clinical Admission Notes
                </label>
                <textarea
                  rows={3}
                  value={admitNotes}
                  onChange={(e) => setAdmitNotes(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-purple-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setAdmitModalOpen(false)}
                  className="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-purple-800"
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Back-Refer to ASHA Modal */}
      {backReferModalOpen && backReferCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-outline-variant bg-surface p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                  <span className="material-symbols-outlined text-2xl">assignment_return</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">Back-Refer Patient to Village ASHA</h2>
                  <p className="text-xs text-on-surface-variant">
                    Discharge {backReferCase.patientName} with instructions for ASHA Worker
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBackReferModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleBackReferSubmit} className="mt-5 space-y-4">
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 text-xs text-teal-950">
                This will update the patient situation immediately. The village ASHA worker (<strong>{backReferCase.fromFacilityOrWorker}</strong>) will be able to see this update in her portal.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Home Monitoring Duration (Days) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Post-Discharge Instructions for ASHA Worker *
                </label>
                <textarea
                  rows={4}
                  required
                  value={backReferInstructions}
                  onChange={(e) => setBackReferInstructions(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-teal-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setBackReferModalOpen(false)}
                  className="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-teal-800"
                >
                  Confirm Back-Referral to ASHA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Task 2: Longitudinal Patient Record Drawer */}
      <PatientRecordDrawer
        patient={selectedPatientForRecord}
        isOpen={recordDrawerOpen}
        onClose={() => setRecordDrawerOpen(false)}
      />
    </div>
  );
}
