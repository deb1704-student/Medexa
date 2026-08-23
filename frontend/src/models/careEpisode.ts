import { z } from "zod";

/**
 * Care Episode is the ROOT domain entity (see Build Guide Section 2).
 * Every other clinical record hangs off a careEpisodeId. This file is the
 * single source of truth for shape: Zod gives us runtime validation on
 * every offline-created record AND the TypeScript types below are
 * inferred from these schemas, so the two can never drift apart.
 */

export const PatientSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1, "Name is required"),
  age: z.number().int().min(0).max(120),
  sex: z.enum(["male", "female", "other"]),
  villageOrWard: z.string().min(1),
  phone: z.string().optional(),
  chronicConditions: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
});
export type Patient = z.infer<typeof PatientSchema>;

export const TriageRiskLevel = z.enum(["low", "moderate", "high", "emergency"]);
export type TriageRiskLevelT = z.infer<typeof TriageRiskLevel>;

export const TriageAssessmentSchema = z.object({
  id: z.string().uuid(),
  careEpisodeId: z.string().uuid(),
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  vitals: z
    .object({
      systolicBP: z.number().optional(),
      diastolicBP: z.number().optional(),
      pulse: z.number().optional(),
      tempC: z.number().optional(),
      spo2: z.number().min(0).max(100).optional(),
    })
    .optional(),
  riskLevel: TriageRiskLevel,
  notes: z.string().optional(),
  performedBy: z.string(), // worker id
  performedAt: z.string().datetime(),
  // present when the record was created offline and hasn't synced yet
  syncStatus: z.enum(["synced", "pending", "conflict"]).default("pending"),
});
export type TriageAssessment = z.infer<typeof TriageAssessmentSchema>;

/**
 * Referral state machine (Build Guide Section 3).
 * CORE states are what Phase 4 builds and demos first — the happy path
 * that MUST work offline+sync before anything else is added.
 * FULL states are added in Phase 5. EXCEPTIONAL states can occur from
 * most non-terminal states and are handled by the transition table in
 * sync/referralStateMachine.ts, not scattered through the UI.
 */
export const ReferralCoreState = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "CONSULTED",
  "FOLLOW_UP_DUE",
  "FOLLOW_UP_COMPLETED",
  "CLOSED",
]);

export const ReferralFullState = z.enum([
  "DRAFT",
  "SENT",
  "RECEIVED",
  "ACCEPTED",
  "APPOINTMENT_QUEUED",
  "CONSULTED",
  "REFERRED_BACK",
  "FOLLOW_UP_DUE",
  "FOLLOW_UP_COMPLETED",
  "CLOSED",
]);

export const ReferralExceptionalState = z.enum([
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "PATIENT_NO_SHOW",
  "EMERGENCY_ESCALATED",
]);

export const ReferralState = z.union([
  ReferralFullState,
  ReferralExceptionalState,
]);
export type ReferralStateT = z.infer<typeof ReferralState>;

export const ReferralStateTransitionSchema = z.object({
  id: z.string().uuid(),
  referralId: z.string().uuid(),
  fromState: ReferralState.nullable(), // null = initial creation
  toState: ReferralState,
  changedBy: z.string(),
  changedAt: z.string().datetime(),
  deviceLocalTimestamp: z.string().datetime().optional(), // for offline sync-conflict analysis
  note: z.string().optional(),
});
export type ReferralStateTransition = z.infer<
  typeof ReferralStateTransitionSchema
>;

export const ReferralSchema = z.object({
  id: z.string().uuid(),
  careEpisodeId: z.string().uuid(),
  patientId: z.string().uuid(),
  fromFacilityId: z.string(),
  toFacilityId: z.string(),
  currentState: ReferralState,
  reason: z.string().min(1),
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  // computed client-side from state history for the "referral delay" metric
  history: z.array(ReferralStateTransitionSchema).default([]),
  syncStatus: z.enum(["synced", "pending", "conflict"]).default("pending"),
});
export type Referral = z.infer<typeof ReferralSchema>;

export const ContinuityRiskFactorSchema = z.object({
  factor: z.string(),
  weight: z.number(),
});

export const ContinuityRiskScoreSchema = z.object({
  careEpisodeId: z.string().uuid(),
  score: z.number(),
  level: z.enum(["low", "medium", "high"]),
  contributingFactors: z.array(ContinuityRiskFactorSchema),
  computedAt: z.string().datetime(),
});
export type ContinuityRiskScore = z.infer<typeof ContinuityRiskScoreSchema>;

export const CareEpisodeSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  status: z.enum(["open", "closed"]),
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().optional(),
  triage: TriageAssessmentSchema.optional(),
  referral: ReferralSchema.optional(),
  riskScore: ContinuityRiskScoreSchema.optional(),
  syncStatus: z.enum(["synced", "pending", "conflict"]).default("pending"),
});
export type CareEpisode = z.infer<typeof CareEpisodeSchema>;
