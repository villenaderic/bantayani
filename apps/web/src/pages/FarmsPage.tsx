import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import DataSourceBadge from "../components/DataSourceBadge";
import { SeverityBadge, StatusBadge } from "../components/StatusBadges";
import { useFarms } from "../hooks/useFarms";
import type { DamageSeverity, DetectionStatus } from "../types/farm";

type SortKey = "farmId" | "province" | "crop" | "areaHectares" | "affectedAreaHectares";

export default function FarmsPage() {
  const { farms, isLoading, isLive } = useFarms();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("farmId");
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = farms.filter((f) => {
      if (!term) return true;
      return (
        f.farmId.toLowerCase().includes(term) ||
        f.province.toLowerCase().includes(term) ||
        f.municipality.toLowerCase().includes(term) ||
        f.crop.toLowerCase().includes(term)
      );
    });

    return [...filtered].sort((a, b) => {
      const direction = sortAsc ? 1 : -1;
      if (sortKey === "affectedAreaHectares") {
        const aValue = a.detection?.affectedAreaHectares ?? -1;
        const bValue = b.detection?.affectedAreaHectares ?? -1;
        return (aValue - bValue) * direction;
      }
      if (sortKey === "areaHectares") {
        return (a.areaHectares - b.areaHectares) * direction;
      }
      const aValue = String(a[sortKey]);
      const bValue = String(b[sortKey]);
      return aValue.localeCompare(bValue) * direction;
    });
  }, [farms, searchTerm, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <AppShell headerRight={<DataSourceBadge isLive={isLive} isLoading={isLoading} />}>
      <div className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Farms</h2>
            <p className="text-sm text-slate-500">{rows.length} farm records</p>
          </div>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search farm ID, province, crop"
            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm focus:border-agri-green focus:outline-none sm:w-72"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <SortableHeader label="Farm ID" sortKey="farmId" activeKey={sortKey} asc={sortAsc} onClick={toggleSort} />
                <SortableHeader label="Location" sortKey="province" activeKey={sortKey} asc={sortAsc} onClick={toggleSort} />
                <SortableHeader label="Crop" sortKey="crop" activeKey={sortKey} asc={sortAsc} onClick={toggleSort} />
                <SortableHeader
                  label="Farm area"
                  sortKey="areaHectares"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Affected area"
                  sortKey="affectedAreaHectares"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onClick={toggleSort}
                />
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.farmId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    {row.detection ? (
                      <Link to={`/farms/${row.farmId}`} className="font-medium text-agri-green hover:underline">
                        {row.farmId}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-500">{row.farmId}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {row.municipality}, {row.province}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{row.crop}</td>
                  <td className="px-4 py-2 text-slate-600">{row.areaHectares.toFixed(1)} ha</td>
                  <td className="px-4 py-2 text-slate-600">
                    {row.detection ? `${row.detection.affectedAreaHectares.toFixed(1)} ha` : "\u2014"}
                  </td>
                  <td className="px-4 py-2">
                    {row.detection ? (
                      <SeverityBadge severity={row.detection.severity as DamageSeverity} />
                    ) : (
                      <span className="text-xs text-slate-400">No detection</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {row.detection ? (
                      <StatusBadge status={row.detection.status as DetectionStatus} />
                    ) : (
                      <span className="text-xs text-slate-400">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  asc,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  asc: boolean;
  onClick: (key: SortKey) => void;
}) {
  const isActive = sortKey === activeKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      className="cursor-pointer select-none px-4 py-2 hover:text-slate-600"
    >
      {label} {isActive && (asc ? "\u2191" : "\u2193")}
    </th>
  );
}
