import { useSyncStatus } from "@/hooks/useSyncStatus";

/**
 * This tiny component carries a lot of narrative weight — it's the UI
 * element judges will be watching during Act 1-3 of the demo. Keep it
 * simple and legible from across a room.
 */
export function SyncIndicator() {
  const { isOnline, pending, syncing, lastSyncedAt } = useSyncStatus();

  if (!isOnline) {
    return (
      <div role="status" className="sync-indicator sync-indicator--offline">
        <span className="dot dot--offline" />
        Offline
        {pending > 0 && ` — ${pending} record${pending === 1 ? "" : "s"} waiting to sync`}
      </div>
    );
  }

  if (syncing) {
    return (
      <div role="status" className="sync-indicator sync-indicator--syncing">
        <span className="dot dot--syncing" />
        Syncing {pending} record{pending === 1 ? "" : "s"}...
      </div>
    );
  }

  if (pending === 0 && lastSyncedAt) {
    return (
      <div role="status" className="sync-indicator sync-indicator--synced">
        <span className="dot dot--synced" />
        All records synchronized
      </div>
    );
  }

  return (
    <div role="status" className="sync-indicator">
      <span className="dot dot--synced" />
      Online
    </div>
  );
}
