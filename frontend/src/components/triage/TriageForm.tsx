import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { TriageAssessmentSchema, type ClinicalRiskLevelT } from "@/models/careEpisode";
import { db, writeAndQueue } from "@/sync/db";
import { computeClinicalRisk } from "@/utils/clinicalRiskEngine";

interface TriageFormProps {
  careEpisodeId: string;
  workerId: string;
  onSubmitted: (riskLevel: ClinicalRiskLevelT) => void;
}

const QUICK_SELECT_SYMPTOMS = ["Fever", "Cough", "Breathlessness", "Vomiting", "Chest Pain"];

interface VitalFieldConfig {
  key: "systolicBP" | "diastolicBP" | "pulse" | "tempC" | "spo2";
  label: string;
  step?: number;
}

const VITAL_FIELDS: VitalFieldConfig[] = [
  { key: "systolicBP", label: "Systolic BP" },
  { key: "diastolicBP", label: "Diastolic BP" },
  { key: "pulse", label: "Pulse" },
  { key: "tempC", label: "Temp (°C)", step: 0.1 },
  { key: "spo2", label: "SpO2%" },
];

/**
 * Matches the Stitch "Digital Triage Form" screen 1:1 — stepper-style
 * vital inputs (large touch targets for gloved/dirty hands), tag-chip
 * symptom entry with one-tap quick-select, collapsible notes section,
 * and the HIGH RISK confirmation banner shown immediately on save.
 *
 * submit() never touches the network — see sync/db.ts's writeAndQueue.
 * This is what makes the offline demo (canonical context Act 1) real.
 */
export function TriageForm({ careEpisodeId, workerId, onSubmitted }: TriageFormProps) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [vitals, setVitals] = useState<Record<VitalFieldConfig["key"], string>>({
    systolicBP: "",
    diastolicBP: "",
    pulse: "",
    tempC: "",
    spo2: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedRiskLevel, setSavedRiskLevel] = useState<ClinicalRiskLevelT | null>(null);

  function addSymptom(value: string) {
    const trimmed = value.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
      setSymptomInput("");
    }
  }

  function step(key: VitalFieldConfig["key"], delta: number) {
    setVitals((prev) => {
      const current = parseFloat(prev[key]) || 0;
      const config = VITAL_FIELDS.find((f) => f.key === key);
      const increment = config?.step ?? 1;
      const next = current + delta * increment;
      return { ...prev, [key]: (config?.step ? next.toFixed(1) : Math.round(next)).toString() };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const parsedVitals = {
        systolicBP: vitals.systolicBP ? Number(vitals.systolicBP) : undefined,
        diastolicBP: vitals.diastolicBP ? Number(vitals.diastolicBP) : undefined,
        pulse: vitals.pulse ? Number(vitals.pulse) : undefined,
        tempC: vitals.tempC ? Number(vitals.tempC) : undefined,
        spo2: vitals.spo2 ? Number(vitals.spo2) : undefined,
      };

      const clinicalRiskLevel = computeClinicalRisk({ symptoms, vitals: parsedVitals });

      const assessment = TriageAssessmentSchema.parse({
        id: uuidv4(),
        careEpisodeId,
        symptoms,
        vitals: parsedVitals,
        clinicalRiskLevel,
        notes: notes || undefined,
        performedBy: workerId,
        performedAt: new Date().toISOString(),
        syncStatus: "pending",
      });

      await writeAndQueue(db.triageAssessments, "triage", assessment);

      setSavedRiskLevel(clinicalRiskLevel);
      onSubmitted(clinicalRiskLevel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save triage record");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-lg">
      <div>
        <h2 className="font-headline-md-mobile text-headline-md-mobile md:font-headline-md md:text-headline-md text-primary mb-xs">
          Digital Triage Form
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Record symptoms and vitals for initial assessment.
        </p>
      </div>

      {(savedRiskLevel === "high" || savedRiskLevel === "emergency") && (
        <div className="bg-error-container border border-error rounded p-md flex gap-md items-start shadow-md">
          <div className="bg-error text-on-error w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined filled">warning</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-error-container font-bold mb-xs">
              {savedRiskLevel.toUpperCase()} CLINICAL RISK
            </h3>
            <p className="font-body-md text-body-md text-on-error-container opacity-90">
              Based on symptoms and vitals — referral recommended.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-lg">
        {/* Symptom Entry */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded p-md shadow-sm">
          <h3 className="font-label-lg text-label-lg text-primary mb-sm">Symptom Entry</h3>

          <div className="relative mb-md">
            <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">
              search
            </span>
            <input
              className="w-full h-tap-target-min pl-xl pr-md rounded border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface font-body-md text-body-md placeholder:text-on-surface-variant"
              placeholder="Search symptoms..."
              type="text"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSymptom(symptomInput);
                }
              }}
            />
          </div>

          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-sm mb-md">
              {symptoms.map((s) => (
                <div
                  key={s}
                  className="inline-flex items-center gap-xs bg-primary-container text-on-primary-container px-sm py-[6px] rounded-full border border-primary/20"
                >
                  <span className="font-label-sm text-label-sm">{s}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${s}`}
                    className="flex items-center justify-center rounded-full hover:bg-black/10 p-[2px]"
                    onClick={() => setSymptoms(symptoms.filter((x) => x !== s))}
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs block">
              Quick Select:
            </span>
            <div className="flex flex-wrap gap-sm">
              {QUICK_SELECT_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSymptom(s)}
                  className="inline-flex items-center bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high px-sm py-[6px] rounded-full transition-colors font-label-sm text-label-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Vitals */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded p-md shadow-sm">
          <h3 className="font-label-lg text-label-lg text-primary mb-md">
            Vitals <span className="text-on-surface-variant font-normal">(Optional)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {VITAL_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                  {field.label}
                </label>
                <div className="flex items-center bg-surface border border-outline-variant rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => step(field.key, -1)}
                    className="w-tap-target-min h-tap-target-min flex items-center justify-center hover:bg-surface-container-high border-r border-outline-variant"
                    aria-label={`Decrease ${field.label}`}
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <input
                    className="flex-1 h-tap-target-min text-center border-none focus:ring-0 font-body-md text-body-md bg-transparent"
                    type="number"
                    step={field.step ?? 1}
                    value={vitals[field.key]}
                    onChange={(e) => setVitals({ ...vitals, [field.key]: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => step(field.key, 1)}
                    className="w-tap-target-min h-tap-target-min flex items-center justify-center hover:bg-surface-container-high border-l border-outline-variant"
                    aria-label={`Increase ${field.label}`}
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setNotesOpen((o) => !o)}
            className="flex items-center justify-between w-full p-md hover:bg-surface-container-low transition-colors"
          >
            <span className="font-label-lg text-label-lg text-primary">Notes</span>
            <span
              className={`material-symbols-outlined text-on-surface-variant transition-transform ${notesOpen ? "rotate-180" : ""}`}
            >
              expand_more
            </span>
          </button>
          {notesOpen && (
            <div className="p-md pt-0 border-t border-outline-variant">
              <textarea
                className="w-full mt-sm rounded border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface font-body-md text-body-md placeholder:text-on-surface-variant p-sm"
                placeholder="Add any additional observations..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </section>

        {error && (
          <p role="alert" className="text-error font-body-md text-body-md">
            {error}
          </p>
        )}

        <div className="fixed bottom-0 left-0 w-full p-md bg-surface border-t border-outline-variant shadow-lg z-40 md:static md:bg-transparent md:border-none md:shadow-none md:p-0">
          <button
            type="submit"
            disabled={submitting || symptoms.length === 0}
           className="w-full h-tap-target-min bg-primary text-on-primary rounded-full font-label-lg text-label-lg hover:bg-surface-tint active:scale-[0.98] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-sm"
  >
            <span className="material-symbols-outlined">save</span>
            {submitting ? "Saving..." : "Save Triage Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}
