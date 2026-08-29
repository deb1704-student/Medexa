import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCareEpisode } from "@/hooks/useCareEpisode";
import { TriageForm } from "@/components/triage/TriageForm";
import { CreateReferralForm } from "@/components/referral/CreateReferralForm";
import { ReferralTracker } from "@/components/referral/ReferralTracker";
import { SyncIndicator } from "@/components/common/SyncIndicator";
import type { ClinicalRiskLevelT, Referral } from "@/models/careEpisode";

const CURRENT_WORKER_ID = "worker-demo-001"; // replaced by real auth context once Stage B auth lands

/**
 * Frontline worker flow — this page IS Acts 1-3 of the canonical demo
 * (MEDEXA_CANONICAL_PROJECT_CONTEXT.md Section 30). Header matches the
 * Stitch "Digital Triage Form" top bar exactly.
 */
export function PatientEpisodePage() {
  const { careEpisodeId } = useParams<{ careEpisodeId: string }>();
  const episode = useCareEpisode(careEpisodeId);
  const [latestClinicalRisk, setLatestClinicalRisk] = useState<ClinicalRiskLevelT | null>(null);
  const [activeReferral, setActiveReferral] = useState<Referral | null>(episode?.referral ?? null);

  if (!episode) {
    return (
      <div className="max-w-2xl mx-auto p-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Loading patient episode from local store…
        </p>
      </div>
    );
  }

  const showReferralPrompt =
    (latestClinicalRisk === "high" || latestClinicalRisk === "emergency") && !activeReferral;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-container-mobile md:px-container-margin-desktop h-[56px]">
        <h1 className="font-headline-md-mobile text-headline-md-mobile md:font-headline-md md:text-headline-md font-bold text-primary">
          Medexa
        </h1>
        <div className="flex items-center gap-md">
          <SyncIndicator />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-container-mobile md:px-lg py-lg space-y-xl">
        <TriageForm
          careEpisodeId={episode.id}
          workerId={CURRENT_WORKER_ID}
          onSubmitted={(riskLevel) => setLatestClinicalRisk(riskLevel)}
        />

        {showReferralPrompt && (
          <section>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">
              Create Referral
            </h2>
            <CreateReferralForm
              careEpisodeId={episode.id}
              patientId={episode.patientId}
              fromFacilityId="facility-subcentre-demo"
              createdBy={CURRENT_WORKER_ID}
              onCreated={(referral) => setActiveReferral(referral)}
            />
          </section>
        )}

        {activeReferral && <ReferralTracker referral={activeReferral} changedBy={CURRENT_WORKER_ID} />}
      </main>
    </div>
  );
}
