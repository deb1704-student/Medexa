import React, { useState } from "react";
import { apiClient } from "../../api/client";

interface BackReferralModalProps {
  referralId: string;
  patientName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BackReferralModal: React.FC<BackReferralModalProps> = ({
  referralId,
  patientName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [outcome, setOutcome] = useState("DISCHARGED_STABLE");
  const [treatment, setTreatment] = useState("");
  const [medicationInput, setMedicationInput] = useState("");
  const [warningSignsInput, setWarningSignsInput] = useState("");
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      id: `br-${crypto.randomUUID().slice(0, 8)}`,
      referral_id: referralId,
      outcome,
      treatment: treatment.trim() || "Completed prescribed clinical protocol",
      medication: medicationInput
        .split(/[\n,]+/)
        .map((m) => m.trim())
        .filter(Boolean),
      warning_signs: warningSignsInput
        .split(/[\n,]+/)
        .map((w) => w.trim())
        .filter(Boolean),
      follow_up_date: followUpDate instanceof Date ? followUpDate.toISOString() : new Date(followUpDate).toISOString(),
      instructions: instructions.trim() || null,
      recorded_by: "Dr. Medical Officer",
      recorded_at: new Date().toISOString(),
    };

    try {
      await apiClient.post("/referrals/back-referral", payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit counter-referral.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="back-referral-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-outline-variant p-6 shadow-2xl my-8">
        <div className="flex items-start justify-between border-b border-outline-variant/60 pb-4">
          <div>
            <h2 id="back-referral-title" className="text-lg font-bold text-on-surface">
              Counter-Referral / Back-Referral
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {patientName ? `Patient: ${patientName} • ` : ""}Referral ID: <span className="font-mono">{referralId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800">
            <span className="material-symbols-outlined text-base text-red-600">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-on-surface mb-1">
              Clinical Outcome / Discharge Status <span className="text-red-500">*</span>
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs font-medium text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="DISCHARGED_STABLE">Discharged Stable (Routine Frontline Follow-up)</option>
              <option value="IMPROVED">Improved (Maintenance Care at Sub-Centre)</option>
              <option value="MONITORING_REQUIRED">Active Frontline Monitoring Required</option>
              <option value="REFERRED_HIGHER">Referred to Higher Specialized Facility</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">
              Treatment Summary / Procedures Completed
            </label>
            <textarea
              rows={2}
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="e.g. IV fluids administered, emergency ECG evaluated normal, stabilized on oral antibiotics"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/70 leading-relaxed resize-none"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">
              Prescribed Medications (comma or line separated)
            </label>
            <input
              type="text"
              value={medicationInput}
              onChange={(e) => setMedicationInput(e.target.value)}
              placeholder="e.g. Tab Paracetamol 500mg TDS, Cap Amoxicillin 500mg BD"
              className="w-full h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/70"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">
              Warning Signs / Red Flags for Frontline ASHA
            </label>
            <input
              type="text"
              value={warningSignsInput}
              onChange={(e) => setWarningSignsInput(e.target.value)}
              placeholder="e.g. SpO2 < 92%, Systolic BP > 160, High fever > 39°C"
              className="w-full h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/70"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">
              Follow-up Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={followUpDate instanceof Date ? followUpDate.toISOString().split("T")[0] : String(followUpDate).split("T")[0]}
              onChange={(e) => setFollowUpDate(new Date(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">
              ASHA Frontline Follow-up Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions for frontline worker (e.g. check SpO2 daily, ensure complete antibiotic course)"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/70 leading-relaxed resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-container transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              <span>{loading ? "Submitting..." : "Submit Counter-Referral"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
