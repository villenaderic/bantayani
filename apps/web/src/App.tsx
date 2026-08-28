import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import FarmDetailPage from "./pages/FarmDetailPage";
import FarmsPage from "./pages/FarmsPage";
import DetectionsPage from "./pages/DetectionsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/farms" element={<FarmsPage />} />
        <Route path="/farms/:farmId" element={<FarmDetailPage />} />
        <Route path="/detections" element={<DetectionsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
