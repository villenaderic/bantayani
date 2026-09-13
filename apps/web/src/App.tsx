import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Route level code splitting. DashboardPage pulls in Leaflet and
// AnalyticsPage pulls in Recharts, both sizable libraries that most
// visits to any single page do not need at once. Lazy loading each
// page means the browser only downloads the map or chart code when
// the person actually navigates to a page that uses it, instead of
// every visitor paying for all of it up front in a single bundle.
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const FarmDetailPage = lazy(() => import("./pages/FarmDetailPage"));
const FarmsPage = lazy(() => import("./pages/FarmsPage"));
const DetectionsPage = lazy(() => import("./pages/DetectionsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const DisastersPage = lazy(() => import("./pages/DisastersPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function RouteLoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/farms" element={<FarmsPage />} />
            <Route path="/farms/:farmId" element={<FarmDetailPage />} />
            <Route path="/detections" element={<DetectionsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/disasters" element={<DisastersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
