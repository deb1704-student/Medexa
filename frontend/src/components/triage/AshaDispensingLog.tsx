import { useState, useEffect } from "react";
import { db, type DispensingLog } from "@/sync/db";
import { v4 as uuidv4 } from "uuid";

interface AshaDispensingLogProps {
  workerId: string;
  workerName?: string;
  defaultVillage?: string;
}

export function AshaDispensingLog({
  workerId,
  workerName = "ASHA Worker",
  defaultVillage = "Frontline Village",
}: AshaDispensingLogProps) {
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Female");
  const [village, setVillage] = useState(defaultVillage);
  const [reason, setReason] = useState("");
  const [medicinesGiven, setMedicinesGiven] = useState("");
  const [notes, setNotes] = useState("");

  // Vitals with Temperature in Fahrenheit (°F)
  const [tempF, setTempF] = useState("");
  const [spo2, setSpo2] = useState("");
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const [logs, setLogs] = useState<DispensingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load history from Dexie
  async function loadLogs() {
    try {
      setLoading(true);
      const items = await db.dispensingLogs.orderBy("recordedAt").reverse().toArray();
      setLogs(items);
    } catch (err) {
      console.error("Failed to load dispensing logs from Dexie:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim() || !age || !reason.trim()) {
      alert("Please enter patient name, age, and reason for medicine given.");
      return;
    }

    setSubmitting(true);
    try {
      const newLog: DispensingLog = {
        id: uuidv4(),
        patientName: patientName.trim(),
        age: Number(age) || 0,
        gender,
        village: village.trim() || defaultVillage,
        reasonForMedicine: reason.trim(),
        medicinesGiven: medicinesGiven.trim() || "Essential medicine kit supplies",
        notes: notes.trim() || undefined,
        vitals: {
          tempF: tempF ? parseFloat(tempF) : undefined,
          spo2: spo2 ? parseFloat(spo2) : undefined,
          bp: bp.trim() || undefined,
          pulse: pulse ? parseFloat(pulse) : undefined,
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
        },
        recordedBy: `${workerName} (${workerId})`,
        recordedAt: new Date().toISOString(),
      };

      await db.dispensingLogs.add(newLog);
      setLogs((prev) => [newLog, ...prev]);

      // Reset form
      setPatientName("");
      setAge("");
      setReason("");
      setMedicinesGiven("");
      setNotes("");
      setTempF("");
      setSpo2("");
      setBp("");
      setPulse("");
      setWeightKg("");

      setSuccessMessage(`Dispensing log recorded successfully for ${newLog.patientName}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Failed to save dispensing log:", err);
      alert("Error saving log to local storage.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteLog(id: string) {
    if (!window.confirm("Remove this entry from the daily dispensing log?")) return;
    try {
      await db.dispensingLogs.delete(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Failed to delete dispensing log:", err);
    }
  }

  const QUICK_REASONS = [
    "Mild Seasonal Fever",
    "Diarrhea & Dehydration",
    "Body Ache / Headache",
    "Iron Deficiency / Antenatal Supplement",
    "Pediatric Cough & Cold",
    "First Aid / Wound Dressing",
  ];

  const QUICK_MEDICINES = [
    "Paracetamol 500mg",
    "ORS Sachet (1 pkt)",
    "Zinc Sulfate 20mg",
    "IFA Tablets",
    "Mala-N Cycle",
    "Albendazole 400mg",
  ];

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="rounded-3xl border border-outline-variant bg-surface p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700">
              <span className="material-symbols-outlined text-2xl">medication_liquid</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-on-surface">
                  ASHA Daily Medicine Dispensing Log
                </h2>
                <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-800">
                  Frontline Care
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Log daily village medicine dispensing, frontline symptom relief, and vitals check (separate from hospital referrals).
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-on-surface-variant">Today's Entries: </span>
            <span className="text-sm font-bold text-teal-700">{logs.length} logged</span>
          </div>
        </div>

        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900">
            <span className="material-symbols-outlined text-emerald-700">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOG ENTRY FORM */}
        <form onSubmit={handleSaveLog} className="mt-6 space-y-5 text-xs">
          {/* PATIENT INFO */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maya Mondal"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Age *
              </label>
              <input
                type="number"
                min="0"
                max="120"
                required
                placeholder="Age in yrs"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium text-on-surface outline-none focus:border-primary transition"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Village / Ward
            </label>
            <input
              type="text"
              placeholder="e.g. Shibpur East"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
            />
          </div>

          {/* REASON FOR MEDICINE */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Reason for Medicine Given / Presenting Complaint *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describe presenting symptoms, pain, or chief complaint (e.g. headache with mild fever since morning, oral rehydration for mild loose motion)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary resize-none leading-relaxed transition"
            />
            {/* Quick reason chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant self-center mr-1">Quick Select:</span>
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason((prev) => (prev ? `${prev}, ${r}` : r))}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-2 py-0.5 text-[11px] font-medium text-on-surface hover:bg-surface-container hover:text-primary transition"
                >
                  + {r}
                </button>
              ))}
            </div>
          </div>

          {/* VITALS (WITH FAHRENHEIT TEMPERATURE) */}
          <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-low/40 p-4">
            <p className="text-xs font-bold text-on-surface mb-2.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-teal-700">vital_signs</span>
              <span>Patient Vitals Checked (Optional Frontline Check):</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Temperature in Fahrenheit */}
              <div>
                <label className="block font-bold text-on-surface-variant text-[11px] mb-1">
                  Temp (°F)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={tempF}
                    onChange={(e) => setTempF(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 pr-7 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant font-bold">
                    °F
                  </span>
                </div>
              </div>

              {/* SpO2 */}
              <div>
                <label className="block font-bold text-on-surface-variant text-[11px] mb-1">
                  SpO2 (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    placeholder="98"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 pr-6 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant font-bold">
                    %
                  </span>
                </div>
              </div>

              {/* Blood Pressure */}
              <div>
                <label className="block font-bold text-on-surface-variant text-[11px] mb-1">
                  BP (mmHg)
                </label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
                />
              </div>

              {/* Pulse */}
              <div>
                <label className="block font-bold text-on-surface-variant text-[11px] mb-1">
                  Pulse (bpm)
                </label>
                <input
                  type="number"
                  placeholder="76"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block font-bold text-on-surface-variant text-[11px] mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="52"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* MEDICINES GIVEN */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Medicines Given & Dosage
            </label>
            <input
              type="text"
              placeholder="e.g. Paracetamol 500mg (2 tabs, 1 sos), ORS (1 packet instructions given)"
              value={medicinesGiven}
              onChange={(e) => setMedicinesGiven(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
            />
            {/* Quick medicine chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant self-center mr-1">Quick Add:</span>
              {QUICK_MEDICINES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMedicinesGiven((prev) => (prev ? `${prev}, ${m}` : m))}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-2 py-0.5 text-[11px] font-medium text-on-surface hover:bg-surface-container hover:text-teal-700 transition"
                >
                  + {m}
                </button>
              ))}
            </div>
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              ASHA Observations / Instructions to Patient
            </label>
            <input
              type="text"
              placeholder="e.g. Advised plenty of fluids and rest. Follow up tomorrow if fever does not subside."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium text-on-surface placeholder:font-normal placeholder:text-slate-400 placeholder:text-xs outline-none focus:border-primary transition"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-2xl bg-teal-800 px-6 py-3 font-bold text-white shadow-md hover:bg-teal-900 transition active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              <span>{submitting ? "Saving Entry..." : "Save Daily Dispensing Log"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* DISPENSING HISTORY TABLE */}
      <div className="rounded-3xl border border-outline-variant bg-surface p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Daily Dispensing Records & History
            </h3>
            <p className="text-xs text-on-surface-variant">
              IndexedDB local offline storage — preserved across browser sessions.
            </p>
          </div>
          <span className="text-xs font-semibold text-teal-700">
            {logs.length} Total Records
          </span>
        </div>

        {loading ? (
          <p className="text-center py-8 text-xs text-on-surface-variant">Loading records...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline-variant">assignment</span>
            <p className="mt-2 text-xs font-medium">No dispensing entries logged yet today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Age / Gender</th>
                  <th className="px-4 py-3">Reason / Complaint</th>
                  <th className="px-4 py-3">Vitals</th>
                  <th className="px-4 py-3">Medicine Given</th>
                  <th className="px-4 py-3">Logged At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-lowest/50 transition">
                    <td className="px-4 py-3.5 font-bold text-on-surface">
                      {log.patientName}
                      <p className="text-[10px] font-normal text-on-surface-variant">{log.village}</p>
                    </td>

                    <td className="px-4 py-3.5 text-on-surface-variant">
                      {log.age}y • {log.gender || "—"}
                    </td>

                    <td className="px-4 py-3.5 text-on-surface font-medium max-w-[200px]">
                      {log.reasonForMedicine}
                    </td>

                    <td className="px-4 py-3.5 text-on-surface-variant text-[11px]">
                      {log.vitals?.tempF && (
                        <span className="inline-block mr-1 font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                          {log.vitals.tempF}°F
                        </span>
                      )}
                      {log.vitals?.spo2 && (
                        <span className="inline-block mr-1 font-semibold text-teal-900 bg-teal-100 px-1.5 py-0.5 rounded">
                          SpO2 {log.vitals.spo2}%
                        </span>
                      )}
                      {log.vitals?.bp && (
                        <span className="inline-block font-medium">BP {log.vitals.bp}</span>
                      )}
                      {!log.vitals?.tempF && !log.vitals?.spo2 && !log.vitals?.bp && "—"}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-teal-800 max-w-[180px]">
                      {log.medicinesGiven || "—"}
                    </td>

                    <td className="px-4 py-3.5 text-[11px] text-on-surface-variant">
                      {new Date(log.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-error hover:underline text-xs font-bold"
                        title="Remove entry"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
