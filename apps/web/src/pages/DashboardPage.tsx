import { Link } from "react-router-dom";
import { demoFarm } from "../data/demoFarm";
import { SeverityBadge } from "../components/StatusBadges";

export default function DashboardPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <h1 className="text-lg font-semibold text-slate-800">BantayAni</h1>
        <span className="text-sm text-slate-500">Sample Region Office</span>
      </header>
      <main className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Recent detection, demo data
          </p>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">{demoFarm.farmId}</span>
            <SeverityBadge severity={demoFarm.severity} />
          </div>
          <p className="mb-1 text-sm text-slate-600">
            {demoFarm.damageType} in {demoFarm.municipality}, {demoFarm.province}
          </p>
          <p className="mb-4 text-xs text-slate-400">
            {demoFarm.affectedAreaHectares} hectares affected, {demoFarm.confidence}% confidence
          </p>
          <Link
            to={`/farms/${demoFarm.farmId}`}
            className="inline-block rounded bg-agri-green px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Inspect farm
          </Link>
        </div>
      </main>
      <p className="border-t border-slate-200 bg-white px-6 py-2 text-center text-xs text-slate-400">
        The full interactive map with damage markers and clustering is planned for the next build pass.
      </p>
    </div>
  );
}
