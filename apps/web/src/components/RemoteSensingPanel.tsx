import type { FarmDetail } from "../types/farm";

interface RemoteSensingPanelProps {
  farm: FarmDetail;
}

export default function RemoteSensingPanel({ farm }: RemoteSensingPanelProps) {
  const ndviChange = ((farm.ndviAfter - farm.ndviBefore) / farm.ndviBefore) * 100;
  const ndwiChange = ((farm.ndwiAfter - farm.ndwiBefore) / Math.max(farm.ndwiBefore, 0.01)) * 100;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Remote sensing</h3>
      <div className="grid grid-cols-2 gap-4">
        <IndicatorRow label="NDVI before" value={farm.ndviBefore.toFixed(2)} />
        <IndicatorRow label="NDVI after" value={farm.ndviAfter.toFixed(2)} />
        <IndicatorRow
          label="NDVI change"
          value={`${ndviChange > 0 ? "+" : ""}${ndviChange.toFixed(1)}%`}
          tone={ndviChange < 0 ? "negative" : "positive"}
        />
        <IndicatorRow label="NDWI before" value={farm.ndwiBefore.toFixed(2)} />
        <IndicatorRow label="NDWI after" value={farm.ndwiAfter.toFixed(2)} />
        <IndicatorRow
          label="NDWI change"
          value={`${ndwiChange > 0 ? "+" : ""}${ndwiChange.toFixed(1)}%`}
          tone={ndwiChange > 0 ? "negative" : "positive"}
        />
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <p>Algorithm: {farm.algorithmName} version {farm.algorithmVersion}</p>
        <p>Baseline: {farm.baselineReference}</p>
      </div>
    </div>
  );
}

function IndicatorRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  const toneClass =
    tone === "negative" ? "text-red-600" : tone === "positive" ? "text-emerald-600" : "text-slate-800";
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
