import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { PatientEpisodePage } from "@/pages/PatientEpisodePage";
import { DistrictDashboardPage } from "@/pages/DistrictDashboardPage";
import "@/styles/app.css";

export function App() {
  return (
    <BrowserRouter>
      <nav className="app-nav">
        <Link to="/">Frontline Worker</Link>
        <Link to="/dashboard">District Dashboard</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/episode/:careEpisodeId" element={<PatientEpisodePage />} />
          <Route path="/dashboard" element={<DistrictDashboardPage />} />
          <Route path="/" element={<HomeRedirectPlaceholder />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

// Replace with real patient search/selection once Phase 2 (Care Episode
// core) is built — this exists only so the route tree isn't empty.
function HomeRedirectPlaceholder() {
  return (
    <div className="home-placeholder">
      <h1>Care Continuity — Frontline Worker App</h1>
      <p>
        Patient search and Care Episode selection go here (Phase 2). For now,
        navigate directly to <code>/episode/:careEpisodeId</code> or the{" "}
        <Link to="/dashboard">District Dashboard</Link>.
      </p>
    </div>
  );
}
