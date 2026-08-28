import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { demoDisasters } from "../data/demoDisasters";
import { demoDetections } from "../data/demoDetections";
import type { DetectionSummary } from "../types/detection";

export default function ReportsPage() {
  const [selectedDisasterId, setSelectedDisasterId] = useState<string>(demoDisasters[0]?.id ?? "");
  const [generated, setGenerated] = useState(false);

  const disaster = demoDisasters.find((d) => d.id === selectedDisasterId) ?? null;

  const report = useMemo(() => {
    if (!disaster) return null;
    return buildReport(disaster.id, demoDetections);
  }, [disaster]);

  return (
    <AppShell>
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Reports</h2>
          <p className="text-sm text-slate-500">Generate an agricultural damage assessment summary, demo data</p>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Disaster event</label>
            <select
              value={selectedDisasterId}
              onChange={(e) => {
                setSelectedDisasterId(e.target.value);
                setGenerated(false);
              }}
              className="rounded border border-slate-200 px-3 py-1.5 text-sm focus:border-agri-green focus:outline-none"
            >
              {demoDisasters.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setGenerated(true)}
            className="rounded bg-agri-green px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Generate report
          </button>
          {generated && (
            <button
              onClick={() => window.print()}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Print or save as PDF
            </button>
          )}
        </div>

        {generated && disaster && report && (
          <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Agricultural damage assessment</p>
            <h3 className="mb-4 text-lg font-semibold text-slate-800">{disaster.name}</h3>

            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <ReportField label="Event type" value={capitalize(disaster.eventType)} />
              <ReportField
                label="Period"
                value={`${formatDate(disaster.startDate)} to ${formatDate(disaster.endDate)}`}
              />
              <ReportField label="Provinces" value={disaster.affectedProvinces.join(", ")} />
              <ReportField label="Affected farms" value={`${report.affectedFarms}`} />
              <ReportField label="Estimated affected area" value={`${report.totalAffectedHectares.toFixed(1)} ha`} />
              <ReportField label="Verified" value={`${report.verifiedFarms} farms`} />
              <ReportField label="Pending review" value={`${report.pendingFarms} farms`} />
              <ReportField label="Rejected" value={`${report.rejectedFarms} farms`} />
            </div>

            <div className="mb-2 border-t border-slate-100 pt-4">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Affected area by crop</h4>
              <div className="space-y-1">
                {report.byCrop.map((row) => (
                  <div key={row.crop} className="flex justify-between text-sm text-slate-600">
                    <span>{row.crop}</span>
                    <span>{row.hectares.toFixed(1)} ha</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
              This report distinguishes automatically detected estimates from government verified assessments.
              Figures are drawn from demo data and are not an official government record.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

interface ReportData {
  affectedFarms: number;
  totalAffectedHectares: number;
  verifiedFarms: number;
  pendingFarms: number;
  rejectedFarms: number;
  byCrop: { crop: string; hectares: number }[];
}

function buildReport(disasterId: string, detections: DetectionSummary[]): ReportData {
  const related = detections.filter((d) => d.disasterId === disasterId);

  const verifiedFarms = related.filter((d) => d.status === "verified_damage" || d.status === "field_validated").length;
  const rejectedFarms = related.filter((d) => d.status === "rejected").length;
  const pendingFarms = related.length - verifiedFarms - rejectedFarms;

  const cropTotals = new Map<string, number>();
  related.forEach((d) => {
    cropTotals.set(d.crop, (cropTotals.get(d.crop) ?? 0) + d.affectedAreaHectares);
  });

  return {
    affectedFarms: related.length,
    totalAffectedHectares: related.reduce((sum, d) => sum + d.affectedAreaHectares, 0),
    verifiedFarms,
    pendingFarms,
    rejectedFarms,
    byCrop: Array.from(cropTotals.entries())
      .map(([crop, hectares]) => ({ crop, hectares }))
      .sort((a, b) => b.hectares - a.hectares),
  };
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
