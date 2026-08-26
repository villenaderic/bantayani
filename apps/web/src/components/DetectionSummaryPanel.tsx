import { Link } from "react-router-dom";
import type { DetectionSummary } from "../types/detection";
import { SeverityBadge, StatusBadge } from "./StatusBadges";

interface DetectionSummaryPanelProps {
  detection: DetectionSummary | null;
  onClose: () => void;
}

export default function DetectionSummaryPanel({ detection, onClose }: DetectionSummaryPanelProps) {
  if (!detection) {
    return (
      <div className="flex h-full items-center justify-center border-l border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        Select a marker on the map to inspect a flagged farm.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto border-l border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{detection.province}, {detection.municipality}</p>
          <h3 className="text-base font-semibold text-slate-800">{detection.farmId}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close panel">
          ✕
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <SeverityBadge severity={detection.severity} />
        <StatusBadge status={detection.status} />
      </div>

      <p className="mb-3 text-sm text-slate-600">{detection.damageType}</p>

      <div className="mb-4 grid grid-cols-2 gap-3 rounded bg-slate-50 p-3">
        <Stat label="Confidence" value={`${detection.confidence}%`} />
        <Stat label="Affected area" value={`${detection.affectedAreaHectares} ha`} />
        <Stat label="Total farm area" value={`${detection.areaHectares} ha`} />
        <Stat label="Crop" value={detection.crop} />
      </div>

      <p className="mb-4 text-xs text-slate-400">
        Detected {formatDate(detection.detectionDate)}. This is an automated estimate and requires
        government review before it is treated as confirmed damage.
      </p>

      <Link
        to={`/farms/${detection.farmId}`}
        className="rounded bg-agri-green px-4 py-2 text-center text-sm font-medium text-white hover:opacity-90"
      >
        Open farm inspection
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
