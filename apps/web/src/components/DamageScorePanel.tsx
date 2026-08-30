import type { DamageScoreBreakdown, ConfidenceBreakdown } from "../lib/api";

interface DamageScorePanelProps {
  damageScore: DamageScoreBreakdown;
  confidence: ConfidenceBreakdown;
  recordedSeverity: string;
  algorithmName: string;
  algorithmVersion: string;
}

export default function DamageScorePanel({
  damageScore,
  confidence,
  recordedSeverity,
  algorithmName,
  algorithmVersion,
}: DamageScorePanelProps) {
  const severityMatches = damageScore.suggestedSeverity === recordedSeverity;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Algorithm score breakdown</h3>
        <span className="text-[11px] text-slate-400">
          {algorithmName} v{algorithmVersion}
        </span>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        A supporting diagnostic computed directly from the observation series, kept separate from the
        recorded severity above. Disagreement here is expected and is exactly what government review
        exists to resolve, not a system error.
      </p>

      <div className="mb-3 space-y-2">
        <ScoreRow label="Vegetation change" value={damageScore.vegetationChange} max={25} />
        <ScoreRow label="Water anomaly" value={damageScore.waterAnomaly} max={25} />
        <ScoreRow label="Historical deviation" value={damageScore.historicalDeviation} max={25} />
        <ScoreRow label="Spatial anomaly" value={damageScore.spatialAnomaly} max={25} />
      </div>

      <div className="mb-3 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="text-sm font-medium text-slate-700">Total score</span>
        <span className="text-sm font-semibold text-slate-800">{damageScore.total} / 100</span>
      </div>

      <div
        className={`mb-3 rounded px-3 py-2 text-xs ${
          severityMatches ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        Algorithm suggested severity: <span className="font-semibold capitalize">{damageScore.suggestedSeverity}</span>
        {severityMatches ? " (matches recorded severity)" : ` (recorded severity is currently "${recordedSeverity}")`}
      </div>

      <div className="border-t border-slate-100 pt-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Detection confidence
        </h4>
        <div className="space-y-2">
          <ScoreRow label="Imagery quality" value={confidence.imageryQualityComponent} max={70} />
          <ScoreRow label="Known disaster correlation" value={confidence.disasterCorrelationComponent} max={25} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Total confidence</span>
          <span className="text-sm font-semibold text-slate-800">{confidence.total}%</span>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-agri-green" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
