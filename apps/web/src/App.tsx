import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import FarmDetailPage from "./pages/FarmDetailPage";
import FarmsPage from "./pages/FarmsPage";
import DetectionsPage from "./pages/DetectionsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DisastersPage from "./pages/DisastersPage";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/farms" element={<FarmsPage />} />
        <Route path="/farms/:farmId" element={<FarmDetailPage />} />
        <Route path="/detections" element={<DetectionsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/disasters" element={<DisastersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
