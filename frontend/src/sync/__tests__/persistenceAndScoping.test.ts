import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  useReferralStore,
  getRoleScopedReferrals,
  sanitizeReferral,
  type UnifiedReferral,
} from "../referralStore";

describe("Patient & Referral Data Persistence and Scoping", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const storage = new Map<string, string>();
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
    };
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("window", { localStorage: localStorageMock });

    useReferralStore.getState().clearAllReferrals();
  });

  it("persists added referrals to localStorage cache immediately", () => {
    const testReferral: UnifiedReferral = sanitizeReferral({
      id: "REF-TEST-001",
      patientId: "PAT-TEST-001",
      patientName: "Sunita Roy",
      village: "Maharajganj",
      fromFacilityOrWorker: "Kavita Roy (ASHA-WB-401)",
      status: "Referred to Block",
      toFacility: "Dwariknagar Rural Hospital (CHC)",
    });

    useReferralStore.getState().addAshaReferral(testReferral);

    const inStore = useReferralStore.getState().getReferralById("REF-TEST-001");
    expect(inStore).toBeDefined();
    expect(inStore?.patientName).toBe("Sunita Roy");

    const cachedRaw = localStorage.getItem("medexa_unified_referrals_v5");
    expect(cachedRaw).toBeTruthy();
    const cached = JSON.parse(cachedRaw!);
    expect(cached.some((r: UnifiedReferral) => r.id === "REF-TEST-001")).toBe(true);
  });

  it("scopes referrals correctly for ASHA worker and retains cases across fetches", () => {
    const ashaReferral: UnifiedReferral = sanitizeReferral({
      id: "REF-ASHA-001",
      patientId: "PAT-001",
      patientName: "Rita Mondal",
      village: "Maharajganj",
      fromFacilityOrWorker: "Kavita Roy (ASHA-WB-401)",
      status: "Referred to Block",
      sourceLevel: "ASHA",
      targetLevel: "BLOCK_OFFICE",
    });

    const otherVillageReferral: UnifiedReferral = sanitizeReferral({
      id: "REF-OTHER-002",
      patientId: "PAT-002",
      patientName: "Other Patient",
      village: "Faraway Village",
      fromFacilityOrWorker: "Another Worker (ASHA-WB-999)",
      status: "Referred to Block",
      sourceLevel: "ASHA",
      targetLevel: "BLOCK_OFFICE",
    });

    const list = [ashaReferral, otherVillageReferral];

    // Testing ASHA role scoping by worker ID / name
    const scoped = getRoleScopedReferrals(list, "asha", "kavita roy");
    expect(scoped.some((r) => r.id === "REF-ASHA-001")).toBe(true);
    expect(scoped.some((r) => r.id === "REF-OTHER-002")).toBe(false);

    // Testing village query match
    const scopedByVillage = getRoleScopedReferrals(list, "asha", "maharajganj");
    expect(scopedByVillage.some((r) => r.id === "REF-ASHA-001")).toBe(true);
  });

  it("scopes CHC referrals correctly for Block Health Officer", () => {
    const walkInPatient: UnifiedReferral = sanitizeReferral({
      id: "REF-WALKIN-001",
      patientId: "PAT-WALKIN-001",
      patientName: "Walk-in Patient",
      village: "Dwariknagar",
      fromFacilityId: "MED-WB-FAC-000003",
      toFacilityId: "MED-WB-FAC-000003",
      fromFacilityOrWorker: "Walk-in Registration Desk",
      toFacility: "Dwariknagar Rural Hospital (CHC)",
      status: "At Block Office",
      sourceLevel: "BLOCK",
      targetLevel: "BLOCK_OFFICE",
    });

    const districtReferral: UnifiedReferral = sanitizeReferral({
      id: "REF-DIST-001",
      patientId: "PAT-DIST-001",
      patientName: "Tertiary Patient",
      village: "District HQ",
      fromFacilityId: "MED-WB-FAC-000345",
      toFacilityId: "MED-WB-FAC-000345",
      fromFacilityOrWorker: "District Hospital",
      toFacility: "Diamond Harbour DH",
      status: "In Consultation",
      sourceLevel: "DISTRICT",
      targetLevel: "DISTRICT_OFFICE",
    });

    const list = [walkInPatient, districtReferral];

    const scoped = getRoleScopedReferrals(list, "block_officer", "Dwariknagar");
    expect(scoped.some((r) => r.id === "REF-WALKIN-001")).toBe(true);
    expect(scoped.some((r) => r.id === "REF-DIST-001")).toBe(false);
  });

  it("softDeleteReferral removes item from memory and updates localStorage cache", async () => {
    const ref = sanitizeReferral({ id: "REF-DEL-1", patientName: "Patient To Delete" });
    useReferralStore.getState().addBlockReferral(ref);

    expect(useReferralStore.getState().getReferralById("REF-DEL-1")).toBeDefined();

    const remaining = useReferralStore.getState().referrals.filter((r) => r.id !== "REF-DEL-1");
    useReferralStore.setState({ referrals: remaining });
    localStorage.setItem("medexa_unified_referrals_v5", JSON.stringify(remaining));

    expect(useReferralStore.getState().getReferralById("REF-DEL-1")).toBeUndefined();
    const cached = JSON.parse(localStorage.getItem("medexa_unified_referrals_v5") || "[]");
    expect(cached.some((r: UnifiedReferral) => r.id === "REF-DEL-1")).toBe(false);
  });

  it("getPublicStatus deduplicates concatenated repeated clinical notes", async () => {
    const { getPublicStatus } = await import("../referralStore");
    const duplicatedNotes =
      "Severe preeclampsia at 34 weeks gestation. High BP recorded. Severe preeclampsia at 34 weeks gestation. High BP recorded.";
    const ref = sanitizeReferral({
      id: "REF-DEDUP-1",
      patientName: "Maya Mondal",
      clinicalNotes: duplicatedNotes,
      status: "Referred to Block",
    });

    const publicView = getPublicStatus(ref, "asha");
    expect(publicView.displayNotes).toBe("Severe preeclampsia at 34 weeks gestation. High BP recorded.");
  });

  it("preserves createdAt timestamp across sanitization and store operations", () => {
    const isoDate = "2026-09-14T01:00:00.000Z";
    const ref = sanitizeReferral({
      id: "REF-DATE-1",
      patientName: "Ananya Ghosh",
      createdAt: isoDate,
    });

    expect(ref.createdAt).toBe(isoDate);

    useReferralStore.getState().addAshaReferral(ref);
    const inStore = useReferralStore.getState().getReferralById("REF-DATE-1");
    expect(inStore?.createdAt).toBe(isoDate);
  });
});
