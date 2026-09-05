import { Link, NavLink } from "react-router-dom";
import { SyncIndicator } from "@/components/common/SyncIndicator";
import { BrandMark } from "@/components/common/BrandMark";

const NAV_ITEMS = [
  {
    label: "Overview",
    icon: "dashboard",
    path: "/dashboard",
  },
  {
    label: "Referrals",
    icon: "sync_alt",
    path: "/dashboard/referrals",
  },
  {
    label: "Facilities",
    icon: "local_hospital",
    path: "/dashboard/facilities",
  },
  {
    label: "Medicines",
    icon: "medication",
    path: "/dashboard/medicines",
  },
  {
    label: "Diagnostics",
    icon: "biotech",
    path: "/dashboard/diagnostics",
  },
  {
    label: "Appointments",
    icon: "calendar_month",
    path: "/dashboard/appointments",
  },
  {
    label: "High-Risk Follow-up",
    icon: "priority_high",
    path: "/dashboard/follow-up",
  },
  {
    label: "Reports",
    icon: "analytics",
    path: "/dashboard/reports",
  },
];

export function DashboardSidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-outline-variant bg-surface md:flex">

      {/* BRAND */}
      <div className="px-6 py-8">
        <Link to="/" className="block">
          <BrandMark showSubtitle={true} />
        </Link>

        <p className="mt-2 text-sm text-on-surface-variant">
          District Dashboard
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4">

        <div className="space-y-2">

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-full px-5 py-3 transition ${
                  isActive
                    ? "bg-secondary-container text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                }`
              }
            >
              <span className="material-symbols-outlined">
                {item.icon}
              </span>

              <span className="font-medium">
                {item.label}
              </span>
            </NavLink>
          ))}

        </div>

      </nav>

      {/* SYNC STATUS */}
      <div className="px-4 pb-6 pt-4">
        <SyncIndicator />
      </div>

    </aside>
  );
}