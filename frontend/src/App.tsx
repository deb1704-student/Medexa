import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { PatientEpisodePage } from "@/pages/PatientEpisodePage";
import { DistrictDashboardPage } from "@/pages/DistrictDashboardPage";
import "@/styles/globals.css";

/**
 * Each page (PatientEpisodePage, DistrictDashboardPage) renders its own
 * full header/nav matching the Stitch designs exactly — a frontline
 * worker's mobile top bar looks nothing like a district officer's
 * desktop sidebar, and trying to force one shared app-level nav across
 * both would fight the approved designs rather than implement them.
 * App.tsx here is just the router boundary.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/episode/:careEpisodeId" element={<PatientEpisodePage />} />
        <Route path="/dashboard" element={<DistrictDashboardPage />} />
        <Route path="/" element={<HomePlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}

// Replace with real patient search/selection once Phase 2 (Care Episode
// core) is built — this exists only so the route tree isn't empty.
function HomePlaceholder() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-lg">
      <div className="max-w-md text-center space-y-md">
        <h1 className="font-display-lg text-display-lg text-primary">Medexa</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Patient search and Care Episode selection go here (Phase 2). For now, navigate
          directly to <code className="bg-surface-container px-1 rounded">/episode/:careEpisodeId</code>{" "}
          or the district dashboard.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-full font-label-lg text-label-lg"
        >
          Go to District Dashboard
        </Link>
      </div>
    </div>
  );
}
