import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";

type FacilityStatus = "Operational" | "Limited" | "Offline";

type Facility = {
  id: string;
  name: string;
  type: string;
  location: string;
  contact: string;
  referrals: number;
  status: FacilityStatus;
};

const facilities: Facility[] = [
  {
    id: "FAC-001",
    name: "PHC Sonapur",
    type: "Primary Health Centre",
    location: "Sonapur",
    contact: "+91 98765 43210",
    referrals: 24,
    status: "Operational",
  },
  {
    id: "FAC-002",
    name: "PHC Rampur",
    type: "Primary Health Centre",
    location: "Rampur",
    contact: "+91 98765 12345",
    referrals: 18,
    status: "Operational",
  },
  {
    id: "FAC-003",
    name: "CHC Bishnupur",
    type: "Community Health Centre",
    location: "Bishnupur",
    contact: "+91 98765 67890",
    referrals: 31,
    status: "Limited",
  },
  {
    id: "FAC-004",
    name: "District Hospital",
    type: "District Hospital",
    location: "Central District",
    contact: "+91 98765 11111",
    referrals: 56,
    status: "Operational",
  },
  {
    id: "FAC-005",
    name: "PHC Madhupur",
    type: "Primary Health Centre",
    location: "Madhupur",
    contact: "+91 98765 22222",
    referrals: 12,
    status: "Offline",
  },
  {
    id: "FAC-006",
    name: "CHC Kharagpur",
    type: "Community Health Centre",
    location: "Kharagpur",
    contact: "+91 98765 33333",
    referrals: 27,
    status: "Operational",
  },
];

function StatusBadge({ status }: { status: FacilityStatus }) {
  const styles: Record<FacilityStatus, string> = {
    Operational: "bg-emerald-100 text-emerald-700",
    Limited: "bg-amber-100 text-amber-700",
    Offline: "bg-gray-200 text-gray-600",
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

export function FacilitiesPage() {
  const totalFacilities = facilities.length;

  const primaryHealthCentres = facilities.filter(
    (facility) => facility.type === "Primary Health Centre",
  ).length;

  const communityHealthCentres = facilities.filter(
    (facility) => facility.type === "Community Health Centre",
  ).length;

  const operationalFacilities = facilities.filter(
    (facility) => facility.status === "Operational",
  ).length;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        {/* Main Content */}
        <main className="min-w-0 flex-1 md:ml-64">
          {/* Header */}
          <header className="border-b border-outline-variant bg-surface">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
                  <Link
                    to="/dashboard"
                    className="hover:text-primary"
                  >
                    Dashboard
                  </Link>

                  <span>/</span>

                  <span>Facilities</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight">
                  Facilities
                </h1>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Monitor healthcare facilities and referral activity
                  across the district.
                </p>
              </div>

              <button
                type="button"
                className="hidden rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary hover:opacity-90 sm:block"
              >
                + Add Facility
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
            {/* Statistics */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Facilities"
                value={String(totalFacilities)}
                description="Registered facilities"
              />

              <StatCard
                title="Primary Health Centres"
                value={String(primaryHealthCentres)}
                description="PHCs in the district"
              />

              <StatCard
                title="Community Health Centres"
                value={String(communityHealthCentres)}
                description="CHCs in the district"
              />

              <StatCard
                title="Operational"
                value={String(operationalFacilities)}
                description="Currently operational"
              />
            </section>

            {/* Facility Table */}
            <section className="rounded-2xl border border-outline-variant bg-surface shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-outline-variant p-6 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-bold">
                    Facility Directory
                  </h2>

                  <p className="mt-1 text-sm text-on-surface-variant">
                    All healthcare facilities currently registered in
                    the district.
                  </p>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Search facilities..."
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary md:w-64"
                  />

                  <select
                    defaultValue="All"
                    className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option>All</option>
                    <option>Operational</option>
                    <option>Limited</option>
                    <option>Offline</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Facility
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Type
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Location
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Contact
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Referrals
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {facilities.map((facility) => (
                      <tr
                        key={facility.id}
                        className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container/50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                              {facility.name.charAt(0)}
                            </div>

                            <div>
                              <p className="font-semibold">
                                {facility.name}
                              </p>

                              <p className="mt-1 text-xs text-on-surface-variant">
                                {facility.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm">
                          {facility.type}
                        </td>

                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                          {facility.location}
                        </td>

                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                          {facility.contact}
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-semibold">
                            {facility.referrals}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge status={facility.status} />
                        </td>

                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-container"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

           
          </div>
        </main>
      </div>
    </div>
  );
}