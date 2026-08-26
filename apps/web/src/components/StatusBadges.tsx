import type { DamageSeverity, DetectionStatus } from "../types/farm";

const SEVERITY_STYLES: Record<DamageSeverity, string> = {
  low: "bg-emerald-100 text-emerald-700",
  moderate: "bg-yellow-100 text-yellow-700",
  significant: "bg-orange-100 text-orange-700",
  high: "bg-orange-200 text-orange-800",
  critical: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<DetectionStatus, string> = {
  automated_detection: "Automated detection",
  potential_damage: "Potential damage",
  under_government_review: "Under government review",
  verified_damage: "Verified damage",
  field_validated: "Field validated",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<DetectionStatus, string> = {
  automated_detection: "bg-slate-100 text-slate-600",
  potential_damage: "bg-amber-100 text-amber-700",
  under_government_review: "bg-blue-100 text-blue-700",
  verified_damage: "bg-emerald-100 text-emerald-700",
  field_validated: "bg-emerald-200 text-emerald-800",
  rejected: "bg-slate-200 text-slate-500",
};

export function SeverityBadge({ severity }: { severity: DamageSeverity }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${SEVERITY_STYLES[severity]}`}>
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: DetectionStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
