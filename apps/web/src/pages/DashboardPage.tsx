import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import StatsStrip from "../components/StatsStrip";
import MapFilters from "../components/MapFilters";
import DamageMap from "../components/DamageMap";
import DetectionSummaryPanel from "../components/DetectionSummaryPanel";
import DataSourceBadge from "../components/DataSourceBadge";
import { useBantayaniData } from "../hooks/useBantayaniData";
import type { DetectionSummary, MapFiltersState } from "../types/detection";

const ALL_SEVERITIES = ["critical", "high", "significant", "moderate", "low"] as const;
const ALL_STATUSES = [
  "automated_detection",
  "potential_damage",
  "under_government_review",
  "verified_damage",
  "field_validated",
  "rejected",
] as const;

export default function DashboardPage() {
  const { detections, isLoading, isLive } = useBantayaniData();
  const availableDamageTypes = useMemo(
    () => Array.from(new Set(detections.map((d) => d.damageType))),
    [detections]
  );

  const [filters, setFilters] = useState<MapFiltersState>({
    damageTypes: new Set(),
    severities: new Set(ALL_SEVERITIES),
    statuses: new Set(ALL_STATUSES),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<DetectionSummary | null>(null);

  const effectiveDamageTypes = filters.damageTypes.size > 0 ? filters.damageTypes : new Set(availableDamageTypes);

  const filteredDetections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return detections.filter((d) => {
      if (!effectiveDamageTypes.has(d.damageType)) return false;
      if (!filters.severities.has(d.severity)) return false;
      if (!filters.statuses.has(d.status)) return false;
      if (!term) return true;
      return (
        d.farmId.toLowerCase().includes(term) ||
        d.province.toLowerCase().includes(term) ||
        d.municipality.toLowerCase().includes(term)
      );
    });
  }, [detections, effectiveDamageTypes, filters.severities, filters.statuses, searchTerm]);

  return (
    <AppShell headerRight={<DataSourceBadge isLive={isLive} isLoading={isLoading} />}>
      <div className="flex h-full flex-col">
        <StatsStrip detections={detections} />
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 flex-shrink-0">
            <MapFilters
              filters={{ ...filters, damageTypes: effectiveDamageTypes }}
              onChange={setFilters}
              availableDamageTypes={availableDamageTypes}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>

          <div className="relative flex-1">
            <DamageMap
              detections={filteredDetections}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
            {!isLive && (
              <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[11px] text-amber-300">
                Demo data, simulated detections
              </div>
            )}
          </div>

          <div className="w-80 flex-shrink-0">
            <DetectionSummaryPanel detection={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
