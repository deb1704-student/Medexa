import { useState, useEffect, useMemo } from "react";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { PortalHeader } from "@/components/common/PortalHeader";
import { useReferralAuth } from "@/sync/referralAuth";
import { db, type AshaMedicineStockItem } from "@/sync/db";
import { useLanguageStore } from "@/i18n/useLanguageStore";

const DEFAULT_ASHA_MEDICINES: Omit<AshaMedicineStockItem, "id" | "lastUpdated">[] = [
  {
    name: "IFA Tablets (Iron & Folic Acid)",
    category: "Maternal & Child Health",
    quantity: 150,
    unit: "Strips",
    threshold: 30,
    batchNumber: "IFA-2026-B8",
    expiryDate: "2027-08",
  },
  {
    name: "ORS Packets (Oral Rehydration Salts)",
    category: "Essential / Diarrhea",
    quantity: 45,
    unit: "Sachets",
    threshold: 20,
    batchNumber: "ORS-WB-102",
    expiryDate: "2027-11",
  },
  {
    name: "Zinc Sulfate Tablets (20mg)",
    category: "Child Health",
    quantity: 80,
    unit: "Strips",
    threshold: 25,
    batchNumber: "ZN-2026-44",
    expiryDate: "2027-06",
  },
  {
    name: "Paracetamol Tablets (500mg)",
    category: "Fever & Pain",
    quantity: 120,
    unit: "Strips",
    threshold: 40,
    batchNumber: "PCM-2026-91",
    expiryDate: "2028-01",
  },
  {
    name: "Mala-N (Oral Contraceptive Pills)",
    category: "Family Planning",
    quantity: 60,
    unit: "Cycles",
    threshold: 15,
    batchNumber: "MLN-2025-72",
    expiryDate: "2026-12",
  },
  {
    name: "Nischay Pregnancy Test Kits",
    category: "Diagnostic / Maternal",
    quantity: 25,
    unit: "Kits",
    threshold: 10,
    batchNumber: "NSC-2026-03",
    expiryDate: "2027-04",
  },
  {
    name: "Disposable Delivery Kits (DDK)",
    category: "Obstetric Emergency",
    quantity: 12,
    unit: "Kits",
    threshold: 5,
    batchNumber: "DDK-WB-501",
    expiryDate: "2027-09",
  },
  {
    name: "Chloroquine / Antimalarial",
    category: "Vector Borne",
    quantity: 35,
    unit: "Strips",
    threshold: 15,
    batchNumber: "CQ-2026-19",
    expiryDate: "2027-05",
  },
];

export function AshaMedicineAvailabilityPage() {
  const { ashaUser, logoutAsha } = useReferralAuth();
  const { tPortal, language } = useLanguageStore();

  const [medicines, setMedicines] = useState<AshaMedicineStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AshaMedicineStockItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    category: "Maternal & Child Health",
    quantity: 50,
    unit: "Strips",
    threshold: 15,
    batchNumber: "",
    expiryDate: "",
  });

  // Seed & load stock from Dexie
  async function loadStock() {
    try {
      setLoading(true);
      const existing = await db.ashaMedicineStock.toArray();
      if (existing.length === 0) {
        // Seed default 8 ASHA medicines
        const seeded: AshaMedicineStockItem[] = DEFAULT_ASHA_MEDICINES.map((m, idx) => ({
          ...m,
          id: `asha-med-${idx + 1}`,
          lastUpdated: new Date().toISOString(),
        }));
        await db.ashaMedicineStock.bulkAdd(seeded);
        setMedicines(seeded);
      } else {
        setMedicines(existing);
      }
    } catch (err) {
      console.error("Failed to load ASHA medicine stock:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStock();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(medicines.map((m) => m.category));
    return ["ALL", ...Array.from(set)];
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase()) ||
        (m.batchNumber && m.batchNumber.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === "ALL" || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, search, selectedCategory]);

  const stats = useMemo(() => {
    const total = medicines.length;
    const lowStock = medicines.filter((m) => m.quantity > 0 && m.quantity <= m.threshold).length;
    const outOfStock = medicines.filter((m) => m.quantity === 0).length;
    const adequate = medicines.filter((m) => m.quantity > m.threshold).length;
    return { total, lowStock, outOfStock, adequate };
  }, [medicines]);

  const handleOpenEdit = (item: AshaMedicineStockItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      threshold: item.threshold,
      batchNumber: item.batchNumber || "",
      expiryDate: item.expiryDate || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const updated: AshaMedicineStockItem = {
      ...selectedItem,
      name: formData.name,
      category: formData.category,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      threshold: Number(formData.threshold),
      batchNumber: formData.batchNumber,
      expiryDate: formData.expiryDate,
      lastUpdated: new Date().toISOString(),
    };

    await db.ashaMedicineStock.put(updated);
    setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      category: "Maternal & Child Health",
      quantity: 50,
      unit: "Strips",
      threshold: 15,
      batchNumber: "",
      expiryDate: "",
    });
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newItem: AshaMedicineStockItem = {
      id: `asha-med-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category,
      quantity: Number(formData.quantity) || 0,
      unit: formData.unit || "Units",
      threshold: Number(formData.threshold) || 10,
      batchNumber: formData.batchNumber,
      expiryDate: formData.expiryDate,
      lastUpdated: new Date().toISOString(),
    };

    await db.ashaMedicineStock.add(newItem);
    setMedicines((prev) => [...prev, newItem]);
    setAddModalOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Remove this medicine from ASHA stock inventory?")) return;
    await db.ashaMedicineStock.delete(id);
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    setEditModalOpen(false);
  };

  const handleQuickAdjust = async (item: AshaMedicineStockItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    const updated: AshaMedicineStockItem = {
      ...item,
      quantity: newQty,
      lastUpdated: new Date().toISOString(),
    };
    await db.ashaMedicineStock.put(updated);
    setMedicines((prev) => prev.map((m) => (m.id === item.id ? updated : m)));
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <DashboardSidebar />

      <main className="min-h-screen md:ml-64 p-4 sm:p-6 md:p-8">
        {/* Portal Header with bell removed */}
        <PortalHeader
          portalName={tPortal("villageReferrals", "ASHA Village Portal", language)}
          portalIcon="volunteer_activism"
          tierBadge="ASHA Frontline Medicine Kit"
          themeColor="teal"
          user={ashaUser}
          onLogout={logoutAsha}
          allReferralsPath="/dashboard/referrals/asha"
          showNotificationsBell={false}
          actionButton={
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-on-primary shadow-xs transition hover:bg-primary-hover active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Add Medicine</span>
            </button>
          }
        />

        {/* Geographic context */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-primary font-medium">
            <span className="material-symbols-outlined text-base">medication</span>
            <span>
              <strong>Village Health Sub-Centre Kit:</strong> Daily Frontline Drug Stock & Essential Supplies (IndexedDB Persistent)
            </span>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
            {ashaUser?.facilityOrVillage || "Shibpur Village Health Sub-Centre"}
          </span>
        </div>

        {/* SUMMARY STATS CARDS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <div className="rounded-2xl border border-outline-variant bg-surface p-4 shadow-xs">
            <p className="text-xs font-medium text-on-surface-variant">Total Kit Items</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-on-surface">{stats.total}</span>
              <span className="material-symbols-outlined text-primary text-xl">inventory_2</span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4 shadow-xs">
            <p className="text-xs font-medium text-emerald-800">Adequate Stock</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-700">{stats.adequate}</span>
              <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 p-4 shadow-xs">
            <p className="text-xs font-medium text-amber-800">Low Stock Alert</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-700">{stats.lowStock}</span>
              <span className="material-symbols-outlined text-amber-600 text-xl">warning</span>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-50/50 p-4 shadow-xs">
            <p className="text-xs font-medium text-rose-800">Out of Stock</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-rose-700">{stats.outOfStock}</span>
              <span className="material-symbols-outlined text-rose-600 text-xl">error</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="rounded-2xl border border-outline-variant bg-surface p-4 sm:p-5 shadow-xs mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search essential medicine, category, or batch #..."
                className="w-full rounded-xl border border-outline-variant bg-background py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-on-surface-variant shrink-0">Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* INVENTORY TABLE */}
        <div className="rounded-2xl border border-outline-variant bg-surface shadow-xs overflow-hidden">
          <div className="border-b border-outline-variant px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">ASHA Drug Stock & Diagnostic Kits</h2>
              <p className="text-xs text-on-surface-variant">
                Official village kit items. Updates persist directly in local offline IndexedDB.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">
              Showing {filteredMedicines.length} of {medicines.length}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              Loading local medicine inventory...
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              No matching medicines found in kit.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                    <th className="px-5 py-3.5">Medicine / Item</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Batch / Expiry</th>
                    <th className="px-4 py-3.5 text-center">In Stock</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-center">Quick Adjust</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {filteredMedicines.map((item) => {
                    const isOut = item.quantity === 0;
                    const isLow = item.quantity > 0 && item.quantity <= item.threshold;

                    return (
                      <tr key={item.id} className="hover:bg-surface-container-lowest/50 transition">
                        <td className="px-5 py-4">
                          <p className="font-bold text-on-surface">{item.name}</p>
                          <p className="text-[11px] text-on-surface-variant">Min threshold: {item.threshold} {item.unit}</p>
                        </td>

                        <td className="px-4 py-4 text-on-surface-variant font-medium">
                          {item.category}
                        </td>

                        <td className="px-4 py-4 text-on-surface-variant">
                          <p className="font-mono">{item.batchNumber || "—"}</p>
                          <p className="text-[10px]">{item.expiryDate ? `Exp: ${item.expiryDate}` : "No expiry listed"}</p>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="font-bold text-sm text-on-surface">{item.quantity}</span>
                          <span className="text-[11px] text-on-surface-variant ml-1">{item.unit}</span>
                        </td>

                        <td className="px-4 py-4">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                              Low Stock (≤{item.threshold})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              Available
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center gap-1 border border-outline-variant rounded-lg p-0.5 bg-background">
                            <button
                              type="button"
                              onClick={() => handleQuickAdjust(item, -5)}
                              disabled={item.quantity === 0}
                              className="h-6 w-6 rounded flex items-center justify-center font-bold text-on-surface-variant hover:bg-surface hover:text-error disabled:opacity-30"
                              title="Dispense 5 units"
                            >
                              -5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjust(item, -1)}
                              disabled={item.quantity === 0}
                              className="h-6 w-6 rounded flex items-center justify-center font-bold text-on-surface-variant hover:bg-surface hover:text-error disabled:opacity-30"
                              title="Dispense 1 unit"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjust(item, 1)}
                              className="h-6 w-6 rounded flex items-center justify-center font-bold text-on-surface-variant hover:bg-surface hover:text-primary"
                              title="Add 1 unit"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjust(item, 10)}
                              className="h-6 w-6 rounded flex items-center justify-center font-bold text-on-surface-variant hover:bg-surface hover:text-primary"
                              title="Add 10 units (Restock)"
                            >
                              +10
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/5 transition"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Edit Stock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* EDIT ITEM MODAL */}
        {editModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  <h3 className="text-base font-bold text-on-surface">Edit Medicine Stock</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Medicine / Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Unit</label>
                    <input
                      type="text"
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Quantity in Stock</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Low-Stock Alert Level</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="e.g. IFA-2026-B8"
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      placeholder="YYYY-MM"
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    className="text-error font-bold hover:underline"
                  >
                    Delete Item
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(false)}
                      className="rounded-xl border border-outline-variant px-3.5 py-2 font-bold text-on-surface hover:bg-surface-container"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-primary px-4 py-2 font-bold text-on-primary hover:bg-primary-hover"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD ITEM MODAL */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                  <h3 className="text-base font-bold text-on-surface">Add Medicine to ASHA Kit</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Medicine / Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Albendazole 400mg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                    >
                      <option value="Maternal & Child Health">Maternal & Child Health</option>
                      <option value="Essential / Diarrhea">Essential / Diarrhea</option>
                      <option value="Child Health">Child Health</option>
                      <option value="Fever & Pain">Fever & Pain</option>
                      <option value="Family Planning">Family Planning</option>
                      <option value="Diagnostic / Maternal">Diagnostic / Maternal</option>
                      <option value="Obstetric Emergency">Obstetric Emergency</option>
                      <option value="Vector Borne">Vector Borne</option>
                      <option value="Other Essential">Other Essential</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Unit</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Strips, Sachets, Kits"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Initial Quantity</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Low-Stock Alert Level</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="e.g. ALB-2026-01"
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      placeholder="YYYY-MM"
                      className="w-full rounded-xl border border-outline-variant bg-background p-2.5 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="rounded-xl border border-outline-variant px-3.5 py-2 font-bold text-on-surface hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-4 py-2 font-bold text-on-primary hover:bg-primary-hover"
                  >
                    Add Medicine
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
