import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppShell from "../components/AppShell";
import DataSourceBadge from "../components/DataSourceBadge";
import { useBantayaniData } from "../hooks/useBantayaniData";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  significant: "#F59E0B",
  moderate: "#EAB308",
  low: "#16A34A",
};

const STATUS_COLOR: Record<string, string> = {
  automated_detection: "#94A3B8",
  potential_damage: "#F59E0B",
  under_government_review: "#3B82F6",
  verified_damage: "#10B981",
  field_validated: "#059669",
  rejected: "#CBD5E1",
};

export default function AnalyticsPage() {
  const { detections, isLoading, isLive } = useBantayaniData();
  const byProvince = useMemo(() => aggregateByKey(detections, "province"), [detections]);
  const byCrop = useMemo(() => aggregateByKey(detections, "crop"), [detections]);
  const bySeverity = useMemo(() => countByKey(detections, "severity"), [detections]);
  const byStatus = useMemo(() => countByKey(detections, "status"), [detections]);

  return (
    <AppShell headerRight={<DataSourceBadge isLive={isLive} isLoading={isLoading} />}>
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Analytics</h2>
          <p className="text-sm text-slate-500">Aggregated from current demo detections</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Affected hectares by province">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byProvince}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1F6B3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Affected hectares by crop">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byCrop}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#C89B3C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Detections by severity">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={bySeverity} dataKey="value" nameKey="label" outerRadius={100} label>
                  {bySeverity.map((entry) => (
                    <Cell key={entry.label} fill={SEVERITY_COLOR[entry.label] ?? "#94A3B8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Detections by status">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="label" outerRadius={100} label>
                  {byStatus.map((entry) => (
                    <Cell key={entry.label} fill={STATUS_COLOR[entry.label] ?? "#94A3B8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </AppShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

function aggregateByKey<T extends Record<string, any>>(
  items: T[],
  key: keyof T
): { label: string; value: number }[] {
  const totals = new Map<string, number>();
  items.forEach((item) => {
    const label = String(item[key]);
    totals.set(label, (totals.get(label) ?? 0) + item.affectedAreaHectares);
  });
  return Array.from(totals.entries())
    .map(([label, value]) => ({ label, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value);
}

function countByKey<T extends Record<string, any>>(items: T[], key: keyof T): { label: string; value: number }[] {
  const totals = new Map<string, number>();
  items.forEach((item) => {
    const label = String(item[key]);
    totals.set(label, (totals.get(label) ?? 0) + 1);
  });
  return Array.from(totals.entries()).map(([label, value]) => ({ label, value }));
}
