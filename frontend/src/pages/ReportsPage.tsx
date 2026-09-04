import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";

type ReportStatus = "Completed" | "Pending" | "In Progress" | "Overdue";

type MonthlyData = {
  month: string;
  referrals: number;
};

type FacilityReport = {
  name: string;
  referrals: number;
  completed: number;
  pending: number;
};

type RecentReferral = {
  id: string;
  patient: string;
  facility: string;
  status: ReportStatus;
  date: string;
};

const monthlyData: MonthlyData[] = [
  { month: "Apr", referrals: 42 },
  { month: "May", referrals: 58 },
  { month: "Jun", referrals: 71 },
  { month: "Jul", referrals: 64 },
  { month: "Aug", referrals: 83 },
  { month: "Sep", referrals: 76 },
];

const facilityReports: FacilityReport[] = [
  {
    name: "District Hospital",
    referrals: 56,
    completed: 42,
    pending: 8,
  },
  {
    name: "CHC Bishnupur",
    referrals: 31,
    completed: 19,
    pending: 7,
  },
  {
    name: "CHC Kharagpur",
    referrals: 27,
    completed: 18,
    pending: 5,
  },
  {
    name: "PHC Sonapur",
    referrals: 24,
    completed: 17,
    pending: 4,
  },
  {
    name: "PHC Rampur",
    referrals: 18,
    completed: 13,
    pending: 3,
  },
];

const recentReferrals: RecentReferral[] = [
  {
    id: "REF-2026-001",
    patient: "Anita Sharma",
    facility: "District Hospital",
    status: "Completed",
    date: "03 Sep 2026",
  },
  {
    id: "REF-2026-002",
    patient: "Ramesh Kumar",
    facility: "CHC Bishnupur",
    status: "In Progress",
    date: "03 Sep 2026",
  },
  {
    id: "REF-2026-003",
    patient: "Sunita Das",
    facility: "District Hospital",
    status: "Pending",
    date: "02 Sep 2026",
  },
  {
    id: "REF-2026-004",
    patient: "Arjun Singh",
    facility: "CHC Kharagpur",
    status: "Completed",
    date: "02 Sep 2026",
  },
  {
    id: "REF-2026-005",
    patient: "Priya Roy",
    facility: "PHC Sonapur",
    status: "Overdue",
    date: "01 Sep 2026",
  },
];

function StatusBadge({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, string> = {
    Completed: "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100 text-amber-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Overdue: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium text-on-surface-variant">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-on-surface">
        {value}
      </p>

      <p className="mt-1 text-xs text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}

export function ReportsPage() {
  const totalReferrals = 338;
  const completedReferrals = 244;
  const pendingReferrals = 48;
  const overdueReferrals = 17;

  const completionRate = Math.round(
    (completedReferrals / totalReferrals) * 100,
  );

  const maxMonthlyReferrals = Math.max(
    ...monthlyData.map((item) => item.referrals),
  );

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        {/* Main */}
        <main className="min-w-0 flex-1 md:ml-64">
          {/* Header */}
          <header className="border-b border-outline-variant bg-surface">
            <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
                  <Link
                    to="/dashboard"
                    className="hover:text-primary"
                  >
                    Dashboard
                  </Link>

                  <span>/</span>

                  <span>Reports</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight">
                  Reports & Analytics
                </h1>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Monitor referral performance and healthcare continuity
                  across the district.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  defaultValue="Last 6 Months"
                  className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option>Last 30 Days</option>
                  <option>Last 3 Months</option>
                  <option>Last 6 Months</option>
                  <option>This Year</option>
                </select>

                <button
                  type="button"
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90"
                >
                  Export Report
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
            {/* Summary cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Referrals"
                value={String(totalReferrals)}
                description="Across all facilities"
              />

              <StatCard
                title="Completed"
                value={String(completedReferrals)}
                description="Successfully completed"
              />

              <StatCard
                title="Pending"
                value={String(pendingReferrals)}
                description="Awaiting action"
              />

              <StatCard
                title="Overdue"
                value={String(overdueReferrals)}
                description="Require attention"
              />
            </section>

            {/* Completion rate + status */}
            <section className="grid gap-6 lg:grid-cols-3">
              {/* Completion rate */}
              <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-bold">
                  Referral Completion
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Overall referral completion rate.
                </p>

                <div className="mt-8 flex items-center justify-center">
                  <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[18px] border-gray-200">
                    <div
                      className="absolute inset-[-18px] rounded-full border-[18px] border-primary"
                      style={{
                        clipPath: `polygon(0 0, 100% 0, 100% ${completionRate}%, 0 ${completionRate}%)`,
                      }}
                    />

                    <div className="text-center">
                      <p className="text-4xl font-bold">
                        {completionRate}%
                      </p>

                      <p className="mt-1 text-xs text-on-surface-variant">
                        Completion rate
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex justify-between text-sm">
                  <span className="text-on-surface-variant">
                    Completed
                  </span>

                  <span className="font-semibold">
                    {completedReferrals} referrals
                  </span>
                </div>
              </div>

              {/* Status distribution */}
              <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-bold">
                  Referral Status
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Current distribution of referrals.
                </p>

                <div className="mt-8 space-y-6">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Completed</span>
                      <span className="font-semibold">244</span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: "72%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Pending</span>
                      <span className="font-semibold">48</span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: "14%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>In Progress</span>
                      <span className="font-semibold">29</span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: "9%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Overdue</span>
                      <span className="font-semibold">17</span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: "5%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Monthly activity */}
            <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-bold">
                    Monthly Referral Activity
                  </h2>

                  <p className="mt-1 text-sm text-on-surface-variant">
                    Number of referrals created each month.
                  </p>
                </div>

                <span className="text-sm font-semibold text-primary">
                  6 month overview
                </span>
              </div>

              <div className="mt-8 flex h-64 items-end justify-between gap-3">
                {monthlyData.map((item) => {
                  const height =
                    (item.referrals / maxMonthlyReferrals) * 100;

                  return (
                    <div
                      key={item.month}
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <span className="mb-2 text-xs font-semibold">
                        {item.referrals}
                      </span>

                      <div
                        className="w-full max-w-16 rounded-t-xl bg-primary"
                        style={{ height: `${height}%` }}
                      />

                      <span className="mt-3 text-xs text-on-surface-variant">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Facility performance */}
            <section className="rounded-2xl border border-outline-variant bg-surface shadow-sm">
              <div className="border-b border-outline-variant p-6">
                <h2 className="text-lg font-bold">
                  Facility Referral Performance
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Referral activity and completion across facilities.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Facility
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Referrals
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Completed
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Pending
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Completion
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {facilityReports.map((facility) => {
                      const rate = Math.round(
                        (facility.completed / facility.referrals) * 100,
                      );

                      return (
                        <tr
                          key={facility.name}
                          className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container/50"
                        >
                          <td className="px-6 py-5 font-semibold">
                            {facility.name}
                          </td>

                          <td className="px-6 py-5 text-sm">
                            {facility.referrals}
                          </td>

                          <td className="px-6 py-5 text-sm">
                            {facility.completed}
                          </td>

                          <td className="px-6 py-5 text-sm">
                            {facility.pending}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${rate}%` }}
                                />
                              </div>

                              <span className="text-sm font-semibold">
                                {rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Priority breakdown */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-bold">
                  Referral Priority
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Distribution by clinical priority.
                </p>

                <div className="mt-7 space-y-5">
                  <div className="flex items-center justify-between rounded-xl bg-surface-container p-4">
                    <div>
                      <p className="font-semibold">Routine</p>
                      <p className="text-xs text-on-surface-variant">
                        Standard referrals
                      </p>
                    </div>

                    <span className="text-xl font-bold">182</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
                    <div>
                      <p className="font-semibold text-amber-800">
                        Urgent
                      </p>
                      <p className="text-xs text-amber-700">
                        Requires faster attention
                      </p>
                    </div>

                    <span className="text-xl font-bold text-amber-800">
                      113
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">
                    <div>
                      <p className="font-semibold text-red-800">
                        Emergency
                      </p>
                      <p className="text-xs text-red-700">
                        Immediate attention required
                      </p>
                    </div>

                    <span className="text-xl font-bold text-red-800">
                      43
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="rounded-2xl border border-outline-variant bg-surface shadow-sm">
                <div className="border-b border-outline-variant p-6">
                  <h2 className="text-lg font-bold">
                    Recent Referral Activity
                  </h2>

                  <p className="mt-1 text-sm text-on-surface-variant">
                    Latest referral updates.
                  </p>
                </div>

                <div>
                  {recentReferrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between gap-4 border-b border-outline-variant p-5 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {referral.patient}
                        </p>

                        <p className="mt-1 truncate text-xs text-on-surface-variant">
                          {referral.id} · {referral.facility}
                        </p>

                        <p className="mt-1 text-xs text-on-surface-variant">
                          {referral.date}
                        </p>
                      </div>

                      <StatusBadge status={referral.status} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}