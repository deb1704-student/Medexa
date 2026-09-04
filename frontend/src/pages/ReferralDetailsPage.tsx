import { Link, useParams } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";

type ReferralStatus =
  | "Pending"
  | "Accepted"
  | "In Progress"
  | "Completed"
  | "Overdue";

type Referral = {
  id: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  referringFacility: string;
  receivingFacility: string;
  reason: string;
  priority: "Routine" | "Urgent" | "Emergency";
  status: ReferralStatus;
  createdAt: string;
  lastUpdated: string;
  notes: string;
};

const demoReferral: Referral = {
  id: "REF-2026-001",
  patientName: "Anita Sharma",
  patientId: "PAT-2026-1042",
  age: 42,
  gender: "Female",
  referringFacility: "PHC Sonapur",
  receivingFacility: "District Hospital",
  reason: "Persistent fever and weakness",
  priority: "Urgent",
  status: "Accepted",
  createdAt: "02 Sep 2026, 10:30 AM",
  lastUpdated: "03 Sep 2026, 09:15 AM",
  notes:
    "Patient requires further evaluation and laboratory investigation. Receiving facility has accepted the referral.",
};

function StatusBadge({ status }: { status: ReferralStatus }) {
  const styles: Record<ReferralStatus, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Accepted: "bg-gray-200 text-gray-600",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-emerald-100 text-emerald-700",
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

function PriorityBadge({
  priority,
}: {
  priority: Referral["priority"];
}) {
  const styles = {
    Routine: "bg-gray-100 text-gray-600",
    Urgent: "bg-amber-100 text-amber-700",
    Emergency: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-on-surface">
        {value}
      </p>
    </div>
  );
}

function TimelineItem({
  title,
  description,
  time,
  active = false,
}: {
  title: string;
  description: string;
  time: string;
  active?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      <div
        className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
          active ? "bg-primary" : "bg-gray-300"
        }`}
      />

      <div className="flex-1 pb-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-on-surface">{title}</p>
          <span className="text-xs text-on-surface-variant">
            {time}
          </span>
        </div>

        <p className="mt-1 text-sm text-on-surface-variant">
          {description}
        </p>
      </div>
    </div>
  );
}

export function ReferralDetailsPage() {
  const { referralId } = useParams();

  const referral = {
    ...demoReferral,
    id: referralId || demoReferral.id,
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        {/* Main */}
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

                  <Link
                    to="/dashboard/referrals"
                    className="hover:text-primary"
                  >
                    Referrals
                  </Link>

                  <span>/</span>

                  <span>{referral.id}</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight">
                  Referral Details
                </h1>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Review referral status, patient information and care
                  journey.
                </p>
              </div>

              <Link
                to="/dashboard/referrals"
                className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-container"
              >
                ← Back to Referrals
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
            {/* Referral heading */}
            <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                    R
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold">
                        {referral.id}
                      </h2>

                      <StatusBadge status={referral.status} />
                      <PriorityBadge priority={referral.priority} />
                    </div>

                    <p className="mt-1 text-sm text-on-surface-variant">
                      Created {referral.createdAt}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container px-5 py-3">
                  <p className="text-xs text-on-surface-variant">
                    Last updated
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {referral.lastUpdated}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-3">
              {/* Patient information */}
              <section className="xl:col-span-2 rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold">
                    Patient Information
                  </h2>

                  <p className="mt-1 text-sm text-on-surface-variant">
                    Basic patient details associated with this referral.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoRow
                    label="Patient Name"
                    value={referral.patientName}
                  />

                  <InfoRow
                    label="Patient ID"
                    value={referral.patientId}
                  />

                  <InfoRow
                    label="Age"
                    value={`${referral.age} years`}
                  />

                  <InfoRow
                    label="Gender"
                    value={referral.gender}
                  />
                </div>
              </section>

              {/* Status */}
              <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-bold">
                  Current Status
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Current referral progress.
                </p>

                <div className="mt-6">
                  <StatusBadge status={referral.status} />
                </div>

                <label className="mt-6 block text-sm font-medium">
                  Update status
                </label>

                <select
                  defaultValue={referral.status}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option>Pending</option>
                  <option>Accepted</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Overdue</option>
                </select>

                <button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary hover:opacity-90"
                >
                  Save Status
                </button>
              </section>
            </div>

            {/* Referral journey */}
            <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold">
                  Referral Journey
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Facilities involved in this patient's care transition.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3 md:items-center">
                <div className="rounded-2xl bg-surface-container p-5">
                  <p className="text-xs font-medium text-on-surface-variant">
                    Referring Facility
                  </p>

                  <p className="mt-2 text-lg font-bold">
                    {referral.referringFacility}
                  </p>

                  <p className="mt-1 text-sm text-on-surface-variant">
                    Origin of referral
                  </p>
                </div>

                <div className="hidden text-center text-3xl text-primary md:block">
                  →
                </div>

                <div className="rounded-2xl bg-gray-200 p-5">
                  <p className="text-xs font-medium text-primary">
                    Receiving Facility
                  </p>

                  <p className="mt-2 text-lg font-bold text-primary">
                    {referral.receivingFacility}
                  </p>

                  <p className="mt-1 text-sm text-primary">
                    Current destination
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Referral information */}
              <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-bold">
                  Referral Information
                </h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <InfoRow
                    label="Referral ID"
                    value={referral.id}
                  />

                  <InfoRow
                    label="Priority"
                    value={referral.priority}
                  />

                  <InfoRow
                    label="Reason for Referral"
                    value={referral.reason}
                  />

                  <InfoRow
                    label="Created"
                    value={referral.createdAt}
                  />
                </div>
              </section>

              {/* Timeline */}
              <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-bold">
                  Referral Timeline
                </h2>

                <div className="mt-6">
                  <TimelineItem
                    title="Referral Created"
                    description={`${referral.referringFacility} created the referral.`}
                    time="02 Sep, 10:30 AM"
                  />

                  <TimelineItem
                    title="Referral Accepted"
                    description={`${referral.receivingFacility} accepted the referral.`}
                    time="02 Sep, 04:45 PM"
                    active
                  />

                  <TimelineItem
                    title="Awaiting Patient Transfer"
                    description="Patient transfer is currently being coordinated."
                    time="03 Sep, 09:15 AM"
                    active
                  />
                </div>
              </section>
            </div>

            {/* Clinical notes */}
            <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-bold">
                Clinical Notes
              </h2>

              <div className="mt-4 rounded-xl bg-yellow-100 p-5">
              <p className="text-sm font-bold leading-6 text-yellow-800">
              {referral.notes}
              </p>
              </div>
            </section>

            
            
          </div>
        </main>
      </div>
    </div>
  );
}