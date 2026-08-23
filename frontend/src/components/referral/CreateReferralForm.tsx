import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ReferralSchema, type Referral } from "@/models/careEpisode";
import { db, writeAndQueue } from "@/sync/db";
import { useFacilityPathwayOptions } from "@/hooks/useFacilityPathway";

interface CreateReferralFormProps {
  careEpisodeId: string;
  patientId: string;
  fromFacilityId: string;
  createdBy: string;
  onCreated: (referral: Referral) => void;
}

/**
 * Build Guide Section 6: "Care-Pathway Visibility". This is NOT a
 * financial/payment module — it's a lookup that surfaces distance,
 * service/diagnostic/medicine availability for nearby public facilities
 * so the worker routes the patient somewhere appropriate before
 * creating the referral. Thin feature, outsized narrative value.
 */
export function CreateReferralForm({
  careEpisodeId,
  patientId,
  fromFacilityId,
  createdBy,
  onCreated,
}: CreateReferralFormProps) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pathwayOptions = useFacilityPathwayOptions(fromFacilityId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFacilityId || !reason.trim()) return;
    setSubmitting(true);

    try {
      const referral = ReferralSchema.parse({
        id: uuidv4(),
        careEpisodeId,
        patientId,
        fromFacilityId,
        toFacilityId: selectedFacilityId,
        currentState: "DRAFT",
        reason,
        createdAt: new Date().toISOString(),
        createdBy,
        history: [],
        syncStatus: "pending",
      });

      await writeAndQueue(db.referrals, "referral", referral);
      onCreated(referral);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-referral-form">
      <fieldset>
        <legend>Recommended Facilities</legend>
        <p className="pathway-hint">
          Ranked by appropriateness for this case — distance, service match,
          and current availability, not just proximity.
        </p>
        <div className="pathway-options">
          {pathwayOptions.map((option) => (
            <label key={option.facilityId} className="pathway-option">
              <input
                type="radio"
                name="facility"
                value={option.facilityId}
                checked={selectedFacilityId === option.facilityId}
                onChange={() => setSelectedFacilityId(option.facilityId)}
              />
              <div className="pathway-option__details">
                <strong>{option.facilityName}</strong>
                <span>{option.distanceKm.toFixed(1)} km away</span>
                <span
                  className={`availability-badge availability-badge--${option.serviceAvailability}`}
                >
                  Service: {option.serviceAvailability}
                </span>
                <span
                  className={`availability-badge availability-badge--${option.diagnosticAvailability}`}
                >
                  Diagnostics: {option.diagnosticAvailability}
                </span>
                <span
                  className={`availability-badge availability-badge--${option.medicineAvailability}`}
                >
                  Medicine: {option.medicineAvailability}
                </span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        Reason for referral
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
        />
      </label>

      <button type="submit" disabled={submitting || !selectedFacilityId}>
        {submitting ? "Creating..." : "Create Referral"}
      </button>
    </form>
  );
}
