import type { DamageSeverity, DetectionStatus } from "../types/farm";
import type { MapFiltersState } from "../types/detection";

interface MapFiltersProps {
  filters: MapFiltersState;
  onChange: (filters: MapFiltersState) => void;
  availableDamageTypes: string[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SEVERITIES: DamageSeverity[] = ["critical", "high", "significant", "moderate", "low"];
const STATUSES: DetectionStatus[] = [
  "automated_detection",
  "potential_damage",
  "under_government_review",
  "verified_damage",
  "field_validated",
  "rejected",
];

const STATUS_LABELS: Record<DetectionStatus, string> = {
  automated_detection: "Automated",
  potential_damage: "Potential damage",
  under_government_review: "Under review",
  verified_damage: "Verified",
  field_validated: "Field validated",
  rejected: "Rejected",
};

export default function MapFilters({
  filters,
  onChange,
  availableDamageTypes,
  searchTerm,
  onSearchChange,
}: MapFiltersProps) {
  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto border-r border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
        <input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Farm ID, province, municipality"
          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-agri-green focus:outline-none"
        />
      </div>

      <FilterGroup title="Damage type">
        {availableDamageTypes.map((type) => (
          <Checkbox
            key={type}
            label={type}
            checked={filters.damageTypes.has(type)}
            onChange={() => onChange({ ...filters, damageTypes: toggle(filters.damageTypes, type) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Severity">
        {SEVERITIES.map((severity) => (
          <Checkbox
            key={severity}
            label={severity}
            checked={filters.severities.has(severity)}
            onChange={() => onChange({ ...filters, severities: toggle(filters.severities, severity) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Status">
        {STATUSES.map((status) => (
          <Checkbox
            key={status}
            label={STATUS_LABELS[status]}
            checked={filters.statuses.has(status)}
            onChange={() => onChange({ ...filters, statuses: toggle(filters.statuses, status) })}
          />
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm capitalize text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-slate-300 text-agri-green focus:ring-agri-green"
      />
      {label}
    </label>
  );
}
