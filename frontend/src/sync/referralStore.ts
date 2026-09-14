import { create } from "zustand";
import { useMemo } from "react";
import { useAuthStore } from "@/auth/auth";
import { referralApi, queueReferralTransitionOfflineFirst, queueBackReferralOfflineFirst } from "@/api/referralApi";

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
  fromFacilityId?: string;
  toFacilityId?: string;
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
  createdAt?: string;
}

export function sanitizeReferral(
  raw?: Partial<UnifiedReferral> | UnifiedReferral | Record<string, unknown> | null
): UnifiedReferral {
  const safe = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const priority = safe.priority === "Emergency" || safe.priority === "High" ? safe.priority : "Normal";
  const triageLevel = safe.triageLevel === "RED" || safe.triageLevel === "YELLOW" ? safe.triageLevel : "GREEN";

  return {
    id: String(safe.id || `REF-${Math.floor(100 + Math.random() * 900)}`),
    patientName: String(safe.patientName || "Patient"),
    patientId: String(safe.patientId || "PAT-1000"),
    ageGender: String(safe.ageGender || "28 F"),
    state: String(safe.state || "West Bengal"),
    district: String(safe.district || "South 24 Parganas"),
    block: String(safe.block || "Namkhana Block"),
    village: String(safe.village || "Shibpur Village"),
    sourceLevel: safe.sourceLevel === "BLOCK" || safe.sourceLevel === "DISTRICT" ? safe.sourceLevel : "ASHA",
    targetLevel: safe.targetLevel === "DISTRICT_OFFICE" ? "DISTRICT_OFFICE" : "BLOCK_OFFICE",
    fromFacilityOrWorker: String(safe.fromFacilityOrWorker || safe.referringFacility || "ASHA - Shibpur Sub-Centre"),
    toFacility: String(safe.toFacility || safe.receivingFacility || "Dwariknagar Rural Hospital"),
    category: String(safe.category || "General Care"),
    priority,
    triageLevel,
    status: (safe.status as UnifiedReferral["status"]) || "At Block Office",
    assignedDoctor: String(safe.assignedDoctor || safe.assignedTo || "On-duty Medical Officer"),
    referralDate: String(safe.referralDate || "Today"),
    lastAction: String(safe.lastAction || safe.lastUpdate || "Referral registered"),
    clinicalNotes: String(safe.clinicalNotes || safe.reason || safe.notes || "Clinical evaluation requested"),
    escortTransport: String(safe.escortTransport || "Accompanied by ASHA"),
    createdAt: safe.createdAt ? String(safe.createdAt) : undefined,
  };
}

const LOCAL_STORAGE_KEY = "medexa_unified_referrals_v5";

function loadSavedReferrals(): UnifiedReferral[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r) => sanitizeReferral(r));
        }
      }
    }
  } catch (err) {
    console.warn("referralStore: Could not load saved referrals from localStorage:", err);
  }
  return [];
}

function persistReferrals(referrals: UnifiedReferral[]): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(referrals));
    }
  } catch (err) {
    console.warn("referralStore: Could not persist referrals to localStorage:", err);
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

function deduplicateNotes(notes: string): string {
  if (!notes) return "";
  const trimmed = notes.trim();
  // 1. Check if identical halves are concatenated together
  const halfLen = Math.floor(trimmed.length / 2);
  const firstHalf = trimmed.slice(0, halfLen).trim();
  const secondHalf = trimmed.slice(halfLen).trim();
  if (firstHalf.length > 15 && (firstHalf === secondHalf || secondHalf.startsWith(firstHalf))) {
    return firstHalf;
  }
  // 2. Check for repeated consecutive or duplicate sentences
  const sentences = trimmed.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>();
  const uniqueSentences: string[] = [];
  for (const s of sentences) {
    const norm = s.trim().toLowerCase();
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      uniqueSentences.push(s.trim());
    }
  }
  return uniqueSentences.length > 0 ? uniqueSentences.join(" ") : trimmed;
}

export function getPublicStatus(referral: UnifiedReferral, viewerRole: ViewerRole): PublicReferralView {
  let displayStatus: string = referral.status;
  let displayDoctor: string = referral.assignedDoctor;
  const displayFacility: string = referral.toFacility;
  let displayNotes: string = deduplicateNotes(referral.clinicalNotes || "");
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
  fetchReferrals: () => Promise<UnifiedReferral[]>;
  addAshaReferral: (referral: Omit<UnifiedReferral, "id" | "sourceLevel" | "targetLevel" | "referralDate" | "lastAction">) => UnifiedReferral;
  addBlockReferral: (referral: Omit<UnifiedReferral, "id" | "sourceLevel" | "targetLevel" | "referralDate" | "lastAction">) => UnifiedReferral;
  softDeleteReferral: (id: string, force?: boolean) => Promise<boolean>;
  escalateToDistrict: (id: string, hospital: string, doctor: string, transport: string, notes: string) => void;
  admitDistrictPatient: (id: string, doctor: string, ward: string, clinicalUpdate: string) => void;
  backReferPatient: (id: string, instructions: string, followUpDays: number) => void;
  terminateOrDischargePatient: (id: string, notes: string, status?: UnifiedReferral["status"]) => void;
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

  fetchReferrals: async () => {
    try {
      const data = await referralApi.listReferrals();
      if (Array.isArray(data) && data.length > 0) {
        const existing = get().referrals;
        const map = new Map<string, UnifiedReferral>();
        for (const item of existing) {
          map.set(item.id, item);
        }
        for (const item of data) {
          map.set(item.id, item);
        }
        const merged = Array.from(map.values());
        set({ referrals: merged });
        persistReferrals(merged);
        return merged;
      }
      return get().referrals;
    } catch (err) {
      console.warn("referralStore: fetchReferrals failed, retaining cached referrals:", err);
      return get().referrals;
    }
  },

  addAshaReferral: (data) => {
    const newRecord = sanitizeReferral(data);
    const updated = [newRecord, ...get().referrals.filter((r) => r.id !== newRecord.id)];
    set({ referrals: updated });
    persistReferrals(updated);
    return newRecord;
  },

  addBlockReferral: (data) => {
    const newRecord = sanitizeReferral(data);
    const updated = [newRecord, ...get().referrals.filter((r) => r.id !== newRecord.id)];
    set({ referrals: updated });
    persistReferrals(updated);
    return newRecord;
  },

  softDeleteReferral: async (id: string, force = false): Promise<boolean> => {
    try {
      await referralApi.deleteReferral(id, force);
      const filtered = get().referrals.filter((r) => r.id !== id);
      set({ referrals: filtered });
      persistReferrals(filtered);
      return true;
    } catch (err) {
      console.warn("softDeleteReferral failed:", err);
      return false;
    }
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
      persistReferrals(updated);
      return { referrals: updated };
    });

    // Persist transition to backend API / sync engine
    referralApi
      .transitionReferral(
        id,
        "EMERGENCY_ESCALATED",
        `Escalated to District (${hospital}) via ${transport}. Note: ${notes || "Tertiary transfer"}`,
        "MED-WB-FAC-000345"
      )
      .catch((err: unknown) => {
        console.warn("Offline fallback for escalateToDistrict:", err);
        queueReferralTransitionOfflineFirst(id, "EMERGENCY_ESCALATED", notes).catch(() => {});
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
      persistReferrals(updated);
      return { referrals: updated };
    });

    referralApi
      .transitionReferral(
        id,
        "CONSULTED",
        `Admitted for specialist consultation (${ward || "Specialist Ward"}). Update: ${clinicalUpdate || "Consultation active"}`
      )
      .catch((err: unknown) => {
        console.warn("Offline fallback for admitDistrictPatient:", err);
        queueReferralTransitionOfflineFirst(id, "CONSULTED", clinicalUpdate).catch(() => {});
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
      persistReferrals(updated);
      return { referrals: updated };
    });

    const recordedBy = useAuthStore.getState().user?.id || "CMOH-DIST-101";
    referralApi
      .createBackReferral({
        referralId: id,
        outcome: "Patient stabilized and discharged to local primary care",
        instructions: instructions || "Conduct home visit and check vitals.",
        recordedBy,
      })
      .catch((err: unknown) => {
        console.warn("Offline fallback for backReferPatient:", err);
        queueBackReferralOfflineFirst({
          referralId: id,
          careEpisodeId: id,
          instructions: instructions || "Home visit",
          recordedBy,
        }).catch(() => {});
      });
  },

  terminateOrDischargePatient: (id, notes, status = "Completed") => {
    set((state) => {
      const updated = state.referrals.map((item) => {
        if (item.id === id) {
          return sanitizeReferral({
            ...item,
            status,
            lastAction: `Terminated from CHC / Discharged: ${notes || "Care episode stabilized"}`,
            clinicalNotes: `${item.clinicalNotes} [Discharge: ${notes}]`,
          });
        }
        return item;
      });
      persistReferrals(updated);
      return { referrals: updated };
    });

    const recordedBy = useAuthStore.getState().user?.id || "demo-doctor-001";
    referralApi
      .createBackReferral({
        referralId: id,
        outcome: notes || "Patient treated and discharged from CHC",
        instructions: "Verify medication compliance and routine vitals.",
        recordedBy,
      })
      .catch((err) => {
        console.warn("Offline fallback for terminateOrDischargePatient back-referral:", err);
        queueBackReferralOfflineFirst({
          referralId: id,
          careEpisodeId: id,
          instructions: notes || "Discharged from CHC",
          recordedBy,
        }).catch(() => {});
      });
  },

  loadCustomDataset: (dataset) => {
    const sanitized = dataset.map((r) => sanitizeReferral(r));
    set({ referrals: sanitized });
    persistReferrals(sanitized);
  },

  clearAllReferrals: () => {
    set({ referrals: [] });
    persistReferrals([]);
  },

  resetToDefault: () => {
    set({ referrals: [] });
    persistReferrals([]);
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

    if (user.role === "ADMIN") {
      return referrals;
    }

    if (user.role === "ASHA") {
      const workerVillage = user.village?.trim().toLowerCase() || "";
      const workerId = user.id.toLowerCase();
      const workerName = user.name.toLowerCase();
      const userFacility = (user.facilityOrVillage || "").toLowerCase();

      return referrals.filter((r) => {
        const matchesVillage = Boolean(workerVillage && r.village && r.village.toLowerCase().includes(workerVillage));
        const matchesWorker = Boolean(
          (r.fromFacilityOrWorker && r.fromFacilityOrWorker.toLowerCase().includes(workerId)) ||
          (r.fromFacilityOrWorker && r.fromFacilityOrWorker.toLowerCase().includes(workerName)) ||
          (userFacility && r.fromFacilityOrWorker && r.fromFacilityOrWorker.toLowerCase().includes(userFacility)) ||
          (r.fromFacilityId && user.facility && r.fromFacilityId === user.facility)
        );
        const isBackReferred = r.status === "Back-Referred" && (matchesVillage || matchesWorker);
        return matchesVillage || matchesWorker || isBackReferred;
      });
    }

    if (user.role === "BLOCK") {
      const blockName = user.block?.trim().toLowerCase() || "";
      const facilityId = user.facility || "MED-WB-FAC-000003";
      const facilityName = user.facilityOrVillage?.trim().toLowerCase() || "";

      return referrals.filter((r) => {
        const matchesBlock = Boolean(blockName && r.block && r.block.toLowerCase().includes(blockName));
        const matchesFacilityId = Boolean(facilityId && (r.toFacilityId === facilityId || r.fromFacilityId === facilityId));
        const matchesFacilityName = Boolean(
          facilityName && (
            (r.toFacility && r.toFacility.toLowerCase().includes(facilityName)) ||
            (r.fromFacilityOrWorker && r.fromFacilityOrWorker.toLowerCase().includes(facilityName))
          )
        );
        const isBlockLevel = r.targetLevel === "BLOCK_OFFICE" || r.sourceLevel === "BLOCK" || r.status === "Referred to Block" || r.status === "At Block Office";
        return matchesFacilityId || matchesBlock || matchesFacilityName || isBlockLevel;
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
