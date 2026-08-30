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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  function handleSelect(detection: DetectionSummary) {
    setSelected(detection);
    setShowMobileFilters(false);
  }

  return (
    <AppShell headerRight={<DataSourceBadge isLive={isLive} isLoading={isLoading} />}>
      <div className="flex h-full flex-col">
        <div className="sm:hidden">
          <DataSourceBadge isLive={isLive} isLoading={isLoading} />
        </div>
        <StatsStrip detections={detections} />
        <div className="relative flex flex-1 overflow-hidden">
          {/* Mobile filters toggle */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="absolute left-2 top-2 z-30 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm md:hidden"
          >
            Filters
          </button>

          {/* Filters: static column on desktop, slide-over drawer on mobile */}
          <div className="hidden md:block md:w-64 md:flex-shrink-0">
            <MapFilters
              filters={{ ...filters, damageTypes: effectiveDamageTypes }}
              onChange={setFilters}
              availableDamageTypes={availableDamageTypes}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>

          {showMobileFilters && (
            <div className="fixed inset-0 z-40 flex md:hidden">
              <div className="fixed inset-0 bg-black/30" onClick={() => setShowMobileFilters(false)} />
              <div className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-700">Filters</span>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Close filters"
                  >
                    &times;
                  </button>
                </div>
                <MapFilters
                  filters={{ ...filters, damageTypes: effectiveDamageTypes }}
                  onChange={setFilters}
                  availableDamageTypes={availableDamageTypes}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </div>
            </div>
          )}

          <div className="relative flex-1">
            <DamageMap
              detections={filteredDetections}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
            />
            {!isLive && (
              <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[11px] text-amber-300">
                Demo data, simulated detections
              </div>
            )}
          </div>

          {/* Detail panel: static column on desktop, bottom sheet on mobile, only when something is selected */}
          <div className="hidden md:block md:w-80 md:flex-shrink-0">
            <DetectionSummaryPanel detection={selected} onClose={() => setSelected(null)} />
          </div>

          {selected && (
            <div className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-lg border-t border-slate-200 bg-white shadow-lg md:hidden">
              <DetectionSummaryPanel detection={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
