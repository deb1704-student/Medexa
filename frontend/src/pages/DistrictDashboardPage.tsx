import { useEffect, useState } from "react";

import { ContinuityOverview } from "@/components/dashboard/ContinuityOverview";
import { FacilityContinuityTable } from "@/components/dashboard/FacilityContinuityTable";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";

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

export function DistrictDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    /*
     * Temporary demo data.
     *
     * Later, the backend developer can replace this
     * with an API request without changing the UI structure.
     */

    const mockData: DashboardData = {
      totalReferrals: 150,
      accepted: 120,
      completed: 90,
      followUpCompleted: 75,
      overdue: 15,
      noShow: 8,
      totalEligibleForCompletion: 100,
      followUpsDue: 100,
      dataFreshnessMinutesAgo: 2,

      facilities: [
        {
          facilityId: "F001",
          facilityName: "City Hospital",
          totalReferrals: 50,
          completionRatePercent: 90,
          avgReferralDelayHours: 4,
          followUpCompliancePercent: 85,
        },

        {
          facilityId: "F002",
          facilityName: "Rural Health Center",
          totalReferrals: 35,
          completionRatePercent: 75,
          avgReferralDelayHours: 7,
          followUpCompliancePercent: 70,
        },

        {
          facilityId: "F003",
          facilityName: "Community Clinic",
          totalReferrals: 25,
          completionRatePercent: 68,
          avgReferralDelayHours: 9,
          followUpCompliancePercent: 65,
        },
      ],
    };

    setData(mockData);
  }, []);

  return (
    <div className="min-h-screen bg-surface">

      {/* Shared Dashboard Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="min-h-screen md:ml-64">

        <div className="p-6 md:p-10 lg:p-12">

          {/* Header */}
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">

            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                District Operations
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
                Continuity Overview
              </h1>

              <p className="mt-3 text-lg text-on-surface-variant">
                District-wide referral performance and care continuity.
              </p>
            </div>

            {data && (
              <div className="flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm text-on-surface-variant">

                <span className="material-symbols-outlined text-[18px] text-primary">
                  sync
                </span>

                Data as of {data.dataFreshnessMinutesAgo} minute
                {data.dataFreshnessMinutesAgo === 1 ? "" : "s"} ago

              </div>
            )}

          </header>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Loading */}
          {!data && !error && (
            <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-10 text-center">

              <span className="material-symbols-outlined mb-3 text-4xl text-primary">
                progress_activity
              </span>

              <p className="font-semibold text-on-surface">
                Loading dashboard...
              </p>

              <p className="mt-1 text-sm text-on-surface-variant">
                Preparing district continuity metrics.
              </p>

            </div>
          )}

          {/* Dashboard Content */}
          {data && (
            <div className="space-y-8">

              <ContinuityOverview
                totalReferrals={data.totalReferrals}
                accepted={data.accepted}
                completed={data.completed}
                followUpCompleted={data.followUpCompleted}
                overdue={data.overdue}
                noShow={data.noShow}
                totalEligibleForCompletion={
                  data.totalEligibleForCompletion
                }
                followUpsDue={data.followUpsDue}
              />

              <FacilityContinuityTable
                facilities={data.facilities}
              />

            </div>
          )}

        </div>

      </main>

    </div>
  );
}