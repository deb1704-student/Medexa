import { useEffect, useState } from "react";
import { ReferralContinuitySummary } from "@/components/dashboard/ReferralContinuitySummary";
import { FacilityContinuityTable } from "@/components/dashboard/FacilityContinuityTable";
import { apiClient } from "@/api/client";

interface DashboardData {
  totalReferrals: number;
  accepted: number;
  completed: number;
  followUpCompleted: number;
  overdue: number;
  noShow: number;
  totalEligibleForCompletion: number;
  followUpsDue: number;
  dataFreshnessMinutesAgo: number;
  facilities: {
    facilityId: string;
    facilityName: string;
    totalReferrals: number;
    completionRatePercent: number;
    avgReferralDelayHours: number;
    followUpCompliancePercent: number;
  }[];
}

/**
 * This is the "quality and accountability arm" (Build Guide Section 0 /
 * Section 5) — governance-facing, decision-oriented, not a reporting
 * page. dataFreshnessMinutesAgo surfaces sync lag explicitly so a
 * district officer never mistakes stale field data for current reality.
 */
export function DistrictDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<DashboardData>("/dashboard/facility")
      .then(setData)
      .catch((err) => setError(String(err)));
  }, []);

  if (error) return <p role="alert">Failed to load dashboard: {error}</p>;
  if (!data) return <p>Loading dashboard…</p>;

  return (
    <div className="district-dashboard-page">
      <header>
        <h1>District Care Continuity Dashboard</h1>
        <p className="data-freshness">
          Data as of {data.dataFreshnessMinutesAgo} minute
          {data.dataFreshnessMinutesAgo === 1 ? "" : "s"} ago
        </p>
      </header>

      <ReferralContinuitySummary
        totalReferrals={data.totalReferrals}
        accepted={data.accepted}
        completed={data.completed}
        followUpCompleted={data.followUpCompleted}
        overdue={data.overdue}
        noShow={data.noShow}
        totalEligibleForCompletion={data.totalEligibleForCompletion}
        followUpsDue={data.followUpsDue}
      />

      <FacilityContinuityTable facilities={data.facilities} />
    </div>
  );
}
