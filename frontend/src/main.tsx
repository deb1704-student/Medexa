import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/App";
import { initSyncEngine } from "@/sync/syncEngine";

// Start the sync engine once, at app boot. It self-manages online/offline
// transitions from here — nothing else in the app needs to think about
// network state directly (see Build Guide Section 8, Stage D).
initSyncEngine();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
