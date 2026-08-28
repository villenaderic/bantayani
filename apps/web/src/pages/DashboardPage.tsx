import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import StatsStrip from "../components/StatsStrip";
import MapFilters from "../components/MapFilters";
import DamageMap from "../components/DamageMap";
import DetectionSummaryPanel from "../components/DetectionSummaryPanel";
import { demoDetections } from "../data/demoDetections";
import type { DetectionSummary, MapFiltersState } from "../types/detection";

const availableDamageTypes = Array.from(new Set(demoDetections.map((d) => d.damageType)));

const initialFilters: MapFiltersState = {
  damageTypes: new Set(availableDamageTypes),
  severities: new Set(["critical", "high", "significant", "moderate", "low"]),
  statuses: new Set([
    "automated_detection",
    "potential_damage",
    "under_government_review",
    "verified_damage",
    "field_validated",
    "rejected",
  ]),
};

export default function DashboardPage() {
  const [filters, setFilters] = useState<MapFiltersState>(initialFilters);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<DetectionSummary | null>(null);

  const filteredDetections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return demoDetections.filter((d) => {
      if (!filters.damageTypes.has(d.damageType)) return false;
      if (!filters.severities.has(d.severity)) return false;
      if (!filters.statuses.has(d.status)) return false;
      if (!term) return true;
      return (
        d.farmId.toLowerCase().includes(term) ||
        d.province.toLowerCase().includes(term) ||
        d.municipality.toLowerCase().includes(term)
      );
    });
  }, [filters, searchTerm]);

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <StatsStrip detections={demoDetections} />
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 flex-shrink-0">
            <MapFilters
              filters={filters}
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
            <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[11px] text-amber-300">
              Demo data, simulated detections
            </div>
          </div>

          <div className="w-80 flex-shrink-0">
            <DetectionSummaryPanel detection={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
