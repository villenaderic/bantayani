import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { SeverityBadge, StatusBadge } from "../components/StatusBadges";
import { demoDetections } from "../data/demoDetections";
import type { DetectionStatus } from "../types/farm";

const TABS: { label: string; value: DetectionStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Automated", value: "automated_detection" },
  { label: "Potential damage", value: "potential_damage" },
  { label: "Under review", value: "under_government_review" },
  { label: "Verified", value: "verified_damage" },
  { label: "Field validated", value: "field_validated" },
  { label: "Rejected", value: "rejected" },
];

export default function DetectionsPage() {
  const [activeTab, setActiveTab] = useState<DetectionStatus | "all">("all");

  const rows = useMemo(() => {
    if (activeTab === "all") return demoDetections;
    return demoDetections.filter((d) => d.status === activeTab);
  }, [activeTab]);

  return (
    <AppShell>
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Detections</h2>
          <p className="text-sm text-slate-500">{rows.length} detections, demo data</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                activeTab === tab.value
                  ? "bg-agri-green text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((detection) => (
            <Link
              key={detection.id}
              to={`/farms/${detection.farmId}`}
              className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-agri-green hover:shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{detection.farmId}</span>
                <SeverityBadge severity={detection.severity} />
              </div>
              <p className="mb-1 text-sm text-slate-600">{detection.damageType}</p>
              <p className="mb-3 text-xs text-slate-400">
                {detection.municipality}, {detection.province}
              </p>
              <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                <span>{detection.confidence}% confidence</span>
                <span>{detection.affectedAreaHectares.toFixed(1)} ha affected</span>
              </div>
              <StatusBadge status={detection.status} />
            </Link>
          ))}
        </div>

        {rows.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-400">No detections match this status.</p>
        )}
      </div>
    </AppShell>
  );
}
