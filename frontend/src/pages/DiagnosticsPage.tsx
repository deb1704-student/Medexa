import { useMemo, useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { useAuth } from "@/auth/auth";

export interface DiagnosticTest {
  id: string;
  test: string;
  category: string;
  facility: string;
  availability: "Available" | "Limited" | "Unavailable";
  waitingTime: string;
  turnaroundTime: string;
  lastUpdated: string;
}

const DEFAULT_DISTRICT_DIAGNOSTICS: DiagnosticTest[] = [
  {
    id: "diag-d-1",
    test: "Complete Blood Count (CBC)",
    category: "Hematology Lab",
    facility: "Diamond Harbour DH",
    availability: "Available",
    waitingTime: "25 min",
    turnaroundTime: "2 hours",
    lastUpdated: "12 min ago",
  },
  {
    id: "diag-d-2",
    test: "Digital Chest X-Ray (PA View)",
    category: "Radiology & Imaging",
    facility: "Diamond Harbour DH",
    availability: "Available",
    waitingTime: "40 min",
    turnaroundTime: "1 hour",
    lastUpdated: "20 min ago",
  },
  {
    id: "diag-d-3",
    test: "Abdominal & Pelvic Ultrasound (USG)",
    category: "Radiology & Imaging",
    facility: "Diamond Harbour DH",
    availability: "Limited",
    waitingTime: "1.5 hours",
    turnaroundTime: "Same Day",
    lastUpdated: "35 min ago",
  },
  {
    id: "diag-d-4",
    test: "12-Lead Electrocardiogram (ECG)",
    category: "Cardiology",
    facility: "Diamond Harbour DH",
    availability: "Available",
    waitingTime: "15 min",
    turnaroundTime: "30 min",
    lastUpdated: "8 min ago",
  },
  {
    id: "diag-d-5",
    test: "High-Resolution CT Scan (Brain / Thorax)",
    category: "Advanced Imaging",
    facility: "Diamond Harbour DH",
    availability: "Limited",
    waitingTime: "2.5 hours",
    turnaroundTime: "4 hours",
    lastUpdated: "45 min ago",
  },
  {
    id: "diag-d-6",
    test: "Serum Electrolytes & Renal Panel (KFT)",
    category: "Biochemistry",
    facility: "Diamond Harbour DH",
    availability: "Available",
    waitingTime: "30 min",
    turnaroundTime: "2 hours",
    lastUpdated: "1 hour ago",
  },
  {
    id: "diag-d-7",
    test: "Arterial Blood Gas (ABG) Analysis",
    category: "Critical Care / ICU",
    facility: "Diamond Harbour DH",
    availability: "Available",
    waitingTime: "10 min",
    turnaroundTime: "20 min",
    lastUpdated: "5 min ago",
  },
];

const DEFAULT_CHC_DIAGNOSTICS: DiagnosticTest[] = [
  {
    id: "diag-b-1",
    test: "Complete Blood Count (CBC)",
    category: "Pathology Lab",
    facility: "Dwariknagar Rural Hospital",
    availability: "Available",
    waitingTime: "30 min",
    turnaroundTime: "3 hours",
    lastUpdated: "15 min ago",
  },
  {
    id: "diag-b-2",
    test: "Basic Digital X-Ray",
    category: "Radiology",
    facility: "Dwariknagar Rural Hospital",
    availability: "Available",
    waitingTime: "45 min",
    turnaroundTime: "2 hours",
    lastUpdated: "25 min ago",
  },
  {
    id: "diag-b-3",
    test: "Routine Obstetric Ultrasound",
    category: "Ultrasonography",
    facility: "Dwariknagar Rural Hospital",
    availability: "Limited",
    waitingTime: "2 hours",
    turnaroundTime: "Same Day",
    lastUpdated: "40 min ago",
  },
  {
    id: "diag-b-4",
    test: "Random / Fasting Blood Glucose",
    category: "Biochemistry",
    facility: "Dwariknagar Rural Hospital",
    availability: "Available",
    waitingTime: "10 min",
    turnaroundTime: "15 min",
    lastUpdated: "10 min ago",
  },
  {
    id: "diag-b-5",
    test: "Standard 12-Lead ECG",
    category: "Cardiology",
    facility: "Dwariknagar Rural Hospital",
    availability: "Available",
    waitingTime: "20 min",
    turnaroundTime: "30 min",
    lastUpdated: "30 min ago",
  },
  {
    id: "diag-b-6",
    test: "Rapid Malaria (Pf/Pv) & Dengue NS1 Kit",
    category: "Serology / Vector-Borne",
    facility: "Dwariknagar Rural Hospital",
    availability: "Available",
    waitingTime: "15 min",
    turnaroundTime: "30 min",
    lastUpdated: "50 min ago",
  },
  {
    id: "diag-b-7",
    test: "Urine Routine & Microscopic (RE/ME)",
    category: "Clinical Pathology",
    facility: "Dwariknagar Rural Hospital",
    availability: "Unavailable",
    waitingTime: "—",
    turnaroundTime: "Reagent Restock Due",
    lastUpdated: "2 hours ago",
  },
];

function availabilityStyle(availability: DiagnosticTest["availability"]) {
  if (availability === "Available") {
    return "bg-emerald-100 text-emerald-800 border border-emerald-300";
  }
  if (availability === "Limited") {
    return "bg-amber-100 text-amber-800 border border-amber-300";
  }
  return "bg-red-100 text-red-700 border border-red-300";
}

export function DiagnosticsPage() {
  const { user } = useAuth();
  const isDistrict = user?.role === "DISTRICT";

  const activeFacility = useMemo(() => {
    if (user?.facilityOrVillage) return user.facilityOrVillage;
    if (user?.facility) return user.facility;
    return isDistrict ? "Diamond Harbour DH" : "Dwariknagar Rural Hospital";
  }, [user, isDistrict]);

  const storageKey = useMemo(() => {
    const rolePrefix = isDistrict ? "DISTRICT" : "CHC";
    const facilitySlug = activeFacility.replace(/\s+/g, "_").toLowerCase();
    return `medexa_diagnostics_${rolePrefix}_${facilitySlug}`;
  }, [isDistrict, activeFacility]);

  const [diagnostics, setDiagnostics] = useState<DiagnosticTest[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    const defaults = isDistrict ? DEFAULT_DISTRICT_DIAGNOSTICS : DEFAULT_CHC_DIAGNOSTICS;
    return defaults.map((d) => ({ ...d, facility: activeFacility }));
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(diagnostics));
    } catch (e) {
      console.warn("Could not save diagnostics to localStorage:", e);
    }
  }, [diagnostics, storageKey]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Add Test Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testName, setTestName] = useState("");
  const [testCategory, setTestCategory] = useState("Hematology Lab");
  const [testAvailability, setTestAvailability] = useState<DiagnosticTest["availability"]>("Available");
  const [testWaitingTime, setTestWaitingTime] = useState("30 min");
  const [testTurnaround, setTestTurnaround] = useState("2 hours");

  // Edit Test Modal State
  const [editingTest, setEditingTest] = useState<DiagnosticTest | null>(null);
  const [editAvailability, setEditAvailability] = useState<DiagnosticTest["availability"]>("Available");
  const [editWaitingTime, setEditWaitingTime] = useState("");
  const [editTurnaround, setEditTurnaround] = useState("");

  const categories = useMemo(() => {
    const cats = new Set(diagnostics.map((d) => d.category));
    return ["ALL", ...Array.from(cats)];
  }, [diagnostics]);

  const filtered = useMemo(() => {
    return diagnostics.filter((item) => {
      const text = `${item.test} ${item.facility} ${item.category}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCat = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [diagnostics, search, categoryFilter]);

  const available = diagnostics.filter((item) => item.availability === "Available").length;
  const limited = diagnostics.filter((item) => item.availability === "Limited").length;
  const unavailable = diagnostics.filter((item) => item.availability === "Unavailable").length;

  const handleQuickAvailabilityChange = (id: string, newAvail: DiagnosticTest["availability"]) => {
    setDiagnostics((prev) =>
      prev.map((d) => (d.id === id ? { ...d, availability: newAvail, lastUpdated: "Just now" } : d))
    );
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    const newTest: DiagnosticTest = {
      id: `diag-${Date.now()}`,
      test: testName.trim(),
      category: testCategory.trim() || "Clinical Diagnostics",
      facility: activeFacility,
      availability: testAvailability,
      waitingTime: testWaitingTime.trim() || "30 min",
      turnaroundTime: testTurnaround.trim() || "2 hours",
      lastUpdated: "Just now",
    };

    setDiagnostics((prev) => [newTest, ...prev]);
    setIsAddModalOpen(false);
    setTestName("");
    setTestWaitingTime("30 min");
    setTestTurnaround("2 hours");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;

    setDiagnostics((prev) =>
      prev.map((d) =>
        d.id === editingTest.id
          ? {
              ...d,
              availability: editAvailability,
              waitingTime: editWaitingTime.trim() || d.waitingTime,
              turnaroundTime: editTurnaround.trim() || d.turnaroundTime,
              lastUpdated: "Just now",
            }
          : d
      )
    );

    setEditingTest(null);
  };

  const handleDeleteTest = (id: string) => {
    if (window.confirm("Remove this diagnostic test from the facility service list?")) {
      setDiagnostics((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset diagnostic tests to standard facility defaults?")) {
      const defaults = isDistrict ? DEFAULT_DISTRICT_DIAGNOSTICS : DEFAULT_CHC_DIAGNOSTICS;
      setDiagnostics(defaults.map((d) => ({ ...d, facility: activeFacility })));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="min-h-screen md:ml-64">
        {/* HEADER */}
        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {isDistrict ? "Regional Hospital Diagnostic Command" : "CHC Diagnostic Services"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-on-surface">
                Diagnostic Service Coordination
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-on-surface-variant">
                Real-time test availability and patient turnaround tracking for <strong className="text-on-surface">{activeFacility}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition"
                title="Reset to facility defaults"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-xs hover:bg-primary/90 transition"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Add Test</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-6">
          {/* SUMMARY CARDS */}
          <div className="grid gap-5 md:grid-cols-3">
            <SummaryCard
              title="Fully Available"
              value={available}
              icon="check_circle"
              colorClass="bg-emerald-100 text-emerald-800"
            />
            <SummaryCard
              title="Limited / Delayed"
              value={limited}
              icon="schedule"
              colorClass="bg-amber-100 text-amber-800"
            />
            <SummaryCard
              title="Temporarily Unavailable"
              value={unavailable}
              icon="error"
              colorClass="bg-red-100 text-red-700"
              danger
            />
          </div>

          {/* DIAGNOSTIC SERVICES TABLE & CONTROLS */}
          <div className="rounded-3xl border border-outline-variant bg-surface p-5 md:p-7 shadow-xs">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-outline-variant/60 pb-5">
              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  Diagnostic Services Roster
                </h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Update test operating status, adjust queue waiting times, or add new clinical investigations.
                </p>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search diagnostic tests..."
                    className="w-full rounded-xl border border-outline-variant bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-outline-variant bg-background py-2 px-3 text-xs font-medium text-on-surface outline-none focus:border-primary"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === "ALL" ? "All Departments" : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-4 py-3">Diagnostic Test</th>
                    <th className="px-4 py-3">Department / Lab</th>
                    <th className="px-4 py-3">Operating Status</th>
                    <th className="px-4 py-3">Avg Waiting Time</th>
                    <th className="px-4 py-3">Report Turnaround</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/40">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-on-surface-variant">
                        No diagnostic services match your search. Click "+ Add Test" to create one.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-surface-container/40 transition"
                      >
                        <td className="px-4 py-3.5 font-bold text-on-surface text-sm">
                          {item.test}
                        </td>

                        <td className="px-4 py-3.5 text-on-surface-variant">
                          <span className="inline-block rounded-lg bg-surface-container px-2 py-0.5 text-[11px] font-semibold">
                            {item.category}
                          </span>
                        </td>

                        {/* Fast Status Selector */}
                        <td className="px-4 py-3.5">
                          <select
                            value={item.availability}
                            onChange={(e) =>
                              handleQuickAvailabilityChange(
                                item.id,
                                e.target.value as DiagnosticTest["availability"]
                              )
                            }
                            className={`rounded-xl border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${availabilityStyle(
                              item.availability
                            )}`}
                          >
                            <option value="Available">Available</option>
                            <option value="Limited">Limited</option>
                            <option value="Unavailable">Unavailable</option>
                          </select>
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-on-surface">
                          {item.waitingTime}
                        </td>

                        <td className="px-4 py-3.5 text-on-surface-variant">
                          {item.turnaroundTime}
                        </td>

                        <td className="px-4 py-3.5 text-on-surface-variant">
                          {item.lastUpdated}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTest(item);
                                setEditAvailability(item.availability);
                                setEditWaitingTime(item.waitingTime);
                                setEditTurnaround(item.turnaroundTime);
                              }}
                              className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition"
                              title="Edit test timing and details"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTest(item.id)}
                              className="rounded-lg p-1.5 text-on-surface-variant hover:bg-red-50 hover:text-red-700 transition"
                              title="Delete test"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ADD TEST MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">science</span>
                <span>Add Diagnostic Service</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddTest} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Test / Investigation Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thyroid Profile (T3, T4, TSH)"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Department / Lab
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biochemistry Lab"
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Initial Availability Status
                </label>
                <select
                  value={testAvailability}
                  onChange={(e) => setTestAvailability(e.target.value as DiagnosticTest["availability"])}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="Available">Available</option>
                  <option value="Limited">Limited</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Avg Waiting Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20 min"
                    value={testWaitingTime}
                    onChange={(e) => setTestWaitingTime(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Report Turnaround
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 hours"
                    value={testTurnaround}
                    onChange={(e) => setTestTurnaround(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-xs hover:bg-primary/90"
                >
                  Register Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEST MODAL */}
      {editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface">
                Edit Diagnostic: {editingTest.test}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTest(null)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Availability Status
                </label>
                <select
                  value={editAvailability}
                  onChange={(e) => setEditAvailability(e.target.value as DiagnosticTest["availability"])}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="Available">Available</option>
                  <option value="Limited">Limited</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Queue Waiting Time
                </label>
                <input
                  type="text"
                  required
                  value={editWaitingTime}
                  onChange={(e) => setEditWaitingTime(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Report Turnaround Time
                </label>
                <input
                  type="text"
                  required
                  value={editTurnaround}
                  onChange={(e) => setEditTurnaround(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-xs hover:bg-primary/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
  colorClass?: string;
  danger?: boolean;
}

function SummaryCard({
  title,
  value,
  icon,
  colorClass = "bg-primary/10 text-primary",
  danger = false,
}: SummaryCardProps) {
  return (
    <div
      className={`rounded-3xl border p-6 bg-surface shadow-xs transition hover:shadow-sm ${
        danger ? "border-red-200" : "border-outline-variant"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {title}
          </p>
          <p
            className={`mt-2 text-3xl font-extrabold ${
              danger ? "text-red-700" : "text-on-surface"
            }`}
          >
            {value}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}