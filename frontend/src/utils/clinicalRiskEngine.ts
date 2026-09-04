import type { ClinicalRiskLevelT } from "@/models/careEpisode";

/**
 * CLINICAL risk only. "How urgent is this patient's condition right
 * now?" Never mix this file's logic with continuityRiskEngine.ts — see
 * MEDEXA_CANONICAL_PROJECT_CONTEXT.md Section 16's hard rule. This
 * engine has no knowledge of referrals, SLAs, or facility load; it only
 * sees symptoms and vitals, exactly like a real triage nurse would.
 */

interface ClinicalRiskInput {
  symptoms: string[];
  vitals: {
    systolicBP?: number;
    diastolicBP?: number;
    pulse?: number;
    tempC?: number;
    spo2?: number;
  };
}

const EMERGENCY_SYMPTOMS = [
  "chest pain",
  "severe bleeding",
  "unconscious",
  "difficulty breathing",
  "seizure",
];

const HIGH_RISK_SYMPTOMS = ["breathlessness", "high fever", "severe pain", "vomiting blood"];

export function computeClinicalRisk(input: ClinicalRiskInput): ClinicalRiskLevelT {
  const symptomsLower = input.symptoms.map((s) => s.toLowerCase());

  if (symptomsLower.some((s) => EMERGENCY_SYMPTOMS.some((e) => s.includes(e)))) {
    return "emergency";
  }

  let score = 0;

  if (symptomsLower.some((s) => HIGH_RISK_SYMPTOMS.some((h) => s.includes(h)))) {
    score += 3;
  }
  if (input.vitals.spo2 !== undefined && input.vitals.spo2 < 92) score += 3;
  if (input.vitals.systolicBP !== undefined && input.vitals.systolicBP > 160) score += 2;
  if (input.vitals.tempC !== undefined && input.vitals.tempC > 39) score += 2;
  if (input.vitals.pulse !== undefined && (input.vitals.pulse > 120 || input.vitals.pulse < 50)) {
    score += 2;
  }

  if (score >= 6) return "high";
  if (score >= 3) return "moderate";
  return "low";
}
