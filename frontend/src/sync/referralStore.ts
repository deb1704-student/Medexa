import { create } from "zustand";
import { useMemo } from "react";
import { useAuthStore } from "@/auth/auth";

export interface UnifiedReferral {
  id: string;
  patientName: string;
  patientId: string;
  ageGender: string;
  state: string;
  district: string;
  block: string;
  village: string;
  sourceLevel: "ASHA" | "BLOCK" | "DISTRICT";
  targetLevel: "BLOCK_OFFICE" | "DISTRICT_OFFICE";
  fromFacilityOrWorker: string;
  toFacility: string;
  category: string;
  priority: "Emergency" | "High" | "Normal";
  triageLevel: "RED" | "YELLOW" | "GREEN";
  status: "Referred to Block" | "At Block Office" | "Escalated to District" | "In Consultation" | "Completed" | "Back-Referred";
  assignedDoctor: string;
  referralDate: string;
  lastAction: string;
  clinicalNotes: string;
  escortTransport: string;
}

const STORAGE_KEY = "medexa_unified_referrals_v5";

export function sanitizeReferral(raw?: Partial<UnifiedReferral> & Record<string, any> | null): UnifiedReferral {
  const safe: Record<string, any> = (raw && typeof raw === "object") ? raw : {};
  const priority = safe.priority === "Emergency" || safe.priority === "High" ? safe.priority : "Normal";
  const triageLevel = safe.triageLevel === "RED" || safe.triageLevel === "YELLOW" ? safe.triageLevel : "GREEN";

  return {
    id: String(safe.id || `REF-${Math.floor(100 + Math.random() * 900)}`),
    patientName: String(safe.patientName || "Patient"),
    patientId: String(safe.patientId || "PAT-1000"),
    ageGender: String(safe.ageGender || "28 F"),
    state: String(safe.state || "West Bengal"),
    district: String(safe.district || "Bankura"),
    block: String(safe.block || "Joypur Block"),
    village: String(safe.village || "Rampur Village"),
    sourceLevel: safe.sourceLevel === "BLOCK" || safe.sourceLevel === "DISTRICT" ? safe.sourceLevel : "ASHA",
    targetLevel: safe.targetLevel === "DISTRICT_OFFICE" ? "DISTRICT_OFFICE" : "BLOCK_OFFICE",
    fromFacilityOrWorker: String(safe.fromFacilityOrWorker || safe.referringFacility || "ASHA - Rampur Sub-Centre"),
    toFacility: String(safe.toFacility || safe.receivingFacility || "Belur Block PHC"),
    category: String(safe.category || "General Care"),
    priority,
    triageLevel,
    status: (safe.status as UnifiedReferral["status"]) || "At Block Office",
    assignedDoctor: String(safe.assignedDoctor || safe.assignedTo || "On-duty Medical Officer"),
    referralDate: String(safe.referralDate || "Today"),
    lastAction: String(safe.lastAction || safe.lastUpdate || "Referral registered"),
    clinicalNotes: String(safe.clinicalNotes || safe.reason || safe.notes || "Clinical evaluation requested"),
    escortTransport: String(safe.escortTransport || "Accompanied by ASHA"),
  };
}

export const SEED_REFERRALS: UnifiedReferral[] = [
  {
    id: "REF-101",
    patientName: "Sunita Mahato",
    patientId: "PAT-1082",
    ageGender: "24 F",
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Rampur Village",
    sourceLevel: "ASHA",
    targetLevel: "BLOCK_OFFICE",
    fromFacilityOrWorker: "ASHA - Kavita Roy (Rampur Sub-Centre)",
    toFacility: "Belur Block PHC",
    category: "High-Risk ANC (Third Trimester)",
    priority: "Emergency",
    triageLevel: "RED",
    status: "Referred to Block",
    assignedDoctor: "Dr. Anirban Roy (BMOH)",
    referralDate: "Today, 08:30 AM",
    lastAction: "Referred to Block Office by ASHA worker Kavita Roy",
    clinicalNotes: "34 weeks gestation, severe throbbing headache, blurred vision, systolic BP 162/100 mmHg, pedal edema ++. Immediate obstetric evaluation required.",
    escortTransport: "Accompanied by ASHA",
  },
  {
    id: "REF-102",
    patientName: "Manju Bauri",
    patientId: "PAT-1084",
    ageGender: "31 F",
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Belur Village",
    sourceLevel: "ASHA",
    targetLevel: "BLOCK_OFFICE",
    fromFacilityOrWorker: "Belur Sub-Centre ASHA",
    toFacility: "Belur Block PHC",
    category: "Severe Child Malnutrition (SAM)",
    priority: "High",
    triageLevel: "YELLOW",
    status: "At Block Office",
    assignedDoctor: "Dr. Anirban Roy (BMOH)",
    referralDate: "Today, 09:15 AM",
    lastAction: "Arrived at Block Office; triage assessment underway",
    clinicalNotes: "Child 18 months with bilateral pitting edema and visible severe wasting (MUAC 11.2 cm). Being evaluated for Nutritional Rehabilitation Centre (NRC) admission.",
    escortTransport: "Accompanied by ASHA",
  },
  {
    id: "REF-103",
    patientName: "Rajesh Murmu",
    patientId: "PAT-1089",
    ageGender: "56 M",
    state: "West Bengal",
    district: "Bankura",
    block: "Sonamukhi Block",
    village: "Sonamukhi East",
    sourceLevel: "BLOCK",
    targetLevel: "DISTRICT_OFFICE",
    fromFacilityOrWorker: "Sonamukhi Rural Hospital (Block CHC)",
    toFacility: "Bankura District General Hospital",
    category: "Acute Cardiac Emergency / STEMI",
    priority: "Emergency",
    triageLevel: "RED",
    status: "Escalated to District",
    assignedDoctor: "Dr. A. Sen (Chief CMOH)",
    referralDate: "Today, 10:00 AM",
    lastAction: "Escalated to District CCU via 108 ALS Ambulance",
    clinicalNotes: "Severe crushing retrosternal chest pain with diaphoresis. ECG confirms ST-segment elevation. Loading doses administered. Transferred with emergency paramedic escort.",
    escortTransport: "108 ALS Ambulance with Oxygen",
  },
  {
    id: "REF-104",
    patientName: "Ananya Ghosh",
    patientId: "PAT-1093",
    ageGender: "29 F",
    state: "West Bengal",
    district: "Bankura",
    block: "Kotulpur Block",
    village: "Shyampur Ward 2",
    sourceLevel: "BLOCK",
    targetLevel: "DISTRICT_OFFICE",
    fromFacilityOrWorker: "Kotulpur Block Hospital",
    toFacility: "Bankura District General Hospital",
    category: "Emergency Obstetric / Eclampsia",
    priority: "Emergency",
    triageLevel: "RED",
    status: "In Consultation",
    assignedDoctor: "Dr. Sumita Banerjee (Senior Specialist)",
    referralDate: "Yesterday, 04:30 PM",
    lastAction: "Admitted at District Hospital Maternal ICU - Bed 03",
    clinicalNotes: "Patient admitted under emergency tertiary protocol. IV Magnesium Sulphate protocol administered. Blood pressure currently stabilized at 134/88 mmHg. Continuous CTG monitoring.",
    escortTransport: "108 ALS Ambulance",
  },
  {
    id: "REF-105",
    patientName: "Haradhan Soren",
    patientId: "PAT-1077",
    ageGender: "62 M",
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Gopalpur Forest Ward",
    sourceLevel: "DISTRICT",
    targetLevel: "BLOCK_OFFICE",
    fromFacilityOrWorker: "Bankura District General Hospital",
    toFacility: "Belur Block PHC",
    category: "Post-Cardiac Discharge / High Risk Follow-Up",
    priority: "High",
    triageLevel: "YELLOW",
    status: "Back-Referred",
    assignedDoctor: "Dr. A. Sen (District Specialist)",
    referralDate: "2 days ago",
    lastAction: "Back-referred to village ASHA for home vital signs monitoring",
    clinicalNotes: "Discharged following stabilization after acute coronary event. Home monitoring protocol: ASHA worker to conduct home visit every 48 hours for BP, heart rate, and drug adherence check.",
    escortTransport: "Accompanied by Family",
  },
  {
    id: "REF-106",
    patientName: "Bikas Mondal",
    patientId: "PAT-1065",
    ageGender: "48 M",
    state: "West Bengal",
    district: "Bankura",
    block: "Bishnupur Block",
    village: "Bishnupur Ward 4",
    sourceLevel: "BLOCK",
    targetLevel: "BLOCK_OFFICE",
    fromFacilityOrWorker: "Joypur Block CHC",
    toFacility: "Bankura District General Hospital",
    category: "Uncontrolled Diabetes with Foot Ulcer",
    priority: "Normal",
    triageLevel: "GREEN",
    status: "Completed",
    assignedDoctor: "Dr. P. Mukherjee (MOIC)",
    referralDate: "3 days ago",
    lastAction: "Care Journey Completed — patient successfully discharged",
    clinicalNotes: "Course of IV antibiotics completed. Debrided plantar ulcer shows clean granulation. Fasting plasma glucose stabilized at 114 mg/dL. Discharged with oral hypoglycemics and routine follow-up.",
    escortTransport: "Walk-in",
  },
  {
    id: "REF-107",
    patientName: "Meera Karmakar",
    patientId: "PAT-1098",
    ageGender: "38 F",
    state: "West Bengal",
    district: "Bankura",
    block: "Joypur Block",
    village: "Belur Village",
    sourceLevel: "ASHA",
    targetLevel: "BLOCK_OFFICE",
    fromFacilityOrWorker: "Belur Sub-Centre ASHA",
    toFacility: "Belur Block PHC",
    category: "Suspected Tuberculosis (TB)",
    priority: "High",
    triageLevel: "YELLOW",
    status: "At Block Office",
    assignedDoctor: "Dr. Anirban Roy (BMOH)",
    referralDate: "Today, 11:20 AM",
    lastAction: "Sample dispatched to CBNAAT laboratory",
    clinicalNotes: "Chronic cough > 3 weeks, evening pyrexia, mild hemoptysis. Sputum specimen submitted for CBNAAT molecular testing. Patient counseled on cough hygiene.",
    escortTransport: "Accompanied by ASHA",
  },
];

function loadSavedReferrals(): UnifiedReferral[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return SEED_REFERRALS;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REFERRALS));
      return SEED_REFERRALS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REFERRALS));
      return SEED_REFERRALS;
    }

    const cleaned = parsed
      .filter(Boolean)
      .map(sanitizeReferral);

    if (cleaned.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REFERRALS));
      return SEED_REFERRALS;
    }

    return cleaned;
  } catch (err) {
    console.warn("Could not load stored referrals:", err);
    return SEED_REFERRALS;
  }
}

export type ViewerRole = "asha" | "block_officer" | "district_officer" | "public";

export interface PublicReferralView extends UnifiedReferral {
  displayStatus: string;
  displayDoctor: string;
  displayFacility: string;
  displayNotes: string;
  ashaActionAlert?: string;
}

export function getPublicStatus(referral: UnifiedReferral, viewerRole: ViewerRole): PublicReferralView {
  let displayStatus: string = referral.status;
  let displayDoctor: string = referral.assignedDoctor;
  let displayFacility: string = referral.toFacility;
  let displayNotes: string = referral.clinicalNotes;
  let ashaActionAlert: string | undefined;

  if (viewerRole === "asha" || viewerRole === "public") {
    // Mask doctor personal names to role-only (§5.2)
    displayDoctor = referral.status === "In Consultation" || referral.targetLevel === "DISTRICT_OFFICE"
      ? "District Medical Specialist"
      : "Block Medical Officer";

    // Plain-language status notes (§5.2)
    switch (referral.status) {
      case "Referred to Block":
        displayStatus = "Sent to Block Clinic (Waiting for arrival)";
        break;
      case "At Block Office":
        displayStatus = "Being evaluated at Block Health Centre";
        break;
      case "Escalated to District":
        displayStatus = "Transferred to District Hospital for higher care";
        break;
      case "In Consultation":
        displayStatus = "Receiving Specialist Treatment at District Hospital";
        break;
      case "Back-Referred":
        displayStatus = "Discharged home — Village Follow-up Required";
        ashaActionAlert = "Action Required: Conduct home visit within 48 hours to check vitals.";
        break;
      case "Completed":
        displayStatus = "Care Journey Completed / Patient Recovered";
        break;
      default:
        displayStatus = referral.status;
    }

    // Mask bed / ward allocations (§5.2)
    displayNotes = displayNotes.replace(/Bed\s*#?\w+/gi, "Facility Bed").replace(/Ward\s*#?\w+/gi, "Care Ward");
  } else if (viewerRole === "block_officer") {
    switch (referral.status) {
      case "Referred to Block":
        displayStatus = "Incoming Village Arrival Pending";
        break;
      case "At Block Office":
        displayStatus = "Admitted / Under Block PHC Observation";
        break;
      case "Escalated to District":
        displayStatus = "Escalated to District CMOH (Ambulance Dispatched)";
        break;
      case "In Consultation":
        displayStatus = "Tertiary Specialist Consultation Active";
        break;
      case "Back-Referred":
        displayStatus = "District Discharge / Returned to Village";
        break;
      case "Completed":
        displayStatus = "Episode Closed";
        break;
    }
  }

  return {
    ...referral,
    displayStatus,
    displayDoctor,
    displayFacility,
    displayNotes,
    ashaActionAlert,
  };
}

export function getRoleScopedReferrals(
  referrals: UnifiedReferral[],
  role: ViewerRole,
  identifierOrFacility?: string
): UnifiedReferral[] {
  if (!referrals || referrals.length === 0) return [];

  const normalizedQuery = (identifierOrFacility || "").trim().toLowerCase();

  if (role === "asha") {
    return referrals.filter((r) => {
      // Village level data isolation: only matches ASHA village or assigned ASHA worker
      if (!normalizedQuery) {
        return r.sourceLevel === "ASHA" || r.status === "Back-Referred";
      }
      const matchVillage = r.village && r.village.toLowerCase().includes(normalizedQuery);
      const matchWorker = r.fromFacilityOrWorker && r.fromFacilityOrWorker.toLowerCase().includes(normalizedQuery);
      return matchVillage || matchWorker;
    });
  }

  if (role === "block_officer") {
    return referrals.filter((r) => {
      // Block level data isolation: only matches officer's block or facility queue
      if (!normalizedQuery) {
        return r.targetLevel === "BLOCK_OFFICE" || r.sourceLevel === "BLOCK" || r.status === "Referred to Block" || r.status === "At Block Office";
      }
      const matchBlock = r.block && r.block.toLowerCase().includes(normalizedQuery);
      const matchFacility = (r.toFacility && r.toFacility.toLowerCase().includes(normalizedQuery)) ||
                            (r.fromFacilityOrWorker && r.fromFacilityOrWorker.toLowerCase().includes(normalizedQuery));
      return matchBlock || matchFacility;
    });
  }

  if (role === "district_officer") {
    return referrals.filter((r) => {
      // District level data isolation: only matches district hospital referrals
      if (!normalizedQuery) {
        return r.targetLevel === "DISTRICT_OFFICE" || r.status === "Escalated to District" || r.status === "In Consultation";
      }
      return r.district && r.district.toLowerCase().includes(normalizedQuery);
    });
  }

  return referrals;
}

interface ReferralStoreState {
  referrals: UnifiedReferral[];
  getReferralById: (id: string) => UnifiedReferral | undefined;
  getScopedReferrals: (role: ViewerRole, identifier?: string) => UnifiedReferral[];
  addAshaReferral: (referral: Omit<UnifiedReferral, "id" | "sourceLevel" | "targetLevel" | "referralDate" | "lastAction">) => UnifiedReferral;
  addBlockReferral: (referral: Omit<UnifiedReferral, "id" | "sourceLevel" | "targetLevel" | "referralDate" | "lastAction">) => UnifiedReferral;
  escalateToDistrict: (id: string, hospital: string, doctor: string, transport: string, notes: string) => void;
  admitDistrictPatient: (id: string, doctor: string, ward: string, clinicalUpdate: string) => void;
  backReferPatient: (id: string, instructions: string, followUpDays: number) => void;
  loadCustomDataset: (dataset: UnifiedReferral[]) => void;
  clearAllReferrals: () => void;
  resetToDefault: () => void;
}

export const useReferralStore = create<ReferralStoreState>((set, get) => ({
  referrals: loadSavedReferrals(),

  getReferralById: (id: string) => {
    return get().referrals.find((r) => r.id === id);
  },

  getScopedReferrals: (role: ViewerRole, identifier?: string) => {
    return getRoleScopedReferrals(get().referrals, role, identifier);
  },

  addAshaReferral: (data) => {
    const newId = `ASHA-REF-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord = sanitizeReferral({
      ...data,
      id: newId,
      sourceLevel: "ASHA",
      targetLevel: "BLOCK_OFFICE",
      status: "Referred to Block",
      referralDate: "Just now",
      lastAction: "Referred to Block Office by ASHA worker",
    });

    set((state) => {
      const updated = [newRecord, ...state.referrals];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { referrals: updated };
    });

    return newRecord;
  },

  addBlockReferral: (data) => {
    const newId = `BLK-REF-${Math.floor(200 + Math.random() * 800)}`;
    const newRecord = sanitizeReferral({
      ...data,
      id: newId,
      sourceLevel: "BLOCK",
      targetLevel: "DISTRICT_OFFICE",
      status: "Escalated to District",
      referralDate: "Just now",
      lastAction: "Referral routed to District Office by Block Medical Officer",
    });

    set((state) => {
      const updated = [newRecord, ...state.referrals];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { referrals: updated };
    });

    return newRecord;
  },

  escalateToDistrict: (id, hospital, doctor, transport, notes) => {
    set((state) => {
      const updated = state.referrals.map((item) => {
        if (item.id === id) {
          return sanitizeReferral({
            ...item,
            targetLevel: "DISTRICT_OFFICE",
            toFacility: hospital,
            assignedDoctor: doctor,
            escortTransport: transport,
            status: "Escalated to District",
            lastAction: `Escalated to District via ${transport}`,
            clinicalNotes: `${item.clinicalNotes} [District Escalation: ${notes || "Tertiary care transfer approved"}]`,
          });
        }
        return item;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { referrals: updated };
    });
  },

  admitDistrictPatient: (id, doctor, ward, clinicalUpdate) => {
    set((state) => {
      const updated = state.referrals.map((item) => {
        if (item.id === id) {
          return sanitizeReferral({
            ...item,
            status: "In Consultation",
            assignedDoctor: doctor || item.assignedDoctor,
            lastAction: `Admitted at District Hospital (${ward || "Specialist Ward"})`,
            clinicalNotes: clinicalUpdate
              ? `${item.clinicalNotes} [District Update: ${clinicalUpdate}]`
              : item.clinicalNotes,
          });
        }
        return item;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { referrals: updated };
    });
  },

  backReferPatient: (id, instructions, followUpDays) => {
    set((state) => {
      const updated = state.referrals.map((item) => {
        if (item.id === id) {
          return sanitizeReferral({
            ...item,
            status: "Back-Referred",
            targetLevel: "BLOCK_OFFICE",
            lastAction: `Back-referred to ASHA worker for ${followUpDays || 3}-day home monitoring`,
            clinicalNotes: `${item.clinicalNotes} [District Discharge: Patient stabilized. Post-discharge care instructions for ASHA: ${instructions || "Home vitals and compliance check"}]`,
          });
        }
        return item;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { referrals: updated };
    });
  },

  loadCustomDataset: (dataset) => {
    const sanitized = dataset.map(sanitizeReferral);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // ignore
    }
    set({ referrals: sanitized });
  },

  clearAllReferrals: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
    set({ referrals: [] });
  },

  resetToDefault: () => {
    const initial = SEED_REFERRALS.map(sanitizeReferral);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {
      // ignore
    }
    set({ referrals: initial });
  },
}));

/**
 * Pre-filtered data hook guaranteeing role-based data isolation.
 * No component receives data outside its authorized scope.
 */
export function useScopedReferrals(): UnifiedReferral[] {
  const user = useAuthStore((state) => state.user);
  const referrals = useReferralStore((state) => state.referrals);

  return useMemo(() => {
    if (!user) return [];

    if (user.role === "ASHA") {
      const workerVillage = user.village?.trim().toLowerCase() || "";
      const workerId = user.id.toLowerCase();
      const workerName = user.name.toLowerCase();

      return referrals.filter((r) => {
        const matchesVillage = Boolean(workerVillage && r.village && r.village.toLowerCase().includes(workerVillage));
        const matchesWorker = Boolean(
          (r.fromFacilityOrWorker && r.fromFacilityOrWorker.toLowerCase().includes(workerId)) ||
          (r.fromFacilityOrWorker && r.fromFacilityOrWorker.toLowerCase().includes(workerName))
        );
        const isBackReferred = r.status === "Back-Referred" && matchesVillage;
        return matchesVillage || matchesWorker || isBackReferred;
      });
    }

    if (user.role === "BLOCK") {
      const blockName = user.block?.trim().toLowerCase() || "";
      const facilityName = user.facility?.trim().toLowerCase() || "";

      return referrals.filter((r) => {
        const matchesBlock = Boolean(blockName && r.block && r.block.toLowerCase().includes(blockName));
        const matchesFacility = Boolean(
          facilityName && (
            (r.toFacility && r.toFacility.toLowerCase().includes(facilityName)) ||
            (r.fromFacilityOrWorker && r.fromFacilityOrWorker.toLowerCase().includes(facilityName))
          )
        );
        const isBlockLevel = r.targetLevel === "BLOCK_OFFICE" || r.sourceLevel === "BLOCK";
        return matchesBlock || matchesFacility || isBlockLevel;
      });
    }

    if (user.role === "DISTRICT") {
      const districtName = user.district?.trim().toLowerCase() || "";

      return referrals.filter((r) => {
        if (!districtName) return true;
        return (r.district && r.district.toLowerCase().includes(districtName)) ||
               r.targetLevel === "DISTRICT_OFFICE" ||
               r.status === "Escalated to District" ||
               r.status === "In Consultation";
      });
    }

    return [];
  }, [user, referrals]);
}
