import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import DataSourceBadge from "../components/DataSourceBadge";
import { SeverityBadge } from "../components/StatusBadges";
import { useBantayaniData } from "../hooks/useBantayaniData";

export default function DisastersPage() {
  const { detections, disasters, isLoading, isLive } = useBantayaniData();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const summaries = useMemo(() => {
    return disasters.map((disaster) => {
      const related = detections.filter((d) => d.disasterId === disaster.id);
      const affectedHectares = related.reduce((sum, d) => sum + d.affectedAreaHectares, 0);
      const affectedFarms = related.length;
      return { disaster, related, affectedHectares, affectedFarms };
    });
  }, [detections, disasters]);

  return (
    <AppShell headerRight={<DataSourceBadge isLive={isLive} isLoading={isLoading} />}>
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Disasters</h2>
          <p className="text-sm text-slate-500">Events correlated against automated detections, demo data</p>
        </div>

        <div className="space-y-3">
          {summaries.map(({ disaster, related, affectedHectares, affectedFarms }) => {
            const isExpanded = expandedId === disaster.id;
            return (
              <div key={disaster.id} className="rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : disaster.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {disaster.eventType}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-800">{disaster.name}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(disaster.startDate)} to {formatDate(disaster.endDate)}, {disaster.affectedProvinces.join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-slate-400">Affected farms</p>
                      <p className="text-sm font-semibold text-slate-800">{affectedFarms}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Affected area</p>
                      <p className="text-sm font-semibold text-slate-800">{affectedHectares.toFixed(1)} ha</p>
                    </div>
                    <span className="text-slate-400">{isExpanded ? "\u2212" : "+"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <p className="mb-3 text-sm text-slate-600">{disaster.description}</p>
                    {related.length === 0 ? (
                      <p className="text-xs text-slate-400">No correlated detections yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {related.map((d) => (
                          <Link
                            key={d.id}
                            to={`/farms/${d.farmId}`}
                            className="flex items-center justify-between rounded border border-slate-100 px-3 py-2 text-sm hover:border-agri-green"
                          >
                            <span className="font-medium text-slate-700">{d.farmId}</span>
                            <span className="text-slate-500">{d.municipality}, {d.province}</span>
                            <span className="text-slate-500">{d.affectedAreaHectares.toFixed(1)} ha</span>
                            <SeverityBadge severity={d.severity} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
