import React from "react";

export type ReferralStage =
  | "Referral Submitted"
  | "In Transit"
  | "Completed";

interface ReferralStatusStepperProps {
  currentStage: string | ReferralStage;
  isCompact?: boolean;
  onStageClick?: (stage: ReferralStage) => void;
}

const STAGES: { key: ReferralStage; label: string; icon: string }[] = [
  { key: "Referral Submitted", label: "1. Referral Submitted", icon: "send" },
  { key: "In Transit", label: "2. In Transit", icon: "local_shipping" },
  { key: "Completed", label: "3. Completed", icon: "task_alt" },
];

const mapStatusToStage = (statusStr: string): ReferralStage => {
  const s = statusStr.toLowerCase();
  // Stage 3: Completed, Closed, Discharged, Back-Referred
  if (
    s.includes("complete") ||
    s.includes("discharge") ||
    s.includes("closed") ||
    s.includes("back") ||
    s.includes("return")
  ) {
    return "Completed";
  }
  // Stage 2: In Transit, Dispatched, At Block/CHC, Under Treatment, In Consultation, Received
  if (
    s.includes("transit") ||
    s.includes("en route") ||
    s.includes("ambulance") ||
    s.includes("escalat") ||
    s.includes("received") ||
    s.includes("arrived") ||
    s.includes("office") ||
    s.includes("consult") ||
    s.includes("treat") ||
    s.includes("admit") ||
    s.includes("dispatch")
  ) {
    return "In Transit";
  }
  // Stage 1: Submitted, Sent, Created, Draft, Acknowledged
  return "Referral Submitted";
};

export const ReferralStatusStepper: React.FC<ReferralStatusStepperProps> = ({
  currentStage,
  isCompact = false,
  onStageClick,
}) => {
  const normalizedStage =
    typeof currentStage === "string" ? mapStatusToStage(currentStage) : currentStage;

  const currentIndex = STAGES.findIndex((s) => s.key === normalizedStage);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;

  if (isCompact) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[150px]" title={`Current Stage: ${STAGES[activeIdx].label}`}>
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
          <span className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[13px]">{STAGES[activeIdx].icon}</span>
            {STAGES[activeIdx].label.replace(/^\d+\.\s*/, "")}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeIdx + 1}/3
          </span>
        </div>
        {/* Progress Dots / Bar */}
        <div className="grid grid-cols-3 gap-1">
          {STAGES.map((st, i) => {
            const isDone = i < activeIdx;
            const isCurrent = i === activeIdx;
            return (
              <div
                key={st.key}
                className={`h-1.5 rounded-full transition-all ${
                  isDone
                    ? "bg-teal-600"
                    : isCurrent
                    ? "bg-primary animate-pulse"
                    : "bg-slate-200"
                }`}
                title={st.label}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Full Expanded Stepper (Exactly 3 Stages)
  return (
    <div className="w-full rounded-2xl border border-outline-variant bg-surface p-4 sm:p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">alt_route</span>
          3-Stage Care Referral Journey
        </h4>
        <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-0.5 text-xs font-bold text-teal-800">
          Stage {activeIdx + 1} of 3: {STAGES[activeIdx].key}
        </span>
      </div>

      <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-0">
        {/* Horizontal Connector Line for Desktop */}
        <div className="hidden md:block absolute left-8 right-8 top-5 h-0.5 bg-slate-200 -z-0" />

        {STAGES.map((stage, index) => {
          const isDone = index < activeIdx;
          const isCurrent = index === activeIdx;

          let circleClass = "bg-slate-100 text-slate-400 border-2 border-slate-300";
          let labelClass = "text-slate-400 font-medium";

          if (isDone) {
            circleClass = "bg-teal-700 text-white border-2 border-teal-700 shadow-sm";
            labelClass = "text-teal-900 font-bold";
          } else if (isCurrent) {
            circleClass =
              "bg-primary text-white border-2 border-primary ring-4 ring-primary/20 shadow-md animate-pulse";
            labelClass = "text-primary font-black";
          }

          return (
            <button
              key={stage.key}
              type="button"
              disabled={!onStageClick}
              onClick={() => onStageClick?.(stage.key)}
              className={`relative z-10 flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center transition flex-1 ${
                onStageClick ? "hover:scale-105 cursor-pointer" : "cursor-default"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base transition ${circleClass}`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isDone ? "check" : stage.icon}
                </span>
              </div>

              <div>
                <span className={`block text-xs leading-tight ${labelClass}`}>
                  {stage.label}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {isDone ? "Completed" : isCurrent ? "Active Stage" : "Pending"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
