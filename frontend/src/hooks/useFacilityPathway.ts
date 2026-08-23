import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";

export type AvailabilityLevel = "available" | "limited" | "unavailable";

export interface FacilityPathwayOption {
  facilityId: string;
  facilityName: string;
  distanceKm: number;
  serviceAvailability: AvailabilityLevel;
  diagnosticAvailability: AvailabilityLevel;
  medicineAvailability: AvailabilityLevel;
}

/**
 * Backed by a seeded/static dataset on the backend (Build Guide Section
 * 6 explicitly scopes this to visibility, not live inventory management).
 * Falls back to a cached response via the PWA's NetworkFirst strategy
 * (vite.config.ts) if offline, so this still works mid-triage without
 * connectivity as long as it was fetched once before.
 */
export function useFacilityPathwayOptions(
  fromFacilityId: string
): FacilityPathwayOption[] {
  const [options, setOptions] = useState<FacilityPathwayOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get<FacilityPathwayOption[]>(`/facilities/${fromFacilityId}/pathway-options`)
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch(() => {
        // Silently degrade — worker can still create the referral without
        // pathway suggestions if this endpoint is unreachable and uncached.
        if (!cancelled) setOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [fromFacilityId]);

  return options;
}
