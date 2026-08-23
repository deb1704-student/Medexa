import { useState } from "react";
import type { Referral, ReferralStateT } from "@/models/careEpisode";
import {
  getAvailableTransitions,
  isTerminal,
  STATE_LABELS,
} from "@/models/referralStateMachine";
import { db } from "@/sync/db";
import { writeAndQueue } from "@/sync/db";
import { v4 as uuidv4 } from "uuid";

interface ReferralTrackerProps {
  referral: Referral;
  changedBy: string;
}

/**
 * This component IS the "we don't just create a referral, we follow it
 * until closure" claim, made literal. It only ever offers legally-valid
 * next states (client-side mirror of the backend transition table — see
 * models/referralStateMachine.ts for why that mirror exists and why the
 * backend still re-validates independently).
 */
export function ReferralTracker({ referral, changedBy }: ReferralTrackerProps) {
  const [note, setNote] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const availableTransitions = getAvailableTransitions(referral.currentState);
  const terminal = isTerminal(referral.currentState);

  async function transitionTo(toState: ReferralStateT) {
    setTransitioning(true);
    try {
      const now = new Date().toISOString();

      const transitionRecord = {
        id: uuidv4(),
        referralId: referral.id,
        fromState: referral.currentState,
        toState,
        changedBy,
        changedAt: now,
        deviceLocalTimestamp: now,
        note: note || undefined,
      };

      await writeAndQueue(
        db.referralTransitions,
        "referralTransition",
        transitionRecord
      );

      const updatedReferral: Referral = {
        ...referral,
        currentState: toState,
        history: [...referral.history, transitionRecord],
        syncStatus: "pending",
      };
      await writeAndQueue(db.referrals, "referral", updatedReferral, "update");

      setNote("");
    } finally {
      setTransitioning(false);
    }
  }

  return (
    <div className="referral-tracker">
      <div className="referral-tracker__current-state">
        <span className={`state-badge state-badge--${referral.currentState.toLowerCase()}`}>
          {STATE_LABELS[referral.currentState]}
        </span>
        {referral.syncStatus === "pending" && (
          <span className="sync-pending-tag">not yet synced</span>
        )}
      </div>

      <ReferralHistoryTimeline history={referral.history} />

      {!terminal && availableTransitions.length > 0 && (
        <div className="referral-tracker__actions">
          <label>
            Note (optional)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. patient confirmed appointment"
            />
          </label>
          <div className="transition-buttons">
            {availableTransitions.map((state) => (
              <button
                key={state}
                disabled={transitioning}
                onClick={() => transitionTo(state)}
                className={`transition-btn transition-btn--${state.toLowerCase()}`}
              >
                Mark as {STATE_LABELS[state]}
              </button>
            ))}
          </div>
        </div>
      )}

      {terminal && (
        <p className="referral-tracker__terminal-note">
          This referral has reached a terminal state and requires no further action.
        </p>
      )}
    </div>
  );
}

function ReferralHistoryTimeline({
  history,
}: {
  history: Referral["history"];
}) {
  if (history.length === 0) return null;

  return (
    <ol className="referral-history-timeline">
      {history.map((t) => (
        <li key={t.id}>
          <span className="timeline-state">{STATE_LABELS[t.toState]}</span>
          <time dateTime={t.changedAt}>{new Date(t.changedAt).toLocaleString()}</time>
          {t.note && <p className="timeline-note">{t.note}</p>}
        </li>
      ))}
    </ol>
  );
}
