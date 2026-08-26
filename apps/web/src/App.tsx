import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import FarmDetailPage from "./pages/FarmDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/farms/:farmId" element={<FarmDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
