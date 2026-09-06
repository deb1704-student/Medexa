import { Link, useParams } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { useReferralStore } from "@/sync/referralStore";
import { useReferralAuth } from "@/sync/referralAuth";

const demoReferral = {
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

function StatusBadge({ status }: { status: string }) {
  const getBadgeStyle = (st: string) => {
    switch (st) {
      case "Referred to Block":
      case "At Block Office":
        return "bg-indigo-100 text-indigo-800";
      case "Escalated to District":
        return "bg-purple-100 text-purple-800";
      case "In Consultation":
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-emerald-100 text-emerald-700";
      case "Back-Referred":
        return "bg-teal-100 text-teal-800";
      case "Overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-surface-container text-on-surface-variant";
    }
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeStyle(status)}`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const getPriorityStyle = (p: string) => {
    if (p === "Emergency") return "bg-red-100 text-red-800 animate-pulse";
    if (p === "High" || p === "Urgent") return "bg-amber-100 text-amber-800";
    return "bg-surface-container text-on-surface-variant";
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(priority)}`}
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
      <div className="flex flex-col items-center">
        <div
          className={`h-3 w-3 rounded-full ${
            active ? "bg-primary ring-4 ring-primary/20" : "bg-outline"
          }`}
        />
        <div className="h-full w-0.5 bg-outline-variant" />
      </div>

      <div className="pb-6">
        <p className="text-sm font-semibold text-on-surface">
          {title}
        </p>

        <p className="mt-1 text-sm text-on-surface-variant">
          {description}
        </p>

        <p className="mt-1 text-xs text-on-surface-variant">
          {time}
        </p>
      </div>
    </div>
  );
}

export function ReferralDetailsPage() {
  const { referralId } = useParams();
  const { ashaUser, blockOfficerUser, districtOfficerUser } = useReferralAuth();
  const isAuthenticated = Boolean(ashaUser || blockOfficerUser || districtOfficerUser);

  const backPortalPath = districtOfficerUser
    ? "/dashboard/referrals/district-office"
    : blockOfficerUser
    ? "/dashboard/referrals/block-office"
    : ashaUser
    ? "/dashboard/referrals/asha"
    : "/#portals";

  const backPortalLabel = districtOfficerUser
    ? "District Portal"
    : blockOfficerUser
    ? "Block Office Portal"
    : ashaUser
    ? "ASHA Portal"
    : "Portal Chooser";

  const { referrals } = useReferralStore();
  const list = Array.isArray(referrals) ? referrals : [];
  const found = referralId ? list.find((r) => r && r.id === referralId) : undefined;

  const referral = found
    ? {
        id: found.id,
        patientName: found.patientName,
        patientId: found.patientId,
        age: found.ageGender,
        gender: found.ageGender,
        state: found.state,
        district: found.district,
        block: found.block,
        village: found.village,
        referringFacility: found.fromFacilityOrWorker,
        receivingFacility: found.toFacility,
        reason: found.clinicalNotes,
        priority: found.priority,
        status: found.status,
        createdAt: found.referralDate,
        lastUpdated: found.lastAction,
        notes: found.clinicalNotes,
        assignedDoctor: found.assignedDoctor,
        triageLevel: found.triageLevel,
        transport: found.escortTransport,
      }
    : {
        id: referralId || demoReferral.id,
        patientName: demoReferral.patientName,
        patientId: demoReferral.patientId,
        age: `${demoReferral.age} years`,
        gender: demoReferral.gender,
        state: "West Bengal",
        district: "Bankura",
        block: "Joypur Block",
        village: "Rampur Village",
        referringFacility: demoReferral.referringFacility,
        receivingFacility: demoReferral.receivingFacility,
        reason: demoReferral.reason,
        priority: demoReferral.priority,
        status: demoReferral.status,
        createdAt: demoReferral.createdAt,
        lastUpdated: demoReferral.lastUpdated,
        notes: demoReferral.notes,
        assignedDoctor: "Dr. Anirban Roy (MOIC)",
        triageLevel: "YELLOW",
        transport: "Accompanied by ASHA",
      };

  // Check strict jurisdictional scope
  let isWithinScope = true;
  let scopeDenialMessage = "";

  if (ashaUser) {
    const userFac = (ashaUser.facilityOrVillage || "").toLowerCase();
    const refVillage = (referral.village || "").toLowerCase();
    const refWorker = (referral.referringFacility || "").toLowerCase();
    const userName = (ashaUser.name || "").toLowerCase();

    const matchesVillage =
      (userFac.includes("rampur") && refVillage.includes("rampur")) ||
      ((userFac.includes("sonamukhi") || userFac.includes("sonapur")) &&
        (refVillage.includes("sonamukhi") || refVillage.includes("sonapur"))) ||
      (userFac.includes("belur") && refVillage.includes("belur")) ||
      (userFac.includes("shyampur") && refVillage.includes("shyampur")) ||
      refWorker.includes(userName);

    if (!matchesVillage) {
      isWithinScope = false;
      scopeDenialMessage = `As an ASHA health worker for ${ashaUser.facilityOrVillage}, you only have authorization to view patient records within your assigned village jurisdiction.`;
    }
  } else if (blockOfficerUser) {
    const userFac = (blockOfficerUser.facilityOrVillage || "").toLowerCase();
    const fromFac = (referral.referringFacility || "").toLowerCase();
    const toFac = (referral.receivingFacility || "").toLowerCase();

    const matchesFacility =
      (userFac.includes("belur") && (fromFac.includes("belur") || toFac.includes("belur"))) ||
      (userFac.includes("joypur") && (fromFac.includes("joypur") || toFac.includes("joypur"))) ||
      (userFac.includes("sonamukhi") && (fromFac.includes("sonamukhi") || toFac.includes("sonamukhi"))) ||
      (userFac.includes("kotulpur") && (fromFac.includes("kotulpur") || toFac.includes("kotulpur")));

    if (!matchesFacility) {
      isWithinScope = false;
      scopeDenialMessage = `As a Block Health Officer for ${blockOfficerUser.facilityOrVillage}, you only have authorization to view referrals within your facility.`;
    }
  } else if (districtOfficerUser) {
    const userFac = (districtOfficerUser.facilityOrVillage || "").toLowerCase();
    const officerDistrict = userFac.includes("purulia") ? "purulia" : "bankura";
    const refDistrict = (referral.district || "").toLowerCase();

    if (!refDistrict.includes(officerDistrict)) {
      isWithinScope = false;
      scopeDenialMessage = `As a District Officer for ${districtOfficerUser.facilityOrVillage}, you only have authorization to view referrals within your district jurisdiction.`;
    }
  }

  // Unauthenticated Lock Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-outline-variant bg-surface p-8 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <span className="material-symbols-outlined text-4xl">lock</span>
          </div>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
            Strict Role-Scoped Security
          </span>
          <h2 className="text-2xl font-bold text-on-surface">Authentication Required</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Referral records contain confidential patient data. You must authenticate into your verified care tier portal to view clinical details.
          </p>
          <div className="mt-6">
            <Link
              to="/#portals"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 px-6 font-bold text-on-primary shadow-md hover:bg-primary-hover transition"
            >
              <span className="material-symbols-outlined">apps</span>
              <span>Choose Your Care Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Out-of-Scope Denial
  if (!isWithinScope) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-amber-500/30 bg-surface p-8 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-4">
            <span className="material-symbols-outlined text-4xl">shield_lock</span>
          </div>
          <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 mb-2">
            Outside Jurisdictional Scope
          </span>
          <h2 className="text-2xl font-bold text-on-surface">Access Restricted</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {scopeDenialMessage}
          </p>
          <div className="mt-6">
            <Link
              to={backPortalPath}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 px-6 font-bold text-on-primary shadow-md hover:bg-primary-hover transition"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Return to {backPortalLabel}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                    to={backPortalPath}
                    className="hover:text-primary"
                  >
                    {backPortalLabel}
                  </Link>

                  <span>/</span>

                  <span className="font-mono text-primary font-bold">{referral.id}</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight">
                  Referral Details
                </h1>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Review referral status, clinical triage level, patient hierarchy and care journey.
                </p>
              </div>

              <Link
                to={backPortalPath}
                className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-container flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to {backPortalLabel}
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
            {/* Referral heading */}
            <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                    {referral.patientName.charAt(0) || "P"}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold font-mono text-primary">
                        {referral.id}
                      </h2>

                      <StatusBadge status={referral.status} />
                      <PriorityBadge priority={referral.priority} />
                    </div>

                    <p className="mt-1 text-sm text-on-surface-variant">
                      Initiated: {referral.createdAt} • Doctor: <strong>{referral.assignedDoctor}</strong>
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container px-5 py-3">
                  <p className="text-xs text-on-surface-variant">
                    Latest Activity
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {referral.lastUpdated}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-3">
              {/* Patient information + 4-level geography */}
              <section className="xl:col-span-2 rounded-2xl border border-outline-variant bg-surface p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold">
                    Patient & Geographic Information
                  </h2>

                  <p className="mt-1 text-sm text-on-surface-variant">
                    Patient identification and 4-tier administrative location hierarchy.
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
                    label="Age / Gender"
                    value={referral.age}
                  />

                  <InfoRow
                    label="Transport Escort"
                    value={referral.transport}
                  />
                </div>

                {/* 4 Geographic Hierarchy Levels */}
                <div className="mt-6 rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">pin_drop</span>
                    Administrative Location Hierarchy (4 Levels)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-on-surface-variant">1. State:</span>
                      <p className="font-bold text-on-surface mt-0.5">{referral.state}</p>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">2. District:</span>
                      <p className="font-bold text-on-surface mt-0.5">{referral.district}</p>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">3. Block:</span>
                      <p className="font-bold text-on-surface mt-0.5">{referral.block}</p>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">4. Village / Ward:</span>
                      <p className="font-bold text-on-surface mt-0.5">{referral.village}</p>
                    </div>
                  </div>
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