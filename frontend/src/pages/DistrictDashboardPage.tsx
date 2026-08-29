import { useEffect, useState } from "react";
import { ContinuityOverview } from "@/components/dashboard/ContinuityOverview";
import { FacilityContinuityTable } from "@/components/dashboard/FacilityContinuityTable";
import { SyncIndicator } from "@/components/common/SyncIndicator";
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

const NAV_ITEMS = [
  { label: "Overview", icon: "dashboard" },
  { label: "Referrals", icon: "sync_alt" },
  { label: "Facilities", icon: "local_hospital" },
  { label: "Reports", icon: "analytics" },
];

/**
 * District officer flow — Acts 4-6 of the canonical demo. Sidebar
 * layout matches the Stitch "Continuity Overview" / "Facility
 * Continuity" desktop screens exactly (fixed 256px side nav, main
 * content offset by ml-64).
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

  return (
    <div className="min-h-screen bg-surface flex">
      <nav className="hidden md:flex flex-col h-screen w-64 left-0 top-0 fixed border-r border-outline-variant bg-surface-container-low py-xl">
        <div className="px-lg mb-8">
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Medexa</h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant">District Dashboard</p>
        </div>
        <div className="flex-1 px-4 space-y-2">
          {NAV_ITEMS.map((item, i) => (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-md px-lg py-sm rounded-full transition-all duration-200 ${
                i === 0
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-lg text-label-lg">{item.label}</span>
            </a>
          ))}
        </div>
        <div className="px-4 mt-auto">
          <SyncIndicator />
        </div>
      </nav>

      <main className="flex-1 md:ml-64 p-gutter md:p-container-margin-desktop">
        <header className="mb-8 flex flex-wrap justify-between items-end gap-md">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface mb-2">
              Continuity Overview
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              District-wide referral performance metrics.
            </p>
          </div>
          {data && (
            <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary filled">sync</span>
              Data as of {data.dataFreshnessMinutesAgo} minute
              {data.dataFreshnessMinutesAgo === 1 ? "" : "s"} ago
            </p>
          )}
        </header>

        {error && (
          <p role="alert" className="text-error font-body-md text-body-md mb-lg">
            Failed to load dashboard: {error}
          </p>
        )}

        {!data && !error && (
          <p className="font-body-md text-body-md text-on-surface-variant">Loading dashboard…</p>
        )}

        {data && (
          <div className="space-y-xl">
            <ContinuityOverview
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
        )}
      </main>
    </div>
  );
}
