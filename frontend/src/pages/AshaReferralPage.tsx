import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { PortalHeader } from "@/components/common/PortalHeader";
import { useReferralAuth } from "@/sync/referralAuth";
import { useReferralStore, useScopedReferrals, type UnifiedReferral, getPublicStatus } from "@/sync/referralStore";
import { AshaAuthModal } from "@/components/referral/AshaAuthModal";
import { DigitalTriagePage } from "@/pages/DigitalTriagePage";
import type { ClinicalRiskLevelT } from "@/models/careEpisode";
import { MOCK_PATIENT_CASES, type PatientCase } from "@/sync/mockPatientCases";
import { PatientCard } from "@/components/common/PatientCard";
import { SearchSortFilter, type FilterState } from "@/components/common/SearchSortFilter";
import { PatientRecordDrawer } from "@/components/common/PatientRecordDrawer";
import { TeleconsultationModal } from "@/components/common/TeleconsultationModal";
import { EmergencyEscalationModal } from "@/components/common/EmergencyEscalationModal";
import { ReferralStatusStepper } from "@/components/common/ReferralStatusStepper";
import { useLanguageStore } from "@/i18n/useLanguageStore";
import { GeoCascadeSelect, type GeoValue } from "@/components/common/GeoCascadeSelect";

const BLOCK_FACILITIES = [
  "Belur Block PHC",
  "Sonamukhi Rural Hospital",
  "Joypur Community Health Centre (CHC)",
  "Kotulpur Block Hospital",
];

const CATEGORY_OPTIONS = [
  "High-Risk ANC (Third Trimester)",
  "Severe Child Malnutrition (SAM)",
  "Acute Respiratory Distress",
  "Uncontrolled Diabetes / Hypertension",
  "Suspected Tuberculosis (TB)",
  "Emergency Obstetric / Trauma",
];

export function AshaReferralPage() {
  const [searchParams] = useSearchParams();
  const { isAshaAuthenticated, ashaUser, logoutAsha } = useReferralAuth();
  const { addAshaReferral } = useReferralStore();
  const scopedReferrals = useScopedReferrals();

  const isAsha = isAshaAuthenticated();
  const list = Array.isArray(scopedReferrals) ? scopedReferrals : [];

  // Top level views: "episode" (Care Episode First) | "queue" (Village Referrals Queue)
  const [activeTab, setActiveTab] = useState<"episode" | "queue">("episode");

  // Single Dedicated ASHA Auth Modal
  const [ashaAuthOpen, setAshaAuthOpen] = useState(false);

  // Multilingual translation helper
  const { tPortal, language } = useLanguageStore();

  // Task 1 & 2 & 3 & 5: Mock Cases, Search/Filter state, Drawers/Modals
  const [patientCases] = useState<PatientCase[]>(MOCK_PATIENT_CASES);
  const [filterState, setFilterState] = useState<FilterState>({
    search: "",
    sortBy: "risk-desc",
    risk: "ALL",
    stage: "ALL",
    category: "ALL",
    viewMode: "cards",
  });

  const [selectedCaseForDrawer, setSelectedCaseForDrawer] = useState<PatientCase | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedCaseForTeleconsult, setSelectedCaseForTeleconsult] = useState<PatientCase | null>(null);
  const [teleconsultOpen, setTeleconsultOpen] = useState(false);

  const [selectedCaseForEmergency, setSelectedCaseForEmergency] = useState<PatientCase | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Patient Situation & Care Journey Modal
  const [situationModalOpen, setSituationModalOpen] = useState(false);
  const [selectedPatientForSituation, setSelectedPatientForSituation] = useState<UnifiedReferral | null>(null);

  // =========================================================================
  // CARE EPISODE WORKFLOW STATE (§5.2 & §5.3)
  // =========================================================================
  const [activePatient, setActivePatient] = useState({
    id: "PAT-1082",
    name: "Sunita Mahato",
    ageGender: "24 F",
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Rampur Village",
    phone: "+91 98321 44520",
    category: "High-Risk ANC (Third Trimester)",
  });

  const [isSwitchingPatient, setIsSwitchingPatient] = useState(false);
  const [tempPatientName, setTempPatientName] = useState("");
  const [tempAgeGender, setTempAgeGender] = useState("");
  const [tempCategory, setTempCategory] = useState("High-Risk ANC (Third Trimester)");
  const [tempGeo, setTempGeo] = useState<GeoValue>({
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Rampur Village",
  });

  // Stepper Stages: 1. assessment -> 2. referral -> 3. followup -> 4. completed
  const [stepperStage, setStepperStage] = useState<"assessment" | "referral" | "followup" | "completed">("assessment");
  
  // Completed assessment data
  const [assessmentData, setAssessmentData] = useState<{
    riskLevel: ClinicalRiskLevelT;
    symptoms: string[];
    vitals: any;
    notes?: string;
  } | null>(null);

  // Referral creation fields (Step 2)
  const [selectedBlockFacility, setSelectedBlockFacility] = useState("Belur Block PHC");
  const [selectedEscort, setSelectedEscort] = useState("Accompanied by ASHA");
  const [referralNotes, setReferralNotes] = useState("");
  const [activeEpisodeReferral, setActiveEpisodeReferral] = useState<UnifiedReferral | null>(null);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      if (isAsha) {
        setActiveTab("episode");
        setStepperStage("assessment");
      } else {
        setAshaAuthOpen(true);
      }
    }
  }, [searchParams, isAsha]);

  // If active episode referral is in the list, keep it synchronized
  useEffect(() => {
    if (activeEpisodeReferral) {
      const live = list.find((r) => r.id === activeEpisodeReferral.id);
      if (live) {
        setActiveEpisodeReferral(live);
      }
    }
  }, [list, activeEpisodeReferral]);

  // Strict Village Scoping: ASHA worker only ever sees their assigned village cases
  const villageScopedCases = useMemo(() => {
    if (!ashaUser) return [];

    const userFacility = (ashaUser.facilityOrVillage || "").toLowerCase();
    const userName = (ashaUser.name || "").toLowerCase();

    return patientCases.filter((p) => {
      const v = (p.village || "").toLowerCase();
      const asha = (p.assignedAsha || "").toLowerCase();

      if (userFacility.includes("rampur") && v.includes("rampur")) return true;
      if (userFacility.includes("sonamukhi") || userFacility.includes("sonapur")) {
        if (v.includes("sonamukhi") || v.includes("sonapur")) return true;
      }
      if (userFacility.includes("belur") && v.includes("belur")) return true;
      if (userFacility.includes("shyampur") && v.includes("shyampur")) return true;
      
      return asha.includes(userName) || userFacility.includes(v);
    });
  }, [patientCases, ashaUser]);

  // Filtered patient cases with full search, sort, and filters strictly within village scope
  const filteredCases = useMemo(() => {
    return villageScopedCases
      .filter((p) => {
        const q = filterState.search.trim().toLowerCase();
        if (q) {
          const match =
            p.name.toLowerCase().includes(q) ||
            p.village.toLowerCase().includes(q) ||
            p.abhaId.toLowerCase().includes(q) ||
            p.condition.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            p.assignedAsha.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (filterState.risk !== "ALL" && p.riskLevel !== filterState.risk) {
          return false;
        }
        if (filterState.stage !== "ALL" && p.careStage !== filterState.stage) {
          return false;
        }
        if (filterState.category !== "ALL" && p.conditionCategory !== filterState.category) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filterState.sortBy === "risk-desc") {
          const score = { RED: 3, YELLOW: 2, GREEN: 1 };
          return score[b.riskLevel] - score[a.riskLevel];
        }
        if (filterState.sortBy === "risk-asc") {
          const score = { RED: 3, YELLOW: 2, GREEN: 1 };
          return score[a.riskLevel] - score[b.riskLevel];
        }
        if (filterState.sortBy === "name-asc") {
          return a.name.localeCompare(b.name);
        }
        if (filterState.sortBy === "name-desc") {
          return b.name.localeCompare(a.name);
        }
        if (filterState.sortBy === "stage") {
          return a.careStage.localeCompare(b.careStage);
        }
        return 0;
      });
  }, [villageScopedCases, filterState]);

  // Statistics strictly scoped to this ASHA worker's village
  const totalReferrals = villageScopedCases.length;
  const highRiskCount = villageScopedCases.filter((p) => p.riskLevel === "RED").length;
  const atBlockOfficeCount = villageScopedCases.filter(
    (p) => p.careStage === "Triage / Referred" || p.careStage === "In Transit"
  ).length;
  const backReferredCount = villageScopedCases.filter(
    (p) => p.careStage === "Back-Referred / Follow-up"
  ).length;
  const escalatedCount = villageScopedCases.filter(
    (p) => p.careStage === "Consultation" || p.careStage === "Treatment"
  ).length;

  // Handler when Digital Triage finishes
  const handleTriageCompleted = (riskLevel: ClinicalRiskLevelT, assessment?: any) => {
    setAssessmentData({
      riskLevel,
      symptoms: assessment?.symptoms || ["High Blood Pressure", "Headache"],
      vitals: assessment?.vitals || {},
      notes: assessment?.notes || "",
    });
    setReferralNotes(
      assessment?.notes ||
        `Triage assessed as ${riskLevel.toUpperCase()} risk. Vitals and symptoms recorded by ASHA.`
    );
    // Advance stepper to Referral step
    setStepperStage("referral");
  };

  // Handler to dispatch referral to Block Office
  const handleDispatchReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const risk = assessmentData?.riskLevel || "medium";
    const priority: UnifiedReferral["priority"] =
      risk === "emergency" ? "Emergency" : risk === "high" ? "High" : "Normal";
    const triageLevel: UnifiedReferral["triageLevel"] =
      risk === "emergency" || risk === "high" ? "RED" : risk === "medium" ? "YELLOW" : "GREEN";

    const newRef = addAshaReferral({
      patientName: activePatient.name,
      patientId: activePatient.id,
      ageGender: activePatient.ageGender,
      state: activePatient.state,
      district: activePatient.district,
      block: activePatient.block,
      village: activePatient.village,
      fromFacilityOrWorker: ashaUser
        ? `${ashaUser.name} (${ashaUser.id})`
        : "Kavita Roy (ASHA-WB-401)",
      toFacility: selectedBlockFacility,
      category: activePatient.category,
      priority,
      triageLevel,
      status: "Referred to Block",
      clinicalNotes: referralNotes || `Assessed as ${risk.toUpperCase()} risk. Symptoms: ${assessmentData?.symptoms.join(", ") || "Recorded in triage"}.`,
      escortTransport: selectedEscort,
      assignedDoctor: "On-duty Medical Officer",
    });

    setActiveEpisodeReferral(newRef);
    setStepperStage("followup");
  };

  const handleStartNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPatientName.trim()) return;

    const newId = `PAT-${Math.floor(8800 + Math.random() * 1000)}`;
    setActivePatient({
      id: newId,
      name: tempPatientName,
      ageGender: tempAgeGender || "25 F",
      state: tempGeo.state || "West Bengal",
      district: tempGeo.district || "Bankura",
      block: tempGeo.block || "Joypur Block",
      village: tempGeo.village || "Rampur Village",
      phone: "+91 98321 00000",
      category: tempCategory,
    });

    setIsSwitchingPatient(false);
    setAssessmentData(null);
    setActiveEpisodeReferral(null);
    setStepperStage("assessment");
    setTempPatientName("");
    setTempAgeGender("");
  };

  const handleSelectPatientCase = (patient: PatientCase) => {
    setActivePatient({
      id: patient.id,
      name: patient.name,
      ageGender: `${patient.age} ${patient.gender === "Female" ? "F" : "M"}`,
      state: patient.state,
      district: patient.district,
      block: patient.block,
      village: patient.village,
      phone: patient.phone,
      category: patient.condition,
    });
    const match = list.find(
      (r) => r && (r.patientId === patient.id || r.id === patient.referralId)
    );
    if (match) {
      setActiveEpisodeReferral(match);
      if (match.status === "Completed") {
        setStepperStage("completed");
      } else {
        setStepperStage("followup");
      }
    } else {
      setActiveEpisodeReferral(null);
      setStepperStage("assessment");
    }
    setActiveTab("episode");
  };

  const handleOpenSituation = (patient: UnifiedReferral) => {
    setSelectedPatientForSituation(patient);
    setSituationModalOpen(true);
  };

  // Safe masked view of active referral
  const maskedActiveReferral = activeEpisodeReferral
    ? getPublicStatus(activeEpisodeReferral, "asha")
    : null;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        <main className="min-h-screen flex-1 md:ml-64 p-4 sm:p-6 md:p-8">
          {/* Dedicated Role-Scoped Portal Header */}
          <PortalHeader
            portalName={tPortal("villageReferrals", "ASHA Referral Portal", language)}
            portalIcon="volunteer_activism"
            tierBadge={tPortal("ashaVillagePortal", "Village / Ward Frontline Tier", language)}
            themeColor="teal"
            user={ashaUser}
            onLogout={logoutAsha}
            onOpenAuth={() => setAshaAuthOpen(true)}
            allReferralsPath="/"
            actionButton={
              isAsha ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsSwitchingPatient(true);
                    setActiveTab("episode");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-teal-900 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>{tPortal("careEpisode", "Intake New Patient", language)}</span>
                </button>
              ) : null
            }
          />

          {!isAsha ? (
            /* LOCK SCREEN CARD: ZERO PATIENT DATA VISIBLE */
            <div className="mx-auto max-w-xl py-6 sm:py-10">
              <div className="rounded-3xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                  <span className="material-symbols-outlined text-4xl">lock</span>
                </div>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
                  Village / Ward Care Tier
                </span>
                <h2 className="text-2xl font-bold text-on-surface">ASHA Worker Authentication Required</h2>
                <p className="mt-2 text-sm text-on-surface-variant max-w-md mx-auto">
                  This portal contains sensitive frontline patient records. You must verify your Accredited Social Health Activist (ASHA) credentials to enter.
                </p>

                <div className="mt-6 border-t border-outline-variant pt-6 text-left">
                  <button
                    type="button"
                    onClick={() => setAshaAuthOpen(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 px-6 font-bold text-on-primary shadow-md hover:bg-primary-hover active:scale-[0.98] transition"
                  >
                    <span className="material-symbols-outlined">key</span>
                    <span>Login as ASHA Worker</span>
                  </button>

                  <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-xs">
                    <p className="font-bold text-on-surface flex items-center gap-1.5 mb-2">
                      <span className="material-symbols-outlined text-base text-primary">badge</span>
                      <span>Registered Health Workers (Government Registry Database):</span>
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-outline-variant/60">
                        <div>
                          <p className="font-bold">Kavita Roy (ASHA-WB-401)</p>
                          <p className="text-[11px] text-on-surface-variant">Rampur Village / Sector • PIN: 1234</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            useReferralAuth.getState().verifyAndLogin("ASHA-WB-401", "1234", "asha");
                          }}
                          className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition"
                        >
                          Quick Login
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-outline-variant/60">
                        <div>
                          <p className="font-bold">Radha Sen (ASHA-WB-402)</p>
                          <p className="text-[11px] text-on-surface-variant">Sonamukhi East Sector • PIN: 1234</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            useReferralAuth.getState().verifyAndLogin("ASHA-WB-402", "1234", "asha");
                          }}
                          className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition"
                        >
                          Quick Login
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <Link
                      to="/#portals"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span>Return to Portal Chooser</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED PORTAL WORKSPACE */
            <div className="space-y-6">
              {/* Geographic Hierarchy Context */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  <span><strong>Geographic Hierarchy:</strong> West Bengal → Bankura District → Joypur / Sonamukhi Block → Frontline Villages</span>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                  {ashaUser?.facilityOrVillage || "Village Health Sub-Centre"}
                </span>
              </div>

              {/* Navigation Mode Switcher: Active Care Episode vs Village Queue */}
              <div className="flex border-b border-outline-variant">
                <button
                  type="button"
                  onClick={() => setActiveTab("episode")}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
                    activeTab === "episode"
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">medical_information</span>
                  <span>{tPortal("careEpisode", "Active Care Episode")}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                    Primary Flow
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
                    activeTab === "queue"
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                  <span>{tPortal("villageCases", "My Village Cases & Follow-ups")}</span>
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                    {totalReferrals}
                  </span>
                </button>
              </div>

              {/* =========================================================
                  TAB 1: CARE EPISODE WORKFLOW (§5.2 & §5.3)
                  ========================================================= */}
              {activeTab === "episode" && (
                <div className="space-y-6">
                  {/* PATIENT DETAILS CARD */}
                  <div className="rounded-3xl border border-outline-variant bg-surface p-5 sm:p-7 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant pb-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-xl">
                          {activePatient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-on-surface">{activePatient.name}</h2>
                            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                              {activePatient.id}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {activePatient.ageGender} • {activePatient.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsSwitchingPatient(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-3.5 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition"
                        >
                          <span className="material-symbols-outlined text-base">swap_horiz</span>
                          <span>Switch / New Patient</span>
                        </button>
                      </div>
                    </div>

                    {/* Patient Demographic Bar */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                          Village / Ward
                        </span>
                        <p className="font-bold text-on-surface mt-0.5">{activePatient.village}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                          Block Health Office
                        </span>
                        <p className="font-bold text-on-surface mt-0.5">{activePatient.block}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                          District / State
                        </span>
                        <p className="font-bold text-on-surface mt-0.5">{activePatient.district}, {activePatient.state}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                          Clinical Condition Category
                        </span>
                        <p className="font-bold text-primary mt-0.5">{activePatient.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* CARE JOURNEY STEPPER (§5.2) */}
                  <div className="rounded-3xl border border-outline-variant bg-surface p-5 sm:p-6 shadow-sm">
                    <div className="mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Sequential Care Continuum
                      </span>
                      <h3 className="text-base font-bold text-on-surface">Patient Care Journey Stepper</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Step 1 */}
                      <button
                        type="button"
                        onClick={() => setStepperStage("assessment")}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition ${
                          stepperStage === "assessment"
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : assessmentData
                            ? "border-emerald-300 bg-emerald-50/50"
                            : "border-outline-variant bg-surface opacity-75"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                            assessmentData
                              ? "bg-emerald-600 text-white"
                              : stepperStage === "assessment"
                              ? "bg-primary text-white"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {assessmentData ? (
                            <span className="material-symbols-outlined text-base">check</span>
                          ) : (
                            "1"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface">1. Assessment</p>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            {assessmentData ? `${assessmentData.riskLevel.toUpperCase()} Risk` : "Digital Triage"}
                          </p>
                        </div>
                      </button>

                      {/* Step 2 */}
                      <button
                        type="button"
                        onClick={() => {
                          if (assessmentData) setStepperStage("referral");
                        }}
                        disabled={!assessmentData}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition ${
                          stepperStage === "referral"
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : activeEpisodeReferral
                            ? "border-emerald-300 bg-emerald-50/50"
                            : assessmentData
                            ? "border-outline-variant bg-surface hover:border-primary/50"
                            : "border-outline-variant/40 bg-surface-container-low opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                            activeEpisodeReferral
                              ? "bg-emerald-600 text-white"
                              : stepperStage === "referral"
                              ? "bg-primary text-white"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {activeEpisodeReferral ? (
                            <span className="material-symbols-outlined text-base">check</span>
                          ) : (
                            "2"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface">2. Referral</p>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            {activeEpisodeReferral ? "Dispatched" : "Block Escalation"}
                          </p>
                        </div>
                      </button>

                      {/* Step 3 */}
                      <button
                        type="button"
                        onClick={() => {
                          if (activeEpisodeReferral) setStepperStage("followup");
                        }}
                        disabled={!activeEpisodeReferral}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition ${
                          stepperStage === "followup"
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : activeEpisodeReferral?.status === "Completed"
                            ? "border-emerald-300 bg-emerald-50/50"
                            : activeEpisodeReferral
                            ? "border-outline-variant bg-surface hover:border-primary/50"
                            : "border-outline-variant/40 bg-surface-container-low opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                            activeEpisodeReferral?.status === "Completed"
                              ? "bg-emerald-600 text-white"
                              : stepperStage === "followup"
                              ? "bg-primary text-white"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {activeEpisodeReferral?.status === "Completed" ? (
                            <span className="material-symbols-outlined text-base">check</span>
                          ) : (
                            "3"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface">3. Follow-up</p>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            {maskedActiveReferral ? maskedActiveReferral.displayStatus : "Awaiting Referral"}
                          </p>
                        </div>
                      </button>

                      {/* Step 4 */}
                      <button
                        type="button"
                        onClick={() => {
                          if (activeEpisodeReferral?.status === "Completed") setStepperStage("completed");
                        }}
                        disabled={activeEpisodeReferral?.status !== "Completed"}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition ${
                          stepperStage === "completed"
                            ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                            : "border-outline-variant/40 bg-surface-container-low opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant font-bold text-sm">
                          4
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface">4. Completed</p>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            Closed Loop
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* STAGE CONTENT ACCORDING TO STEPPER */}

                  {/* STAGE 1: ASSESSMENT (DIGITAL TRIAGE EMBEDDED §5.3) */}
                  {stepperStage === "assessment" && (
                    <div className="space-y-4">
                      {assessmentData && (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-700 text-2xl">check_circle</span>
                            <div>
                              <p className="text-sm font-bold text-emerald-950">
                                Assessment Completed: {assessmentData.riskLevel.toUpperCase()} Clinical Risk
                              </p>
                              <p className="text-xs text-emerald-800">
                                Symptoms recorded: {assessmentData.symptoms.join(", ")}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStepperStage("referral")}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm hover:bg-primary-hover transition"
                          >
                            <span>Proceed to Stage 2: Refer to Block</span>
                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                          </button>
                        </div>
                      )}

                      <DigitalTriagePage
                        embedded
                        careEpisodeId={`EP-${activePatient.id}`}
                        workerId={ashaUser?.id || "ASHA-WB-401"}
                        patientData={{
                          id: activePatient.id,
                          name: activePatient.name,
                          ageGender: activePatient.ageGender,
                        }}
                        onComplete={handleTriageCompleted}
                      />
                    </div>
                  )}

                  {/* STAGE 2: REFER TO BLOCK OFFICE (OUTCOME OF ASSESSMENT §5.2) */}
                  {stepperStage === "referral" && (
                    <div className="rounded-3xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-sm">
                      <div className="border-b border-outline-variant pb-5 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-700">
                            <span className="material-symbols-outlined text-2xl">domain</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                              Care Episode Stage 2
                            </span>
                            <h3 className="text-xl font-bold text-on-surface">
                              Refer Patient to Block Health Office (PHC / CHC)
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              This referral is pre-populated with data from Stage 1 Digital Triage.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Summary of Triage Assessment */}
                      <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-primary">Triage Assessment Finding</p>
                          <p className="text-sm font-bold text-on-surface mt-0.5">
                            Risk Level: <span className="uppercase text-primary">{assessmentData?.riskLevel || "HIGH"}</span> • Category: {activePatient.category}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Recorded Symptoms: {assessmentData?.symptoms?.join(", ") || "Fever, High BP"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStepperStage("assessment")}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span>Re-evaluate Triage</span>
                        </button>
                      </div>

                      <form onSubmit={handleDispatchReferral} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                              Destination Block Health Office *
                            </label>
                            <select
                              value={selectedBlockFacility}
                              onChange={(e) => setSelectedBlockFacility(e.target.value)}
                              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                            >
                              {BLOCK_FACILITIES.map((fac) => (
                                <option key={fac} value={fac}>
                                  {fac}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                              Transport / Escort Arrangement *
                            </label>
                            <select
                              value={selectedEscort}
                              onChange={(e) => setSelectedEscort(e.target.value)}
                              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                            >
                              <option value="Accompanied by ASHA">Accompanied by ASHA Worker</option>
                              <option value="102 Janani Shishu Ambulance">102 Janani Shishu Ambulance (Maternal)</option>
                              <option value="108 Emergency Ambulance">108 Emergency Ambulance</option>
                              <option value="Local Auto / Family Transport">Local Auto / Family Transport</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                            Clinical Notes & Observations for Block Medical Officer
                          </label>
                          <textarea
                            rows={3}
                            value={referralNotes}
                            onChange={(e) => setReferralNotes(e.target.value)}
                            placeholder="State primary reason for referral, duration of symptoms, and any immediate first-aid administered..."
                            className="w-full rounded-xl border border-outline-variant bg-surface p-3 text-sm outline-none focus:border-primary"
                          />
                        </div>

                        <div className="pt-3 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
                          <p className="text-xs text-on-surface-variant">
                            Sender ID: <strong>{ashaUser ? `${ashaUser.name} (${ashaUser.id})` : "Kavita Roy (ASHA-WB-401)"}</strong>
                          </p>

                          <button
                            type="submit"
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-sm font-bold text-on-primary shadow-md hover:bg-primary-hover active:scale-[0.98] transition"
                          >
                            <span className="material-symbols-outlined">send</span>
                            <span>Dispatch Referral to Block Office</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* STAGE 3: FOLLOW-UP (LIVE SITUATION TRACKING & BACK-REFERRAL §5.2) */}
                  {stepperStage === "followup" && maskedActiveReferral && (
                    <div className="rounded-3xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant pb-5">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            Care Episode Stage 3
                          </span>
                          <h3 className="text-xl font-bold text-on-surface">
                            Active Patient Referral Status & Situation
                          </h3>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Referral ID: <strong className="font-mono text-primary">{maskedActiveReferral.id}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenSituation(activeEpisodeReferral!)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition"
                        >
                          <span className="material-symbols-outlined text-base">timeline</span>
                          <span>Full Care Journey Timeline</span>
                        </button>
                      </div>

                      {/* 6-Stage Continuum Referral Stepper */}
                      <ReferralStatusStepper currentStage={maskedActiveReferral.status} />

                      {/* BACK-REFERRAL ACTION ALERT (§5.2) */}
                      {maskedActiveReferral.ashaActionAlert && (
                        <div className="rounded-2xl border border-teal-300 bg-teal-50 p-5 shadow-xs">
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-teal-700 text-2xl">priority_high</span>
                            <div>
                              <h4 className="text-sm font-bold text-teal-950 uppercase tracking-wider">
                                Frontline Follow-up Action Required
                              </h4>
                              <p className="text-sm text-teal-900 mt-1 font-semibold">
                                {maskedActiveReferral.ashaActionAlert}
                              </p>
                              <p className="text-xs text-teal-800 mt-1">
                                The patient has been stabilized at the hospital and discharged home. Please verify medication adherence and vital signs.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Plain-Language Status Card (§5.2) */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
                          <span className="text-xs text-on-surface-variant block font-medium">
                            Current Situation Note:
                          </span>
                          <p className="text-base font-bold text-primary mt-1">
                            {maskedActiveReferral.displayStatus}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Facility: <strong>{maskedActiveReferral.displayFacility}</strong>
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
                          <span className="text-xs text-on-surface-variant block font-medium">
                            Assigned Medical Clinician (Role-Only):
                          </span>
                          <p className="text-base font-bold text-on-surface mt-1">
                            {maskedActiveReferral.displayDoctor}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Transport: {maskedActiveReferral.escortTransport}
                          </p>
                        </div>
                      </div>

                      {/* Clinical Notes Masked */}
                      <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant">
                        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                          Clinical Progress Notes
                        </span>
                        <p className="text-sm text-on-surface leading-relaxed">
                          {maskedActiveReferral.displayNotes}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-outline-variant flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSwitchingPatient(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-sm">person_add</span>
                          <span>Start Care Episode for Another Patient</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            useReferralStore.getState().admitDistrictPatient(
                              activeEpisodeReferral!.id,
                              "District Medical Specialist",
                              "Specialist Ward",
                              "Patient stabilized. Discharged for village follow-up."
                            );
                            useReferralStore.getState().backReferPatient(
                              activeEpisodeReferral!.id,
                              "Home vitals and compliance check daily",
                              3
                            );
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-3.5 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition"
                        >
                          <span className="material-symbols-outlined text-base">simulation</span>
                          <span>Simulate Discharge & Back-Referral</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STAGE 4: COMPLETED */}
                  {stepperStage === "completed" && (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 text-center space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                        <span className="material-symbols-outlined text-3xl">task_alt</span>
                      </div>
                      <h3 className="text-2xl font-bold text-emerald-950">Care Episode Completed</h3>
                      <p className="text-sm text-emerald-900 max-w-md mx-auto">
                        The full patient continuum from village assessment to block/district resolution and post-discharge follow-up is safely closed.
                      </p>
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSwitchingPatient(true);
                          }}
                          className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-md hover:bg-primary-hover transition"
                        >
                          Intake New Patient
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================
                  TAB 2: MY VILLAGE CASES & FOLLOW-UPS QUEUE
                  ========================================================= */}
              {activeTab === "queue" && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
                      <p className="text-sm font-medium text-on-surface-variant">Total Village Cases</p>
                      <h3 className="mt-2 text-3xl font-bold">{totalReferrals}</h3>
                      <p className="mt-3 text-xs text-on-surface-variant">Referred to Block Office</p>
                    </div>

                    <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm">
                      <p className="text-sm font-medium text-red-800">High-Risk & Emergency</p>
                      <h3 className="mt-2 text-3xl font-bold text-red-900">{highRiskCount}</h3>
                      <p className="mt-3 text-xs text-red-700 font-medium">Urgent escort needed</p>
                    </div>

                    <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
                      <p className="text-sm font-medium text-on-surface-variant">At Block Office</p>
                      <h3 className="mt-2 text-3xl font-bold text-indigo-700">{atBlockOfficeCount}</h3>
                      <p className="mt-3 text-xs text-on-surface-variant">In Block PHC/CHC care</p>
                    </div>

                    <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
                      <p className="text-sm font-medium text-on-surface-variant">Escalated to District</p>
                      <h3 className="mt-2 text-3xl font-bold text-purple-700">{escalatedCount}</h3>
                      <p className="mt-3 text-xs text-on-surface-variant">Tertiary specialist care</p>
                    </div>

                    <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 shadow-sm">
                      <p className="text-sm font-medium text-teal-800">Back-Referred to Village</p>
                      <h3 className="mt-2 text-3xl font-bold text-teal-900">{backReferredCount}</h3>
                      <p className="mt-3 text-xs text-teal-800 font-medium">Ready for ASHA home visits</p>
                    </div>
                  </section>

                  {/* Search, Sort, Filter Controls */}
                  <SearchSortFilter
                    filters={filterState}
                    onChange={setFilterState}
                    totalCount={patientCases.length}
                    filteredCount={filteredCases.length}
                  />

                  {/* View Mode: Cards Grid vs Table List */}
                  {filterState.viewMode === "cards" ? (
                    filteredCases.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                        {filteredCases.map((patient) => (
                          <PatientCard
                            key={patient.id}
                            patient={patient}
                            onSelectEpisode={handleSelectPatientCase}
                            onOpenTimeline={(p) => {
                              setSelectedCaseForDrawer(p);
                              setDrawerOpen(true);
                            }}
                            onOpenTeleconsult={(p) => {
                              setSelectedCaseForTeleconsult(p);
                              setTeleconsultOpen(true);
                            }}
                            onEmergencyEscalate={(p) => {
                              setSelectedCaseForEmergency(p);
                              setEmergencyOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-outline-variant bg-surface p-12 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant text-2xl">
                          🔍
                        </div>
                        <h3 className="mt-3 text-base font-bold">No village patient cases match your filter</h3>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Try adjusting your search keywords, risk level, or care stage filter.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setFilterState({
                              search: "",
                              sortBy: "risk-desc",
                              risk: "ALL",
                              stage: "ALL",
                              category: "ALL",
                              viewMode: "cards",
                            })
                          }
                          className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
                        >
                          Reset Filters
                        </button>
                      </div>
                    )
                  ) : (
                    /* Table View with ReferralStatusStepper */
                    <section className="overflow-hidden rounded-3xl border border-outline-variant bg-surface shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left">
                          <thead className="border-b border-outline-variant bg-surface-container-low">
                            <tr>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                Patient & Geography
                              </th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                Condition & ABHA ID
                              </th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                6-Stage Referral Journey
                              </th>
                              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                Risk Priority
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                Frontline Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant">
                            {filteredCases.map((patient) => (
                              <tr key={patient.id} className="transition hover:bg-surface-container-low">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                                      {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-on-surface">{patient.name}</p>
                                      <p className="text-xs text-on-surface-variant">
                                        {patient.age}y {patient.gender} • {patient.village}, {patient.block}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-xs text-on-surface truncate max-w-[220px]">
                                    {patient.condition}
                                  </p>
                                  <span className="inline-block mt-0.5 font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border">
                                    {patient.abhaId}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <ReferralStatusStepper currentStage={patient.careStage} isCompact />
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                                      patient.riskLevel === "RED"
                                        ? "bg-rose-100 text-rose-800 animate-pulse"
                                        : patient.riskLevel === "YELLOW"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                  >
                                    <span
                                      className={`h-2 w-2 rounded-full ${
                                        patient.riskLevel === "RED"
                                          ? "bg-rose-600"
                                          : patient.riskLevel === "YELLOW"
                                          ? "bg-amber-500"
                                          : "bg-emerald-500"
                                      }`}
                                    />
                                    {patient.riskLevel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectPatientCase(patient)}
                                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition"
                                    >
                                      Care Episode
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCaseForDrawer(patient);
                                        setDrawerOpen(true);
                                      }}
                                      className="rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                                      title="Health Record"
                                    >
                                      Record
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCaseForTeleconsult(patient);
                                        setTeleconsultOpen(true);
                                      }}
                                      className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100"
                                      title="Teleconsult"
                                    >
                                      Tele
                                    </button>
                                    {patient.riskLevel === "RED" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedCaseForEmergency(patient);
                                          setEmergencyOpen(true);
                                        }}
                                        className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                                        title="Emergency 108"
                                      >
                                        108
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ASHA Auth Modal */}
      <AshaAuthModal
        isOpen={ashaAuthOpen}
        onClose={() => setAshaAuthOpen(false)}
      />

      {/* Modal: Switch or Intake New Patient */}
      {isSwitchingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface p-6 md:p-8 shadow-2xl border border-outline-variant">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl">person_add</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Intake New Village Patient</h3>
                  <p className="text-xs text-on-surface-variant">
                    Start a fresh Care Episode with digital triage assessment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSwitchingPatient(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleStartNewPatient} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={tempPatientName}
                  onChange={(e) => setTempPatientName(e.target.value)}
                  placeholder="e.g., Anjali Soren"
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Age & Gender *
                </label>
                <input
                  type="text"
                  required
                  value={tempAgeGender}
                  onChange={(e) => setTempAgeGender(e.target.value)}
                  placeholder="e.g., 29 F"
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              {/* REUSABLE GEOGRAPHY CASCADE: State -> District -> Block -> Village */}
              <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-3.5">
                <GeoCascadeSelect
                  value={tempGeo}
                  onChange={setTempGeo}
                  required
                />
              </div>


              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Initial Clinical Category *
                </label>
                <select
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-outline-variant flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwitchingPatient(false)}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm hover:bg-primary-hover"
                >
                  Start Care Episode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Situation Timeline / Care Journey Modal */}
      {situationModalOpen && selectedPatientForSituation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-surface p-6 md:p-8 shadow-2xl border border-outline-variant">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl">timeline</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Live Patient Situation & Care Journey</h2>
                  <p className="text-xs text-on-surface-variant">
                    Patient: <strong>{selectedPatientForSituation.patientName}</strong> ({selectedPatientForSituation.patientId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSituationModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Patient Header Card */}
            {(() => {
              const safeView = getPublicStatus(selectedPatientForSituation, "asha");
              return (
                <>
                  <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-on-surface-variant">Current Care Status:</span>
                      <p className="text-base font-bold text-primary">{safeView.displayStatus}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Current Facility: <strong>{safeView.displayFacility}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-on-surface-variant">Assigned Clinician:</span>
                      <p className="text-sm font-bold text-on-surface">{safeView.displayDoctor}</p>
                      <span className="inline-block mt-1 rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold">
                        Triage {safeView.triageLevel} • {safeView.priority}
                      </span>
                    </div>
                  </div>

                  {/* Chronological Care Journey Timeline */}
                  <div className="mt-6 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                      Patient Care Transitions
                    </h3>

                    {/* Step 1: Village Referral by ASHA */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-xs">
                          <span className="material-symbols-outlined text-base">volunteer_activism</span>
                        </div>
                        <div className="h-full w-0.5 bg-outline-variant my-1" />
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-bold text-on-surface">1. Village Health Sub-Centre Referral</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Referred by: <strong>{safeView.fromFacilityOrWorker}</strong>
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Location: {safeView.village}, {safeView.block}
                        </p>
                        <p className="text-xs text-on-surface mt-1 bg-surface-container-low p-2 rounded-lg border border-outline-variant">
                          Initial Reason: {safeView.displayNotes}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Block PHC / CHC */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-700 text-white text-xs">
                          <span className="material-symbols-outlined text-base">domain</span>
                        </div>
                        <div className="h-full w-0.5 bg-outline-variant my-1" />
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-bold text-on-surface">2. Block Health Office Triage & Evaluation</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Receiving Block Facility: <strong>{safeView.toFacility}</strong>
                        </p>
                        <p className="text-xs text-indigo-900 font-medium mt-1">
                          Situation: {safeView.lastAction}
                        </p>
                      </div>
                    </div>

                    {/* Step 3: District Hospital / Back-Referral */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-xs ${
                            safeView.status === "Back-Referred"
                              ? "bg-teal-700"
                              : "bg-purple-700"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {safeView.status === "Back-Referred" ? "assignment_return" : "local_hospital"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          {safeView.status === "Back-Referred"
                            ? "3. Patient Stabilized & Back-Referred to Village ASHA"
                            : "3. District Tertiary Care & Specialist Evaluation"}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Current Treating Doctor: <strong>{safeView.displayDoctor}</strong>
                        </p>
                        <p className="text-xs text-on-surface mt-1.5 p-2.5 rounded-xl border border-outline-variant bg-surface-container">
                          <strong>Latest Clinical Situation:</strong> {safeView.displayNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            <div className="mt-6 pt-4 border-t border-outline-variant flex justify-end">
              <button
                type="button"
                onClick={() => setSituationModalOpen(false)}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary"
              >
                Close Journey Tracker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task 2: Longitudinal Patient Record Drawer */}
      <PatientRecordDrawer
        patient={selectedCaseForDrawer}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStartTeleconsult={(p) => {
          setSelectedCaseForTeleconsult(p);
          setTeleconsultOpen(true);
        }}
        onStartEpisode={handleSelectPatientCase}
      />

      {/* Task 3: Assisted Teleconsultation Modal */}
      <TeleconsultationModal
        patient={selectedCaseForTeleconsult}
        isOpen={teleconsultOpen}
        onClose={() => setTeleconsultOpen(false)}
      />

      {/* Task 5: Emergency 108 Ambulance Escalation Modal */}
      <EmergencyEscalationModal
        patient={selectedCaseForEmergency}
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />
    </div>
  );
}
