import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  TriageAssessmentSchema,
  TriageRiskLevel,
  type TriageRiskLevelT,
} from "@/models/careEpisode";
import { db, writeAndQueue } from "@/sync/db";
import { computeContinuityRisk } from "@/utils/continuityRiskEngine";

interface TriageFormProps {
  careEpisodeId: string;
  workerId: string;
  onSubmitted: (riskLevel: TriageRiskLevelT) => void;
}

/**
 * The critical property of this component: submit() never touches the
 * network. It writes to Dexie synchronously and enqueues a sync job.
 * The sync engine (sync/syncEngine.ts) picks it up whenever connectivity
 * exists. This is what makes Build Guide Section 14 Act 1 real rather
 * than staged.
 */
export function TriageForm({ careEpisodeId, workerId, onSubmitted }: TriageFormProps) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [notes, setNotes] = useState("");
  const [vitals, setVitals] = useState({
    systolicBP: "",
    diastolicBP: "",
    pulse: "",
    tempC: "",
    spo2: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addSymptom() {
    const trimmed = symptomInput.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
      setSymptomInput("");
    }
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

      // Rule-based Continuity Risk Engine — runs entirely client-side so
      // it works offline too (Build Guide Section 4, "start rule-based").
      const riskLevel = computeContinuityRisk({ symptoms, vitals: parsedVitals });

      const assessment = TriageAssessmentSchema.parse({
        id: uuidv4(),
        careEpisodeId,
        symptoms,
        vitals: parsedVitals,
        riskLevel,
        notes: notes || undefined,
        performedBy: workerId,
        performedAt: new Date().toISOString(),
        syncStatus: "pending",
      });

      await writeAndQueue(db.triageAssessments, "triage", assessment);

      onSubmitted(riskLevel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save triage record");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="triage-form">
      <fieldset>
        <legend>Symptoms</legend>
        <div className="symptom-input-row">
          <input
            type="text"
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSymptom();
              }
            }}
            placeholder="e.g. fever, breathlessness"
          />
          <button type="button" onClick={addSymptom}>
            Add
          </button>
        </div>
        <ul className="symptom-list">
          {symptoms.map((s) => (
            <li key={s}>
              {s}{" "}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => setSymptoms(symptoms.filter((x) => x !== s))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend>Vitals (optional)</legend>
        <label>
          Systolic BP
          <input
            type="number"
            value={vitals.systolicBP}
            onChange={(e) => setVitals({ ...vitals, systolicBP: e.target.value })}
          />
        </label>
        <label>
          Diastolic BP
          <input
            type="number"
            value={vitals.diastolicBP}
            onChange={(e) => setVitals({ ...vitals, diastolicBP: e.target.value })}
          />
        </label>
        <label>
          Pulse
          <input
            type="number"
            value={vitals.pulse}
            onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
          />
        </label>
        <label>
          Temp (°C)
          <input
            type="number"
            step="0.1"
            value={vitals.tempC}
            onChange={(e) => setVitals({ ...vitals, tempC: e.target.value })}
          />
        </label>
        <label>
          SpO2 (%)
          <input
            type="number"
            value={vitals.spo2}
            onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
          />
        </label>
      </fieldset>

      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </label>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting || symptoms.length === 0}>
        {submitting ? "Saving..." : "Save Triage Assessment"}
      </button>
    </form>
  );
}
