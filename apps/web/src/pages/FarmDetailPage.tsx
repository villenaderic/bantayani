import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useBantayaniData } from "../hooks/useBantayaniData";
import { generateFarmDetail } from "../data/generateFarmDetail";
import ImageryViewer from "../components/ImageryViewer";
import RemoteSensingPanel from "../components/RemoteSensingPanel";
import Timeline from "../components/Timeline";
import VerificationControls from "../components/VerificationControls";
import { SeverityBadge, StatusBadge } from "../components/StatusBadges";
import { verifyDetection, rejectDetection, fieldValidateDetection } from "../lib/api";
import type { DetectionStatus, FarmDetail } from "../types/farm";

export default function FarmDetailPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const { detections, isLive } = useBantayaniData();
  const summary = useMemo(() => detections.find((d) => d.farmId === farmId), [detections, farmId]);
  const initialFarm = useMemo(() => (summary ? generateFarmDetail(summary) : null), [summary]);
  const [farm, setFarm] = useState<FarmDetail | null>(initialFarm);

  if (initialFarm && farm?.farmId !== initialFarm.farmId) {
    setFarm(initialFarm);
  }

  if (!farm) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="text-sm text-slate-500">No farm record found for {farmId ?? "this ID"}.</p>
        <Link to="/" className="text-sm font-medium text-agri-green hover:underline">
          Back to map
        </Link>
      </div>
    );
  }

  async function handleStatusChange(status: DetectionStatus) {
    setFarm((prev) => (prev ? { ...prev, detectionStatus: status } : prev));

    if (!isLive || !summary) return;

    try {
      if (status === "verified_damage") await verifyDetection(summary.id);
      else if (status === "rejected") await rejectDetection(summary.id);
      else if (status === "field_validated") await fieldValidateDetection(summary.id);
    } catch {
      // The backend call failed after the local update already applied.
      // The status change still reflects in this session; it will not
      // persist server side until connectivity to the backend is restored.
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">
              &larr; Back to map
            </Link>
            <h1 className="mt-1 text-xl font-semibold text-slate-800">
              Farm {farm.farmId}
            </h1>
            <p className="text-sm text-slate-500">
              {farm.barangay}, {farm.municipality}, {farm.province}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={farm.severity} />
            <StatusBadge status={farm.detectionStatus} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SummaryStat label="Damage type" value={farm.damageType} />
              <SummaryStat label="Confidence" value={`${farm.confidence}%`} />
              <SummaryStat label="Affected area" value={`${farm.affectedAreaHectares} ha`} />
              <SummaryStat label="Total farm area" value={`${farm.areaHectares} ha`} />
              <SummaryStat label="Crop" value={farm.crop} />
              <SummaryStat label="Crop stage" value={farm.cropStage} />
              <SummaryStat label="Detection date" value={formatDate(farm.detectionDate)} />
              <SummaryStat label="Last observation" value={formatDate(farm.lastObservationDate)} />
            </div>
          </div>

          <ImageryViewer farm={farm} />

          <Timeline entries={farm.timeline} />
        </div>

        <div className="space-y-4">
          <RemoteSensingPanel farm={farm} />
          <VerificationControls status={farm.detectionStatus} onStatusChange={handleStatusChange} />
        </div>
      </main>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
