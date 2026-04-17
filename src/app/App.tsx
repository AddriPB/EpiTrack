import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AddEventPage } from "../modules/events/AddEventPage";
import { CalendarPage } from "../modules/calendar/CalendarPage";
import { GraphsPage } from "../modules/graphs/GraphsPage";
import { AuthPage } from "../modules/auth/AuthPage";
import { TreatmentPage } from "../modules/treatment/TreatmentPage";
import { LoadingState } from "../shared/components/LoadingState";
import { useAuth } from "../services/auth/AuthContext";

export function App() {
  const location = useLocation();
  const { user, loading, firebaseReady } = useAuth();
  const isAuthenticated = Boolean(user);
  const showFab = isAuthenticated && location.pathname !== "/add";
  const fabTo = location.pathname === "/treatment" ? "/treatment?action=create" : "/add";
  const fabLabel = location.pathname === "/treatment" ? "Ajouter un traitement" : "Nouvelle crise";

  if (loading) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <LoadingState label="Connexion en cours…" />
        </main>
      </div>
    );
  }

  if (!firebaseReady) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell showFab={showFab} fabTo={fabTo} fabLabel={fabLabel}>
      <Routes>
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/stats" element={<GraphsPage />} />
        <Route path="/treatment" element={<TreatmentPage />} />
        <Route path="/graphs" element={<Navigate to="/stats" replace />} />
        <Route path="/add" element={<AddEventPage />} />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </AppShell>
  );
}
