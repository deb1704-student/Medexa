import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { useAuth } from "@/auth/auth";
import { useLanguageStore } from "@/i18n/useLanguageStore";

interface PatientFollowUpHistory {
  date: string;
  stage: string;
  notes: string;
}

interface FollowUpPatient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  condition: string;
  risk: "High" | "Moderate";
  followUp: string;
  facility: string;
  status: "Due Today" | "Scheduled" | "Overdue";
  phone: string;
  abhaId: string;
  village: string;
  assignedDoctor: string;
  clinicalNotes: string;
  riskFactors: string[];
  vitals: {
    bp: string;
    pulse: string;
    spo2: string;
    temp: string;
    weight: string;
  };
  history: PatientFollowUpHistory[];
}

function getScopedPatients(facility: string, role?: string): FollowUpPatient[] {
  if (role === "DISTRICT") {
    return [
      {
        id: "P-DIST-01",
        name: "Bikash Ghosh",
        age: 58,
        gender: "Male",
        condition: "Post-Myocardial Infarction Tertiary Care",
        risk: "High",
        followUp: "Today",
        facility: facility,
        status: "Due Today",
        phone: "+91 98450 11223",
        abhaId: "91-1029-4458-1002",
        village: "Rampur, Sector 4",
        assignedDoctor: "Dr. A. Sen (Chief Specialist)",
        clinicalNotes: "Stent placed 3 weeks ago. Patient reports occasional mild dyspnea on exertion. Continued dual antiplatelet therapy and strict salt restriction advised.",
        riskFactors: ["Hypertension Grade II", "History of STEMI", "Smoker (Former)", "Elevated LDL"],
        vitals: {
          bp: "142/90 mmHg",
          pulse: "78 bpm",
          spo2: "96%",
          temp: "98.6°F",
          weight: "68 kg",
        },
        history: [
          { date: "2026-08-15", stage: "Admission", notes: "Emergency PCI procedure completed successfully." },
          { date: "2026-08-22", stage: "Discharge Review", notes: "Discharged on aspirin, clopidogrel, atorvastatin." },
          { date: "2026-09-02", stage: "Follow-up Call", notes: "ASHA confirmed medication compliance." },
        ],
      },
      {
        id: "P-DIST-02",
        name: "Priya Murmu",
        age: 24,
        gender: "Female",
        condition: "Severe Eclampsia & Post-Operative ICU Care",
        risk: "High",
        followUp: "Today",
        facility: facility,
        status: "Due Today",
        phone: "+91 98322 88419",
        abhaId: "91-3829-1192-3401",
        village: "Bishnupur North",
        assignedDoctor: "Dr. K. Bannerjee (OB/GYN Specialist)",
        clinicalNotes: "Post-emergency LSCS following eclamptic convulsions at 36 weeks. Blood pressure stabilized on labetalol; monitored for proteinuria and postpartum complications.",
        riskFactors: ["Severe Preeclampsia", "Postpartum Day 10", "Proteinuria 3+", "Borderline Thrombocytopenia"],
        vitals: {
          bp: "146/94 mmHg",
          pulse: "88 bpm",
          spo2: "98%",
          temp: "98.4°F",
          weight: "59 kg",
        },
        history: [
          { date: "2026-08-28", stage: "Emergency Escalation", notes: "Referred from Joypur CHC with severe headache and hyperreflexia." },
          { date: "2026-08-29", stage: "Emergency LSCS", notes: "Delivered healthy male infant; MgSO4 infusion administered." },
          { date: "2026-09-04", stage: "ICU Step-down", notes: "Transferred to post-natal high-risk recovery ward." },
        ],
      },
      {
        id: "P-DIST-03",
        name: "Subhash Chandra",
        age: 67,
        gender: "Male",
        condition: "Cardiac Ischemia with Refractory Heart Failure",
        risk: "High",
        followUp: "Yesterday",
        facility: facility,
        status: "Overdue",
        phone: "+91 98310 99401",
        abhaId: "91-4402-9918-7712",
        village: "Joypur Rural, Ward 2",
        assignedDoctor: "Dr. S. Chatterjee (Cardiologist)",
        clinicalNotes: "NYHA Class III heart failure. Missed scheduled echocardiogram follow-up yesterday. Requires home visit by frontline team to verify diuretic therapy adherence.",
        riskFactors: ["NYHA Class III Heart Failure", "Bilateral Pedal Edema", "CKD Stage 3", "Age > 65"],
        vitals: {
          bp: "154/98 mmHg",
          pulse: "92 bpm",
          spo2: "93%",
          temp: "98.2°F",
          weight: "74 kg",
        },
        history: [
          { date: "2026-08-10", stage: "Diagnosis", notes: "Ejection fraction 32%; initiated on sacubitril/valsartan and torsemide." },
          { date: "2026-08-25", stage: "Follow-up", notes: "Edema reduced; potassium verified at 4.4 mEq/L." },
          { date: "2026-09-07", stage: "Scheduled Echo", notes: "Patient did not report to clinic; flagged overdue." },
        ],
      },
      {
        id: "P-DIST-04",
        name: "Meenakshi Das",
        age: 50,
        gender: "Female",
        condition: "Tertiary Oncology Referral Care",
        risk: "Moderate",
        followUp: "Tomorrow",
        facility: facility,
        status: "Scheduled",
        phone: "+91 98402 77102",
        abhaId: "91-8812-3301-4491",
        village: "Sonamukhi East",
        assignedDoctor: "Dr. M. Roy (Oncology Consultant)",
        clinicalNotes: "Post-chemotherapy cycle 3 evaluation. Monitoring complete blood count for neutropenia and managing mild nausea.",
        riskFactors: ["Chemotherapy Cycle 3", "Mild Anemia", "Immunocompromised Status"],
        vitals: {
          bp: "118/76 mmHg",
          pulse: "76 bpm",
          spo2: "99%",
          temp: "98.8°F",
          weight: "52 kg",
        },
        history: [
          { date: "2026-08-01", stage: "Initial Staging", notes: "Stage II carcinoma breast post-lumpectomy." },
          { date: "2026-08-20", stage: "Chemo Cycle 2", notes: "Tolerated well with supportive antiemetics." },
          { date: "2026-09-01", stage: "ASHA Check-in", notes: "No fever or mucosal ulcers reported." },
        ],
      },
    ];
  }

  if (role === "BLOCK") {
    return [
      {
        id: "P-BLK-01",
        name: "Rahul Sharma",
        age: 28,
        gender: "Male",
        condition: "Severe Asthma & Acute Respiratory Distress",
        risk: "High",
        followUp: "Today",
        facility: facility,
        status: "Due Today",
        phone: "+91 98301 23456",
        abhaId: "91-8842-1092-9901",
        village: "Rampur Village",
        assignedDoctor: "Dr. Anirban Roy (BHO-WB-204)",
        clinicalNotes: "Presented with severe wheezing and tachypnea. Responded well to nebulized salbutamol + ipratropium. Prescribed budesonide inhaler; requires technique verification.",
        riskFactors: ["Acute Bronchospasm", "Frequent Nocturnal Awakening", "Uncontrolled Asthma Symptoms"],
        vitals: {
          bp: "124/80 mmHg",
          pulse: "94 bpm",
          spo2: "97%",
          temp: "98.6°F",
          weight: "62 kg",
        },
        history: [
          { date: "2026-08-29", stage: "CHC Intake", notes: "Oxygen support and nebulization administered." },
          { date: "2026-09-03", stage: "Stabilization", notes: "Peak flow increased from 210 to 380 L/min." },
          { date: "2026-09-08", stage: "Day 5 Follow-up", notes: "Inhaler compliance review scheduled." },
        ],
      },
      {
        id: "P-BLK-02",
        name: "Anita Devi",
        age: 32,
        gender: "Female",
        condition: "Preeclampsia & Gestational Hypertension",
        risk: "High",
        followUp: "Yesterday",
        facility: facility,
        status: "Overdue",
        phone: "+91 98765 43210",
        abhaId: "91-5521-9984-2201",
        village: "Joypur Rural",
        assignedDoctor: "Dr. P. Mukherjee (BHO-WB-205)",
        clinicalNotes: "Gravida 3 Para 2 at 32 weeks gestation. Sustained BP > 150/95 mmHg with persistent pedal edema. High risk for rapid progression; alert sent to ASHA for immediate home visit.",
        riskFactors: ["High-Risk Pregnancy (32 Weeks)", "Sustained Systolic BP > 150", "Bilateral Lower Limb Edema", "Proteinuria 1+"],
        vitals: {
          bp: "152/98 mmHg",
          pulse: "86 bpm",
          spo2: "98%",
          temp: "98.4°F",
          weight: "65 kg",
        },
        history: [
          { date: "2026-08-20", stage: "Frontline Screening", notes: "ASHA identified elevated BP at home check." },
          { date: "2026-08-24", stage: "CHC Evaluation", notes: "Initiated on Labetalol 100mg BD. Baseline labs ordered." },
          { date: "2026-09-07", stage: "Overdue Follow-up", notes: "Missed weekly BP review; escalated for frontline outreach." },
        ],
      },
      {
        id: "P-BLK-03",
        name: "Gopal Mondal",
        age: 61,
        gender: "Male",
        condition: "COPD Acute Exacerbation & Inpatient Care",
        risk: "High",
        followUp: "Tomorrow",
        facility: facility,
        status: "Scheduled",
        phone: "+91 98311 55678",
        abhaId: "91-9921-4478-6623",
        village: "Belur Sector 2",
        assignedDoctor: "Dr. Anirban Roy (BHO-WB-204)",
        clinicalNotes: "Chronic smoker with COPD exacerbation following respiratory infection. Completed 5-day course of oral steroids and antibiotics. Monitoring exercise tolerance.",
        riskFactors: ["Severe Airway Obstruction", "40 Pack-Year Smoking History", "Cor Pulmonale Risk"],
        vitals: {
          bp: "136/84 mmHg",
          pulse: "82 bpm",
          spo2: "94%",
          temp: "98.2°F",
          weight: "56 kg",
        },
        history: [
          { date: "2026-08-26", stage: "PHC Admission", notes: "Admitted with purulent sputum and marked dyspnea." },
          { date: "2026-08-30", stage: "Discharge", notes: "Discharged on long-acting bronchodilator therapy." },
          { date: "2026-09-04", stage: "ASHA Check", notes: "Sputum clear; breathing improved at rest." },
        ],
      },
      {
        id: "P-BLK-04",
        name: "Sunita Roy",
        age: 45,
        gender: "Female",
        condition: "Uncontrolled Type 2 Diabetes with Neuropathy",
        risk: "Moderate",
        followUp: "Sep 12",
        facility: facility,
        status: "Scheduled",
        phone: "+91 98452 33441",
        abhaId: "91-7712-4458-9904",
        village: "Sonamukhi Rural",
        assignedDoctor: "Dr. P. Mukherjee (BHO-WB-205)",
        clinicalNotes: "Fasting blood sugar 210 mg/dL with burning sensation in bilateral soles. Dosage of metformin adjusted and lifestyle counseling provided.",
        riskFactors: ["HbA1c 9.4%", "Peripheral Sensory Neuropathy", "Obesity (BMI 29.2)"],
        vitals: {
          bp: "130/82 mmHg",
          pulse: "74 bpm",
          spo2: "98%",
          temp: "98.6°F",
          weight: "72 kg",
        },
        history: [
          { date: "2026-08-12", stage: "Screening", notes: "NCD clinic screening revealed elevated capillary glucose." },
          { date: "2026-08-15", stage: "Lab Confirmation", notes: "HbA1c confirmed at 9.4%; foot examination performed." },
          { date: "2026-09-01", stage: "Medication Review", notes: "Added glimepiride 1mg morning dose." },
        ],
      },
    ];
  }

  // ASHA Village Tier
  return [
    {
      id: "P-VIL-01",
      name: "Anita Devi",
      age: 32,
      gender: "Female",
      condition: "High-Risk Pregnancy (Preeclampsia)",
      risk: "High",
      followUp: "Today",
      facility: facility,
      status: "Due Today",
      phone: "+91 98765 43210",
      abhaId: "91-5521-9984-2201",
      village: "Joypur Rural",
      assignedDoctor: "Dr. P. Mukherjee (CHC MOIC)",
      clinicalNotes: "Regular home visits required. Check blood pressure, fetal heart sounds, and signs of warning (headache, epigastric pain, visual disturbances).",
      riskFactors: ["Preeclampsia", "32 Weeks Gestation", "Hypertension"],
      vitals: {
        bp: "152/98 mmHg",
        pulse: "86 bpm",
        spo2: "98%",
        temp: "98.4°F",
        weight: "65 kg",
      },
      history: [
        { date: "2026-08-20", stage: "Home Visit", notes: "BP measured high; advised urgent CHC visit." },
        { date: "2026-09-01", stage: "Medicine Delivery", notes: "Handed over 14-day supply of labetalol." },
      ],
    },
    {
      id: "P-VIL-02",
      name: "Rahul Sharma",
      age: 28,
      gender: "Male",
      condition: "Severe Asthma & Respiratory Follow-up",
      risk: "High",
      followUp: "Tomorrow",
      facility: facility,
      status: "Scheduled",
      phone: "+91 98301 23456",
      abhaId: "91-8842-1092-9901",
      village: "Rampur Village",
      assignedDoctor: "Dr. Anirban Roy (PHC Doctor)",
      clinicalNotes: "Verify correct usage of inhaler spacer device. Ensure patient keeps emergency bronchodilator accessible.",
      riskFactors: ["Severe Asthma", "Dust Allergen Exposure"],
      vitals: {
        bp: "124/80 mmHg",
        pulse: "94 bpm",
        spo2: "97%",
        temp: "98.6°F",
        weight: "62 kg",
      },
      history: [
        { date: "2026-08-29", stage: "Referral", notes: "Accompanied patient to CHC for emergency nebulization." },
        { date: "2026-09-04", stage: "Check-in", notes: "No nighttime wheezing reported." },
      ],
    },
    {
      id: "P-VIL-03",
      name: "Maya Bauri",
      age: 44,
      gender: "Female",
      condition: "Severe Anemia (Hb 6.8 g/dL)",
      risk: "High",
      followUp: "Yesterday",
      facility: facility,
      status: "Overdue",
      phone: "+91 98322 10998",
      abhaId: "91-6621-0091-8812",
      village: "Sonamukhi East",
      assignedDoctor: "Dr. Anirban Roy (PHC Doctor)",
      clinicalNotes: "Severe nutritional anemia. Iron sucrose infusion completed at PHC. Home monitoring for pallor, breathlessness, and dietary iron intake.",
      riskFactors: ["Hb < 7 g/dL", "Severe Fatigue", "Nutritional Anemia"],
      vitals: {
        bp: "106/68 mmHg",
        pulse: "96 bpm",
        spo2: "96%",
        temp: "98.2°F",
        weight: "47 kg",
      },
      history: [
        { date: "2026-08-18", stage: "Screening", notes: "Hemoglobin test showed 6.8 g/dL; escorted to PHC." },
        { date: "2026-08-22", stage: "IV Iron", notes: "Completed 2 doses of intravenous iron sucrose." },
        { date: "2026-09-07", stage: "Due Visit", notes: "Patient was away from home; follow-up overdue." },
      ],
    },
  ];
}

function statusStyle(status: FollowUpPatient["status"]) {
  if (status === "Overdue") {
    return "bg-red-100 text-red-700 border border-red-300";
  }

  if (status === "Due Today") {
    return "bg-yellow-100 text-yellow-800 border border-yellow-300";
  }

  return "bg-emerald-100 text-emerald-800 border border-emerald-300";
}

export function HighRiskFollowUpPage() {
  const { user } = useAuth();
  const { tPortal, language } = useLanguageStore();
  const [selectedPatient, setSelectedPatient] = useState<FollowUpPatient | null>(null);

  const activeFacility = useMemo(() => {
    if (user?.facilityOrVillage) return user.facilityOrVillage;
    if (user?.facility) return user.facility;
    if (user?.role === "DISTRICT") return "Bankura Regional Hospital";
    if (user?.role === "BLOCK") return "Belur Community Health Centre (CHC)";
    return "Rampur Village / Belur Sector";
  }, [user]);

  const patients = useMemo(() => {
    return getScopedPatients(activeFacility, user?.role);
  }, [activeFacility, user?.role]);

  const dueToday = patients.filter((p) => p.status === "Due Today").length;
  const overdue = patients.filter((p) => p.status === "Overdue").length;
  const scheduled = patients.filter((p) => p.status === "Scheduled").length;

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* MAIN CONTENT */}
      <main className="min-h-screen md:ml-64">
        {/* HEADER */}
        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {user?.role === "DISTRICT" ? "Regional Hospital Command" : user?.role === "BLOCK" ? "Community Health Centre (CHC) Office" : "ASHA Frontline Portal"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-on-surface">
                {tPortal("highRiskTitle", "High-Risk Follow-up", language)}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {tPortal("highRiskSubtitle", "Prioritize patients requiring immediate clinical attention and monitor adherence across the care continuum.", language)}
              </p>
            </div>

            {/* Scope Badge */}
            <div className="self-start sm:self-auto rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5">
              <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">
                Scoped Facility Jurisdiction
              </span>
              <span className="text-xs font-bold text-primary flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-sm">domain</span>
                <span className="truncate max-w-[240px]">{activeFacility}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-8">
          {/* SUMMARY CARDS */}
          <div className="grid gap-5 md:grid-cols-3">
            <SummaryCard
              title={tPortal("dueToday", "Due for Follow-Up Today")}
              value={dueToday}
              icon="today"
              colorClass="bg-amber-100 text-amber-800"
            />
            <SummaryCard
              title={tPortal("highRisk", "Scheduled")}
              value={scheduled}
              icon="event_available"
              colorClass="bg-emerald-100 text-emerald-800"
            />
            <SummaryCard
              title={tPortal("overdue", "Overdue")}
              value={overdue}
              icon="priority_high"
              colorClass="bg-red-100 text-red-700"
              danger
            />
          </div>

          {/* PATIENT LIST */}
          <div className="rounded-3xl border border-outline-variant bg-surface p-5 md:p-7 shadow-xs">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-outline-variant/60">
              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  {tPortal("totalHighRisk", "Patients Requiring Follow-up")}
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Showing records assigned strictly to <strong className="text-on-surface">{activeFacility}</strong>
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-container border border-outline-variant self-start">
                {patients.length} Active Records
              </span>
            </div>

            {/* COLUMN HEADERS */}
            <div className="mb-3 hidden px-5 lg:grid lg:grid-cols-[minmax(220px,1.3fr)_100px_110px_minmax(180px,1.1fr)_260px] lg:items-center lg:gap-4">
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("patientAndGeo", "Patient")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("triageLevel", "Risk")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("lastContact", "Follow-up")}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("facilities", "Facility")}
              </div>
              <div className="text-right text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {tPortal("status", "Status & Actions")}
              </div>
            </div>

            {/* PATIENT ROWS */}
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="rounded-2xl border border-outline-variant p-5 transition hover:shadow-sm hover:border-primary/40 bg-surface-container-lowest"
                >
                  <div className="grid items-center gap-4 lg:grid-cols-[minmax(220px,1.3fr)_100px_110px_minmax(180px,1.1fr)_260px]">
                    {/* PATIENT */}
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
                        <span className="material-symbols-outlined text-xl">person</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface text-sm">
                          {patient.name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {patient.id} · {patient.age} yrs · {patient.gender}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-primary">
                          {patient.condition}
                        </p>
                      </div>
                    </div>

                    {/* RISK */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Risk:</span>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          patient.risk === "High"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {patient.risk}
                      </span>
                    </div>

                    {/* FOLLOW-UP */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Follow-up:</span>
                      <span className="text-xs font-bold text-on-surface">
                        {patient.followUp}
                      </span>
                    </div>

                    {/* FACILITY */}
                    <div>
                      <span className="text-[11px] text-on-surface-variant font-bold lg:hidden mr-1">Facility:</span>
                      <span className="text-xs font-semibold text-on-surface truncate block" title={patient.facility}>
                        {patient.facility}
                      </span>
                    </div>

                    {/* STATUS + VIEW PATIENT DETAILS ACTION */}
                    <div className="flex items-center gap-2 lg:justify-end">
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle(
                          patient.status
                        )}`}
                      >
                        {patient.status}
                      </span>

                      {/* View Patient Details Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(patient)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-xs font-bold text-indigo-800 transition hover:bg-indigo-100 shadow-2xs"
                        title="View clinical notes, vitals, risk factors, and history"
                      >
                        <span className="material-symbols-outlined text-[15px]">clinical_notes</span>
                        <span>View Details</span>
                      </button>

                      <Link
                        to={`/episode/${patient.id}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-on-primary transition hover:bg-primary-hover shadow-2xs"
                      >
                        <span>Episode</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* PATIENT DETAILS MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-outline-variant bg-surface p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-on-surface">{selectedPatient.name}</h2>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold ${
                        selectedPatient.risk === "High"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {selectedPatient.risk} Risk
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {selectedPatient.id} • {selectedPatient.age} yrs • {selectedPatient.gender} • ABHA: <span className="font-mono font-semibold">{selectedPatient.abhaId}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Quick Demographics Bar */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-surface-container-low p-3 text-xs">
              <div>
                <span className="text-on-surface-variant text-[11px] block">Location:</span>
                <span className="font-bold text-on-surface">{selectedPatient.village}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[11px] block">Contact:</span>
                <span className="font-bold text-on-surface">{selectedPatient.phone}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[11px] block">Assigned Doctor:</span>
                <span className="font-bold text-on-surface">{selectedPatient.assignedDoctor}</span>
              </div>
              <div>
                <span className="text-on-surface-variant text-[11px] block">Follow-up:</span>
                <span className="font-bold text-indigo-700">{selectedPatient.followUp} ({selectedPatient.status})</span>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-red-600">monitor_heart</span>
                Current Vitals
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">Blood Pressure</span>
                  <span className="text-sm font-bold text-red-700">{selectedPatient.vitals.bp}</span>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">Pulse</span>
                  <span className="text-sm font-bold text-on-surface">{selectedPatient.vitals.pulse}</span>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">SpO2</span>
                  <span className="text-sm font-bold text-emerald-700">{selectedPatient.vitals.spo2}</span>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">Temperature</span>
                  <span className="text-sm font-bold text-on-surface">{selectedPatient.vitals.temp}</span>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface p-2.5">
                  <span className="text-[11px] text-on-surface-variant block">Weight</span>
                  <span className="text-sm font-bold text-on-surface">{selectedPatient.vitals.weight}</span>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                Clinical Risk Factors
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedPatient.riskFactors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-800"
                  >
                    • {factor}
                  </span>
                ))}
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-indigo-700">description</span>
                Clinical Assessment Notes
              </h3>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-xs text-on-surface leading-relaxed">
                {selectedPatient.clinicalNotes}
              </div>
            </div>

            {/* Follow-up History Timeline */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">history</span>
                Follow-up History & Milestones
              </h3>
              <div className="space-y-2 border-l-2 border-primary/20 pl-4 ml-2">
                {selectedPatient.history.map((item, idx) => (
                  <div key={idx} className="relative pb-2">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-on-surface">{item.stage}</span>
                      <span className="text-[11px] font-mono text-on-surface-variant">({item.date})</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="rounded-xl border border-outline-variant px-5 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Close Dossier
              </button>
              <Link
                to={`/episode/${selectedPatient.id}`}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary hover:bg-primary-hover shadow-sm"
              >
                Open Full Episode
              </Link>
            </div>
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
  colorClass: string;
  danger?: boolean;
}

function SummaryCard({ title, value, icon, colorClass, danger = false }: SummaryCardProps) {
  return (
    <div
      className={`rounded-3xl border p-5 sm:p-6 transition shadow-2xs ${
        danger ? "border-red-200 bg-red-50/40" : "border-outline-variant bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {title}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-on-surface tracking-tight">
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