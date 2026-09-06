
export interface RegisteredCredential {
  id: string;
  name: string;
  role: "asha" | "block_officer" | "district_officer";
  pin: string;
  designation: string;
  facilityOrVillage: string;
}

/**
 * Health Worker Registry Database (simulating verified government registry)
 */
export const HEALTH_REGISTRY_DATABASE: Record<string, RegisteredCredential> = {
  "ASHA-WB-BNK-042": {
    id: "ASHA-WB-BNK-042",
    name: "Kavita Roy",
    role: "asha",
    pin: "1234",
    designation: "Accredited Social Health Activist (ASHA)",
    facilityOrVillage: "Abhirampur / Rampur Sector",
  },
  "ASHA-WB-401": {
    id: "ASHA-WB-401",
    name: "Kavita Roy",
    role: "asha",
    pin: "1234",
    designation: "Accredited Social Health Activist (ASHA)",
    facilityOrVillage: "Rampur Village / Belur Sector",
  },
  "ASHA-WB-402": {
    id: "ASHA-WB-402",
    name: "Radha Sen",
    role: "asha",
    pin: "1234",
    designation: "Accredited Social Health Activist (ASHA)",
    facilityOrVillage: "Sonamukhi East Sector",
  },
  "ASHA-WB-403": {
    id: "ASHA-WB-403",
    name: "Manju Das",
    role: "asha",
    pin: "1234",
    designation: "Accredited Social Health Activist (ASHA)",
    facilityOrVillage: "Shyampur Sector",
  },
  "BHO-WB-204": {
    id: "BHO-WB-204",
    name: "Dr. Anirban Roy",
    role: "block_officer",
    pin: "4321",
    designation: "Block Medical Officer of Health (BMOH / MOIC)",
    facilityOrVillage: "Belur Block Primary Health Centre",
  },
  "BHO-WB-205": {
    id: "BHO-WB-205",
    name: "Dr. P. Mukherjee",
    role: "block_officer",
    pin: "4321",
    designation: "Block Medical Officer of Health (BMOH / MOIC)",
    facilityOrVillage: "Joypur Block Community Health Centre",
  },
  "CMOH-DIST-101": {
    id: "CMOH-DIST-101",
    name: "Dr. A. Sen",
    role: "district_officer",
    pin: "5678",
    designation: "Chief Medical Officer of Health (CMOH) & Tertiary Specialist",
    facilityOrVillage: "Bankura District General Hospital",
  },
  "CMOH-DIST-102": {
    id: "CMOH-DIST-102",
    name: "Dr. S. Chatterjee",
    role: "district_officer",
    pin: "5678",
    designation: "District Hospital Medical Superintendent & Chief Surgeon",
    facilityOrVillage: "Bankura District Hospital",
  },
  "DHO-WB-101": {
    id: "DHO-WB-101",
    name: "Dr. Swapan Banerjee",
    role: "district_officer",
    pin: "9876",
    designation: "Chief Medical Officer of Health (CMOH) & Tertiary Specialist",
    facilityOrVillage: "Bankura District General Hospital",
  },
  "DHO-WB-102": {
    id: "DHO-WB-102",
    name: "Dr. Arundhati Ghosh",
    role: "district_officer",
    pin: "9876",
    designation: "District Hospital Medical Superintendent",
    facilityOrVillage: "Purulia District Hospital",
  },
};

import { useAuthStore } from "@/auth/auth";
import type { Role } from "@/auth/authTypes";

export interface ReferralUser {
  id: string;
  name: string;
  role: "asha" | "block_officer" | "district_officer";
  designation: string;
  facilityOrVillage: string;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
}

export interface RegisteredCredential {
  id: string;
  name: string;
  role: "asha" | "block_officer" | "district_officer";
  pin: string;
  designation: string;
  facilityOrVillage: string;
}

function roleToLegacy(role: Role): "asha" | "block_officer" | "district_officer" {
  if (role === "ASHA") return "asha";
  if (role === "BLOCK") return "block_officer";
  return "district_officer";
}

function legacyToRole(role: "asha" | "block_officer" | "district_officer"): Role {
  if (role === "asha") return "ASHA";
  if (role === "block_officer") return "BLOCK";
  return "DISTRICT";
}

/**
 * useReferralAuth adapter backed by centralized useAuthStore.
 * Enforces strict single-role exclusivity so an ASHA user cannot simultaneously have Block/District privileges.
 */
export const useReferralAuth = () => {
  const { user, login, quickLogin, logout } = useAuthStore();

  const ashaUser: ReferralUser | null =
    user && user.role === "ASHA"
      ? {
          id: user.id,
          name: user.name,
          role: "asha",
          designation: user.designation || "ASHA Frontline Worker",
          facilityOrVillage: user.facilityOrVillage,
          state: user.state,
          district: user.district,
          block: user.block,
          village: user.village,
        }
      : null;

  const blockOfficerUser: ReferralUser | null =
    user && user.role === "BLOCK"
      ? {
          id: user.id,
          name: user.name,
          role: "block_officer",
          designation: user.designation || "Block Health Officer",
          facilityOrVillage: user.facilityOrVillage,
          state: user.state,
          district: user.district,
          block: user.block,
          village: user.village,
        }
      : null;

  const districtOfficerUser: ReferralUser | null =
    user && user.role === "DISTRICT"
      ? {
          id: user.id,
          name: user.name,
          role: "district_officer",
          designation: user.designation || "District Medical Officer",
          facilityOrVillage: user.facilityOrVillage,
          state: user.state,
          district: user.district,
          block: user.block,
          village: user.village,
        }
      : null;

  return {
    ashaUser,
    blockOfficerUser,
    districtOfficerUser,

    isAshaAuthenticated: () => user?.role === "ASHA",
    isBlockOfficerAuthenticated: () => user?.role === "BLOCK",
    isDistrictOfficerAuthenticated: () => user?.role === "DISTRICT",

    verifyAndLogin: (
      identifier: string,
      pin: string,
      expectedRole: "asha" | "block_officer" | "district_officer"
    ) => {
      const res = login(identifier, pin, legacyToRole(expectedRole));
      if (!res.success || !res.user) {
        return { success: false, error: res.error };
      }
      return {
        success: true,
        user: {
          id: res.user.id,
          name: res.user.name,
          role: roleToLegacy(res.user.role),
          designation: res.user.designation || "",
          facilityOrVillage: res.user.facilityOrVillage,
          state: res.user.state,
          district: res.user.district,
          block: res.user.block,
          village: res.user.village,
        },
      };
    },

    loginAsha: (workerId = "ASHA-WB-401") => {
      quickLogin(workerId);
    },

    logoutAsha: () => {
      if (user?.role === "ASHA") logout();
    },

    loginBlockOfficer: (officerId = "BHO-WB-204") => {
      quickLogin(officerId);
    },

    logoutBlockOfficer: () => {
      if (user?.role === "BLOCK") logout();
    },

    loginDistrictOfficer: (officerId = "CMOH-DIST-101") => {
      quickLogin(officerId);
    },

    logoutDistrictOfficer: () => {
      if (user?.role === "DISTRICT") logout();
    },

    logoutAll: () => {
      logout();
    },
  };
};

// Static getState helper for components calling useReferralAuth.getState()
useReferralAuth.getState = () => useReferralAuth();

