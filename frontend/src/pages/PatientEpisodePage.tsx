import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCareEpisode } from "@/hooks/useCareEpisode";
import { TriageForm } from "@/components/triage/TriageForm";
import { CreateReferralForm } from "@/components/referral/CreateReferralForm";
import { ReferralTracker } from "@/components/referral/ReferralTracker";
import { SyncIndicator } from "@/components/common/SyncIndicator";
import type { TriageRiskLevelT, Referral } from "@/models/careEpisode";

const CURRENT_WORKER_ID = "worker-demo-001"; // replaced by real auth context once Stage B auth lands

/**
 * This page IS Act 1-3 of the demo (Build Guide Section 14). It should
 * be usable start-to-finish with the network tab showing zero requests.
 */
export function PatientEpisodePage() {
  const { careEpisodeId } = useParams<{ careEpisodeId: string }>();
  const episode = useCareEpisode(careEpisodeId);
  const [latestRiskLevel, setLatestRiskLevel] = useState<TriageRiskLevelT | null>(null);
  const [activeReferral, setActiveReferral] = useState<Referral | null>(
    episode?.referral ?? null
  );

  if (!episode) {
    return <p>Loading patient episode from local store…</p>;
  }

  return (
    <div className="patient-episode-page">
      <header className="patient-episode-page__header">
        <h1>Care Episode</h1>
        <SyncIndicator />
      </header>

      <section>
        <h2>Digital Triage</h2>
        <TriageForm
          careEpisodeId={episode.id}
          workerId={CURRENT_WORKER_ID}
          onSubmitted={(riskLevel) => setLatestRiskLevel(riskLevel)}
        />
        {latestRiskLevel && (
          <p className={`risk-banner risk-banner--${latestRiskLevel}`}>
            Assessed risk: <strong>{latestRiskLevel}</strong>
            {(latestRiskLevel === "high" || latestRiskLevel === "emergency") &&
              " — referral recommended"}
          </p>
        )}
      </section>

      {(latestRiskLevel === "high" || latestRiskLevel === "emergency") && !activeReferral && (
        <section>
          <h2>Create Referral</h2>
          <CreateReferralForm
            careEpisodeId={episode.id}
            patientId={episode.patientId}
            fromFacilityId="facility-subcentre-demo" // seeded facility id for the pilot region
            createdBy={CURRENT_WORKER_ID}
            onCreated={(referral) => setActiveReferral(referral)}
          />
        </section>
      )}

      {activeReferral && (
        <section>
          <h2>Referral Status</h2>
          <ReferralTracker referral={activeReferral} changedBy={CURRENT_WORKER_ID} />
        </section>
      )}
    </div>
  );
}
