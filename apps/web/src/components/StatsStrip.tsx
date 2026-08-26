import type { DetectionSummary } from "../types/detection";

interface StatsStripProps {
  detections: DetectionSummary[];
}

export default function StatsStrip({ detections }: StatsStripProps) {
  const totalMonitored = detections.reduce((sum, d) => sum + d.areaHectares, 0);
  const potentialDamage = detections
    .filter((d) => d.status === "automated_detection" || d.status === "potential_damage" || d.status === "under_government_review")
    .reduce((sum, d) => sum + d.affectedAreaHectares, 0);
  const verifiedDamage = detections
    .filter((d) => d.status === "verified_damage" || d.status === "field_validated")
    .reduce((sum, d) => sum + d.affectedAreaHectares, 0);
  const activeIncidents = detections.filter((d) => d.status !== "rejected").length;
  const criticalIncidents = detections.filter((d) => d.severity === "critical" && d.status !== "rejected").length;

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:grid-cols-5">
      <StatCard label="Area monitored" value={`${totalMonitored.toFixed(1)} ha`} />
      <StatCard label="Potential damage" value={`${potentialDamage.toFixed(1)} ha`} tone="warning" />
      <StatCard label="Verified damage" value={`${verifiedDamage.toFixed(1)} ha`} tone="verified" />
      <StatCard label="Active incidents" value={`${activeIncidents}`} />
      <StatCard label="Critical incidents" value={`${criticalIncidents}`} tone="critical" />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "verified" | "critical";
}) {
  const toneClass =
    tone === "warning"
      ? "text-amber-600"
      : tone === "verified"
      ? "text-emerald-600"
      : tone === "critical"
      ? "text-red-600"
      : "text-slate-800";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
