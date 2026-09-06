import { Link, NavLink, useNavigate } from "react-router-dom";
import { SyncIndicator } from "@/components/common/SyncIndicator";
import { BrandMark } from "@/components/common/BrandMark";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { useAuth } from "@/auth/auth";
import type { Role } from "@/auth/authTypes";
import { useLanguageStore } from "@/i18n/useLanguageStore";

interface NavItemConfig {
  label: string;
  labelKey: string;
  icon: string;
  path: string;
  roles: Role[];
}

const ALL_NAV_ITEMS: NavItemConfig[] = [
  // DISTRICT-ONLY ITEMS
  {
    label: "Overview",
    labelKey: "overview",
    icon: "dashboard",
    path: "/dashboard",
    roles: ["DISTRICT"],
  },
  {
    label: "District Referrals",
    labelKey: "districtReferrals",
    icon: "local_hospital",
    path: "/dashboard/referrals/district-office",
    roles: ["DISTRICT"],
  },
  {
    label: "Medicines",
    labelKey: "medicines",
    icon: "medication",
    path: "/dashboard/medicines",
    roles: ["DISTRICT"],
  },
  {
    label: "Diagnostics",
    labelKey: "diagnostics",
    icon: "biotech",
    path: "/dashboard/diagnostics",
    roles: ["DISTRICT"],
  },
  {
    label: "Doctor Availability",
    labelKey: "doctorAvailability",
    icon: "stethoscope",
    path: "/dashboard/doctor-availability",
    roles: ["BLOCK", "DISTRICT"],
  },

  // BLOCK-ONLY ITEMS
  {
    label: "Block Referrals",
    labelKey: "blockReferrals",
    icon: "domain",
    path: "/dashboard/referrals/block-office",
    roles: ["BLOCK"],
  },

  // ASHA-ONLY ITEMS
  {
    label: "Village Referrals",
    labelKey: "villageReferrals",
    icon: "volunteer_activism",
    path: "/dashboard/referrals/asha",
    roles: ["ASHA"],
  },
  {
    label: "Digital Triage",
    labelKey: "digitalTriage",
    icon: "vital_signs",
    path: "/triage",
    roles: ["ASHA"],
  },

  // SHARED ASHA, BLOCK & DISTRICT ITEMS
  {
    label: "High-Risk Follow-up",
    labelKey: "highRiskFollowUp",
    icon: "priority_high",
    path: "/dashboard/follow-up",
    roles: ["ASHA", "BLOCK", "DISTRICT"],
  },

  // DISTRICT REPORTS
  {
    label: "Reports",
    labelKey: "reports",
    icon: "analytics",
    path: "/dashboard/reports",
    roles: ["DISTRICT"],
  },
];

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { tPortal, language } = useLanguageStore();

  const userRole = user?.role;
  const authorizedNavItems = userRole
    ? ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole))
    : [];

  const handleLogout = () => {
    logout();
    navigate("/#portals");
  };

  const getRoleLabel = () => {
    if (userRole === "ASHA") return tPortal("ashaVillagePortal", "ASHA Village Portal", language);
    if (userRole === "BLOCK") return tPortal("blockHealthOffice", "Block Health Office", language);
    if (userRole === "DISTRICT") return tPortal("districtOfficeCommand", "District Office Command", language);
    return tPortal("healthcarePortal", "Healthcare Portal", language);
  };

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-outline-variant bg-surface md:flex">
      {/* BRAND */}
      <div className="px-6 py-6 border-b border-outline-variant/60">
        <Link to="/" className="block">
          <BrandMark showSubtitle={true} />
        </Link>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {getRoleLabel()}
          </span>
          {user && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                userRole === "ASHA"
                  ? "bg-teal-100 text-teal-800"
                  : userRole === "BLOCK"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {user.role}
            </span>
          )}
        </div>
      </div>

      {/* NAVIGATION - STRICTLY ROLE-AUTHORIZED */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1.5">
          {authorizedNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-full px-5 py-3 transition ${
                  isActive
                    ? "bg-secondary-container text-primary font-semibold shadow-xs"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              <span className="font-medium text-sm">
                {tPortal(item.labelKey, item.label)}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* USER IDENTITY & SIGN OUT */}
      {user && (
        <div className="px-4 py-3 border-t border-outline-variant/60 bg-surface-container-lowest">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-on-surface truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate">
                {user.village || user.facility || user.district || user.id}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2 py-1 text-xs font-medium text-error hover:bg-error/10 hover:border-error/30 transition shrink-0"
              title={tPortal("exit", "Sign Out")}
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>{tPortal("exit", "Exit")}</span>
            </button>
          </div>
        </div>
      )}

      {/* SYNC & LANGUAGE STATUS */}
      <div className="px-4 pb-5 pt-3 border-t border-outline-variant/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface-variant">{tPortal("languageLabel", "Language")}:</span>
          <LanguageSelector />
        </div>
        <SyncIndicator />
      </div>
    </aside>
  );
}