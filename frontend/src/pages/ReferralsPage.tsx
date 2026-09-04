import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";

type ReferralStatus =
  | "Pending"
  | "Accepted"
  | "In Progress"
  | "Completed"
  | "Overdue";

type ReferralPriority = "High" | "Medium" | "Normal";

interface Referral {
  id: string;
  patientName: string;
  patientId: string;
  referringFacility: string;
  receivingFacility: string;
  priority: ReferralPriority;
  status: ReferralStatus;
  referralDate: string;
  lastUpdate: string;
  assignedTo: string;
}

const REFERRALS: Referral[] = [
  {
    id: "REF-2026-001",
    patientName: "Ananya Sharma",
    patientId: "PAT-1042",
    referringFacility: "Rural Health Center",
    receivingFacility: "City Hospital",
    priority: "High",
    status: "In Progress",
    referralDate: "03 Sep 2026",
    lastUpdate: "Today, 10:42 AM",
    assignedTo: "Dr. A. Sen",
  },
  {
    id: "REF-2026-002",
    patientName: "Rahul Das",
    patientId: "PAT-1043",
    referringFacility: "Community Clinic",
    receivingFacility: "District Hospital",
    priority: "Medium",
    status: "Accepted",
    referralDate: "03 Sep 2026",
    lastUpdate: "Today, 09:15 AM",
    assignedTo: "Dr. R. Kumar",
  },
  {
    id: "REF-2026-003",
    patientName: "Priya Roy",
    patientId: "PAT-1044",
    referringFacility: "Rural Health Center",
    receivingFacility: "City Hospital",
    priority: "Normal",
    status: "Completed",
    referralDate: "02 Sep 2026",
    lastUpdate: "Yesterday, 04:30 PM",
    assignedTo: "Dr. S. Ghosh",
  },
  {
    id: "REF-2026-004",
    patientName: "Sourav Mondal",
    patientId: "PAT-1045",
    referringFacility: "Community Clinic",
    receivingFacility: "District Hospital",
    priority: "High",
    status: "Overdue",
    referralDate: "01 Sep 2026",
    lastUpdate: "Yesterday, 02:10 PM",
    assignedTo: "Dr. A. Sen",
  },
  {
    id: "REF-2026-005",
    patientName: "Meera Singh",
    patientId: "PAT-1046",
    referringFacility: "Primary Health Center",
    receivingFacility: "City Hospital",
    priority: "Medium",
    status: "Pending",
    referralDate: "01 Sep 2026",
    lastUpdate: "01 Sep 2026, 11:20 AM",
    assignedTo: "Unassigned",
  },
  {
    id: "REF-2026-006",
    patientName: "Arjun Patel",
    patientId: "PAT-1047",
    referringFacility: "Primary Health Center",
    receivingFacility: "District Hospital",
    priority: "Normal",
    status: "Completed",
    referralDate: "31 Aug 2026",
    lastUpdate: "31 Aug 2026, 05:40 PM",
    assignedTo: "Dr. R. Kumar",
  },
];

const STATUS_OPTIONS = [
  "All Statuses",
  "Pending",
  "Accepted",
  "In Progress",
  "Completed",
  "Overdue",
];

const FACILITY_OPTIONS = [
  "All Facilities",
  "City Hospital",
  "District Hospital",
  "Rural Health Center",
  "Community Clinic",
  "Primary Health Center",
];

export function ReferralsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [facilityFilter, setFacilityFilter] =
    useState("All Facilities");

  const filteredReferrals = useMemo(() => {
    return REFERRALS.filter((referral) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        referral.patientName.toLowerCase().includes(searchText) ||
        referral.patientId.toLowerCase().includes(searchText) ||
        referral.id.toLowerCase().includes(searchText) ||
        referral.referringFacility
          .toLowerCase()
          .includes(searchText) ||
        referral.receivingFacility
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        referral.status === statusFilter;

      const matchesFacility =
        facilityFilter === "All Facilities" ||
        referral.referringFacility === facilityFilter ||
        referral.receivingFacility === facilityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFacility
      );
    });
  }, [search, statusFilter, facilityFilter]);

  const total = REFERRALS.length;
  const pending = REFERRALS.filter(
    (item) => item.status === "Pending"
  ).length;
  const inProgress = REFERRALS.filter(
    (item) => item.status === "In Progress"
  ).length;
  const completed = REFERRALS.filter(
    (item) => item.status === "Completed"
  ).length;
  const overdue = REFERRALS.filter(
    (item) => item.status === "Overdue"
  ).length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All Statuses");
    setFacilityFilter("All Facilities");
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
    <div className="flex min-h-screen">
    <DashboardSidebar />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="min-h-screen md:ml-64">

        {/* Header */}
        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
                <Link
                  to="/dashboard"
                  className="hover:text-primary"
                >
                  Dashboard
                </Link>

                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>

                <span className="text-primary">
                  Referrals
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Referral Management
              </h1>

              <p className="mt-2 text-on-surface-variant">
                Monitor and manage patient referrals across district facilities.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary shadow-sm transition hover:opacity-90"
            >
              <span className="material-symbols-outlined">
                add
              </span>

              Create Referral
            </button>

          </div>

        </header>

        {/* Content */}
        <div className="space-y-8 p-6 md:p-10">

          {/* =================================================
              STATISTICS
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            <StatCard
              title="Total Referrals"
              value={total}
              icon="assignment"
              description="All referrals"
            />

            <StatCard
              title="Pending"
              value={pending}
              icon="schedule"
              description="Awaiting action"
            />

            <StatCard
              title="In Progress"
              value={inProgress}
              icon="sync"
              description="Currently active"
            />

            <StatCard
              title="Completed"
              value={completed}
              icon="task_alt"
              description="Successfully completed"
            />

            <StatCard
              title="Overdue"
              value={overdue}
              icon="warning"
              description="Needs attention"
              danger
            />

          </section>

          {/* =================================================
              SEARCH & FILTERS
          ================================================= */}

          <section className="rounded-3xl border border-outline-variant bg-surface-container-low p-5">

            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Referral Directory
                </h2>

                <p className="text-sm text-on-surface-variant">
                  Search and filter referrals by patient, facility, or status.
                </p>
              </div>

              <span className="rounded-full bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant">
                {filteredReferrals.length} result
                {filteredReferrals.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">

              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  search
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient, referral ID, or facility..."
                  className="w-full rounded-xl border border-outline-variant bg-surface px-11 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {/* Facility */}
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {FACILITY_OPTIONS.map((facility) => (
                  <option key={facility} value={facility}>
                    {facility}
                  </option>
                ))}
              </select>

              {/* Clear */}
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-outline-variant px-5 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container"
              >
                Clear
              </button>

            </div>

          </section>

          {/* =================================================
              REFERRAL TABLE
          ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-outline-variant bg-surface">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px] text-left">

                <thead className="border-b border-outline-variant bg-surface-container-low">

                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Patient
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Referral
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Facilities
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Priority
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Last Update
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Action
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-outline-variant">

                  {filteredReferrals.map((referral) => (

                    <tr
                      key={referral.id}
                      className="transition hover:bg-surface-container-low"
                    >

                      {/* Patient */}
                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                        <span className="material-symbols-outlined">
                        person
                        </span>
                        </div>

                          <div>
                            <p className="font-semibold">
                              {referral.patientName}
                            </p>

                            <p className="text-xs text-on-surface-variant">
                              {referral.patientId}
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* Referral */}
                      <td className="px-6 py-5">

                        <p className="font-semibold text-primary">
                          {referral.id}
                        </p>

                        <p className="mt-1 text-xs text-on-surface-variant">
                          {referral.referralDate}
                        </p>

                      </td>

                      {/* Facilities */}
                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2 text-sm">

                          <span className="material-symbols-outlined text-base text-on-surface-variant">
                            location_on
                          </span>

                          <div>
                            <p>
                              {referral.referringFacility}
                            </p>

                            <div className="my-1 flex items-center gap-1 text-xs text-on-surface-variant">
                              <span className="material-symbols-outlined text-xs">
                                arrow_downward
                              </span>
                              Receiving
                            </div>

                            <p className="font-medium">
                              {referral.receivingFacility}
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* Priority */}
                      <td className="px-6 py-5">
                        <PriorityBadge
                          priority={referral.priority}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <StatusBadge
                          status={referral.status}
                        />
                      </td>

                      {/* Last Update */}
                      <td className="px-6 py-5">

                        <p className="text-sm">
                          {referral.lastUpdate}
                        </p>

                        <p className="mt-1 text-xs text-on-surface-variant">
                          {referral.assignedTo}
                        </p>

                      </td>

                      {/* Action */}
                      <td className="px-6 py-5 text-right">

                        <Link
                            to={`/dashboard/referrals/${referral.id}`}
                            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-container"
                            >
                        View

                            <span className="material-symbols-outlined text-base">
                            arrow_forward
                            </span>
                            </Link>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* Empty state */}
            {filteredReferrals.length === 0 && (
              <div className="px-6 py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-container">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                    search_off
                  </span>
                </div>

                <h3 className="mt-4 font-bold">
                  No referrals found
                </h3>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary"
                >
                  Clear Filters
                </button>

              </div>
            )}

          </section>

        </div>

      </main>
        </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  description: string;
  danger?: boolean;
}

function StatCard({
  title,
  value,
  icon,
  description,
  danger = false,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-on-surface-variant">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-bold ${
              danger ? "text-error" : "text-on-surface"
            }`}
          >
            {value}
          </p>

          <p className="mt-1 text-xs text-on-surface-variant">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            danger
              ? "bg-error-container text-error"
              : "bg-gray-200 text-primary"
          }`}
        >
          <span className="material-symbols-outlined">
            {icon}
          </span>
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: ReferralStatus;
}) {
  const styles: Record<ReferralStatus, string> = {
    Pending:
      "bg-surface-container text-on-surface-variant",
    Accepted:
     "bg-yellow-200 text-primary",
    "In Progress":
      "bg-secondary-container text-primary",
    Completed:
      "bg-green-100 text-green-700",
    Overdue:
      "bg-error-container text-error",
  };

  const icons: Record<ReferralStatus, string> = {
    Pending: "schedule",
    Accepted: "check_circle",
    "In Progress": "sync",
    Completed: "task_alt",
    Overdue: "warning",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${styles[status]}`}
    >
      <span className="material-symbols-outlined text-sm">
        {icons[status]}
      </span>

      {status}
    </span>
  );
}

/* =========================================================
   PRIORITY BADGE
========================================================= */

function PriorityBadge({
  priority,
}: {
  priority: ReferralPriority;
}) {
  const styles: Record<ReferralPriority, string> = {
    High: "text-error",
    Medium: "text-orange-600",
    Normal: "text-on-surface-variant",
  };

  const icons: Record<ReferralPriority, string> = {
    High: "priority_high",
    Medium: "flag",
    Normal: "remove",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold ${styles[priority]}`}
    >
      <span className="material-symbols-outlined text-base">
        {icons[priority]}
      </span>

      {priority}
    </span>
  );
}