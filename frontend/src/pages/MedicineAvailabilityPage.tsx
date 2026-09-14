import { useMemo, useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { useAuth } from "@/auth/auth";

export interface FacilityMedicine {
  id: string;
  name: string;
  category: string;
  facility: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  lastUpdated: string;
}

const DEFAULT_DISTRICT_MEDICINES: FacilityMedicine[] = [
  {
    id: "med-1",
    name: "Paracetamol 650mg",
    category: "Pain & Fever",
    facility: "District Hospital",
    quantity: 420,
    unit: "Strips",
    minThreshold: 50,
    lastUpdated: "10 min ago",
  },
  {
    id: "med-2",
    name: "Amoxicillin + Clavulanic Acid",
    category: "Antibiotics",
    facility: "District Hospital",
    quantity: 65,
    unit: "Boxes",
    minThreshold: 30,
    lastUpdated: "25 min ago",
  },
  {
    id: "med-3",
    name: "ORS (Oral Rehydration Salts)",
    category: "Essential Care",
    facility: "District Hospital",
    quantity: 340,
    unit: "Packets",
    minThreshold: 50,
    lastUpdated: "18 min ago",
  },
  {
    id: "med-4",
    name: "Human Regular Insulin 100IU",
    category: "Diabetes Care",
    facility: "District Hospital",
    quantity: 12,
    unit: "Vials",
    minThreshold: 20,
    lastUpdated: "12 min ago",
  },
  {
    id: "med-5",
    name: "Azithromycin 500mg",
    category: "Antibiotics",
    facility: "District Hospital",
    quantity: 0,
    unit: "Strips",
    minThreshold: 25,
    lastUpdated: "40 min ago",
  },
  {
    id: "med-6",
    name: "Ceftriaxone 1g Injection",
    category: "IV / Critical Care",
    facility: "District Hospital",
    quantity: 85,
    unit: "Vials",
    minThreshold: 25,
    lastUpdated: "1 hour ago",
  },
  {
    id: "med-7",
    name: "Atorvastatin 20mg",
    category: "Cardiovascular",
    facility: "District Hospital",
    quantity: 190,
    unit: "Strips",
    minThreshold: 40,
    lastUpdated: "2 hours ago",
  },
  {
    id: "med-8",
    name: "Salbutamol Respirator Solution",
    category: "Respiratory",
    facility: "District Hospital",
    quantity: 18,
    unit: "Bottles",
    minThreshold: 20,
    lastUpdated: "3 hours ago",
  },
];

const DEFAULT_CHC_MEDICINES: FacilityMedicine[] = [
  {
    id: "chc-med-1",
    name: "Paracetamol 500mg",
    category: "Pain & Fever",
    facility: "Dwariknagar Rural Hospital",
    quantity: 210,
    unit: "Strips",
    minThreshold: 40,
    lastUpdated: "15 min ago",
  },
  {
    id: "chc-med-2",
    name: "Amoxicillin 500mg",
    category: "Antibiotics",
    facility: "Dwariknagar Rural Hospital",
    quantity: 35,
    unit: "Strips",
    minThreshold: 20,
    lastUpdated: "30 min ago",
  },
  {
    id: "chc-med-3",
    name: "ORS WHO Formula",
    category: "Essential Care",
    facility: "Dwariknagar Rural Hospital",
    quantity: 180,
    unit: "Packets",
    minThreshold: 50,
    lastUpdated: "45 min ago",
  },
  {
    id: "chc-med-4",
    name: "Metformin 500mg",
    category: "Diabetes Care",
    facility: "Dwariknagar Rural Hospital",
    quantity: 14,
    unit: "Strips",
    minThreshold: 25,
    lastUpdated: "2 hours ago",
  },
  {
    id: "chc-med-5",
    name: "Amlodipine 5mg",
    category: "Cardiovascular",
    facility: "Dwariknagar Rural Hospital",
    quantity: 90,
    unit: "Strips",
    minThreshold: 30,
    lastUpdated: "1 hour ago",
  },
  {
    id: "chc-med-6",
    name: "Oxytocin 10 IU Injection",
    category: "Maternal Health",
    facility: "Dwariknagar Rural Hospital",
    quantity: 22,
    unit: "Ampoules",
    minThreshold: 15,
    lastUpdated: "4 hours ago",
  },
  {
    id: "chc-med-7",
    name: "Zinc Sulfate 20mg",
    category: "Pediatric Care",
    facility: "Dwariknagar Rural Hospital",
    quantity: 0,
    unit: "Strips",
    minThreshold: 25,
    lastUpdated: "5 hours ago",
  },
];

function getStockStatus(quantity: number, minThreshold = 25) {
  if (quantity === 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-100 text-red-700 border border-red-200",
    };
  }
  if (quantity <= minThreshold) {
    return {
      label: "Low Stock",
      className: "bg-amber-100 text-amber-800 border border-amber-200",
    };
  }
  return {
    label: "Available",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  };
}

export function MedicineAvailabilityPage() {
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
    return `medexa_medicines_${rolePrefix}_${facilitySlug}`;
  }, [isDistrict, activeFacility]);

  const [medicines, setMedicines] = useState<FacilityMedicine[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    const defaults = isDistrict ? DEFAULT_DISTRICT_MEDICINES : DEFAULT_CHC_MEDICINES;
    return defaults.map((m) => ({ ...m, facility: activeFacility }));
  });

  // Keep saved when list changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(medicines));
    } catch (e) {
      console.warn("Could not save medicines to localStorage:", e);
    }
  }, [medicines, storageKey]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Add Medicine Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedCategory, setNewMedCategory] = useState("Antibiotics");
  const [newMedQuantity, setNewMedQuantity] = useState<number>(50);
  const [newMedUnit, setNewMedUnit] = useState("Strips");
  const [newMedThreshold, setNewMedThreshold] = useState<number>(20);

  // Edit Medicine Modal State
  const [editingMed, setEditingMed] = useState<FacilityMedicine | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(20);

  const categories = useMemo(() => {
    const cats = new Set(medicines.map((m) => m.category));
    return ["ALL", ...Array.from(cats)];
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const matchesSearch = `${medicine.name} ${medicine.category} ${medicine.facility}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCat = categoryFilter === "ALL" || medicine.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [medicines, search, categoryFilter]);

  const available = medicines.filter((m) => m.quantity > (m.minThreshold || 25)).length;
  const lowStock = medicines.filter(
    (m) => m.quantity > 0 && m.quantity <= (m.minThreshold || 25)
  ).length;
  const outOfStock = medicines.filter((m) => m.quantity === 0).length;

  const handleQuickAdjust = (id: string, delta: number) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = Math.max(0, m.quantity + delta);
        return {
          ...m,
          quantity: updated,
          lastUpdated: "Just now",
        };
      })
    );
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newMedicine: FacilityMedicine = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      category: newMedCategory,
      facility: activeFacility,
      quantity: Math.max(0, newMedQuantity),
      unit: newMedUnit,
      minThreshold: Math.max(1, newMedThreshold),
      lastUpdated: "Just now",
    };

    setMedicines((prev) => [newMedicine, ...prev]);
    setIsAddModalOpen(false);
    setNewMedName("");
    setNewMedQuantity(50);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;

    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id !== editingMed.id) return m;
        return {
          ...m,
          quantity: Math.max(0, editQuantity),
          minThreshold: Math.max(1, editThreshold),
          lastUpdated: "Just now",
        };
      })
    );

    setEditingMed(null);
  };

  const handleDeleteMedicine = (id: string) => {
    if (window.confirm("Remove this medicine from the facility inventory?")) {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset medicine inventory to initial standard roster for this facility?")) {
      const defaults = isDistrict ? DEFAULT_DISTRICT_MEDICINES : DEFAULT_CHC_MEDICINES;
      const resetList = defaults.map((m) => ({ ...m, facility: activeFacility }));
      setMedicines(resetList);
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
                {isDistrict ? "Regional Hospital Pharmacy Command" : "CHC Central Drug Store"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-on-surface">
                Medicine Availability & Inventory
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-on-surface-variant">
                Live pharmaceutical stock tracking for <strong className="text-on-surface">{activeFacility}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition"
                title="Reset to facility default stock"
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
                <span>Add Medicine</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-6">
          {/* SUMMARY CARDS */}
          <div className="grid gap-5 md:grid-cols-3">
            <SummaryCard
              title="Available In Stock"
              value={available}
              icon="check_circle"
              colorClass="bg-emerald-100 text-emerald-800"
            />
            <SummaryCard
              title="Low Stock Alert"
              value={lowStock}
              icon="warning"
              colorClass="bg-amber-100 text-amber-800"
            />
            <SummaryCard
              title="Out of Stock"
              value={outOfStock}
              icon="error"
              colorClass="bg-red-100 text-red-700"
              danger
            />
          </div>

          {/* INVENTORY TABLE & CONTROLS */}
          <div className="rounded-3xl border border-outline-variant bg-surface p-5 md:p-7 shadow-xs">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-outline-variant/60 pb-5">
              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  Facility Stock Roster
                </h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Manage inventory levels, adjust stock counts, or register new pharmaceuticals.
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
                    placeholder="Search medicine or brand..."
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
                      {c === "ALL" ? "All Categories" : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TABLE */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-4 py-3">Medicine & Strength</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Current Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Quick Adjust</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/40">
                  {filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-on-surface-variant">
                        No medicines match your search criteria. Click "+ Add Medicine" to register one.
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map((medicine) => {
                      const status = getStockStatus(medicine.quantity, medicine.minThreshold);

                      return (
                        <tr
                          key={medicine.id}
                          className="hover:bg-surface-container/40 transition"
                        >
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-on-surface text-sm block">
                              {medicine.name}
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              Threshold: &le; {medicine.minThreshold || 25} {medicine.unit}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="inline-block rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                              {medicine.category}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-bold text-on-surface text-sm">
                            {medicine.quantity} <span className="text-xs font-normal text-on-surface-variant">{medicine.unit}</span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          {/* Quick Adjust Buttons */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(medicine.id, -5)}
                                className="h-7 w-7 rounded-lg border border-outline-variant bg-surface font-bold text-xs hover:bg-surface-container text-on-surface transition"
                                title="Subtract 5"
                              >
                                -5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(medicine.id, -1)}
                                className="h-7 w-7 rounded-lg border border-outline-variant bg-surface font-bold text-xs hover:bg-surface-container text-on-surface transition"
                                title="Subtract 1"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(medicine.id, 1)}
                                className="h-7 w-7 rounded-lg border border-outline-variant bg-surface font-bold text-xs hover:bg-surface-container text-on-surface transition"
                                title="Add 1"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(medicine.id, 10)}
                                className="h-7 w-7 rounded-lg border border-outline-variant bg-surface font-bold text-xs hover:bg-surface-container text-on-surface transition"
                                title="Add 10"
                              >
                                +10
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-on-surface-variant">
                            {medicine.lastUpdated}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMed(medicine);
                                  setEditQuantity(medicine.quantity);
                                  setEditThreshold(medicine.minThreshold || 25);
                                }}
                                className="inline-flex items-center gap-0.5 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container transition"
                                title="Edit stock quantity"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteMedicine(medicine.id)}
                                className="rounded-lg p-1 text-on-surface-variant hover:bg-red-50 hover:text-red-700 transition"
                                title="Delete item"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ADD MEDICINE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">medication</span>
                <span>Add Medicine to Inventory</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Medicine Name & Strength *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ciprofloxacin 500mg"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Therapeutic Category
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Antibiotics"
                    value={newMedCategory}
                    onChange={(e) => setNewMedCategory(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Unit Type
                  </label>
                  <select
                    value={newMedUnit}
                    onChange={(e) => setNewMedUnit(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  >
                    <option value="Strips">Strips</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Vials">Vials</option>
                    <option value="Ampoules">Ampoules</option>
                    <option value="Packets">Packets</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMedQuantity}
                    onChange={(e) => setNewMedQuantity(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMedThreshold}
                    onChange={(e) => setNewMedThreshold(parseInt(e.target.value) || 20)}
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
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEDICINE MODAL */}
      {editingMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <h3 className="text-base font-bold text-on-surface">
                Update Stock: {editingMed.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMed(null)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Current Stock Quantity ({editingMed.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-sm font-bold text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(parseInt(e.target.value) || 20)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-xs hover:bg-primary/90"
                >
                  Update Stock
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