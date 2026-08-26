import { useState } from "react";
import type { DetectionStatus } from "../types/farm";
import { StatusBadge } from "./StatusBadges";

interface VerificationControlsProps {
  status: DetectionStatus;
  onStatusChange: (status: DetectionStatus) => void;
}

export default function VerificationControls({ status, onStatusChange }: VerificationControlsProps) {
  const [comment, setComment] = useState("");
  const isDecided = status === "verified_damage" || status === "field_validated" || status === "rejected";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Verification</h3>
        <StatusBadge status={status} />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a review comment before recording a decision"
        className="mb-3 w-full rounded border border-slate-200 p-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-agri-green focus:outline-none"
        rows={3}
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onStatusChange("verified_damage")}
          disabled={isDecided}
          className="rounded bg-agri-green px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Verify damage
        </button>
        <button
          onClick={() => onStatusChange("rejected")}
          disabled={isDecided}
          className="rounded bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={() => onStatusChange("field_validated")}
          disabled={isDecided}
          className="rounded border border-agri-green px-3 py-2 text-xs font-semibold text-agri-green disabled:cursor-not-allowed disabled:opacity-50"
        >
          Request field validation
        </button>
      </div>

      {isDecided && (
        <p className="mt-3 text-xs text-slate-400">
          This detection has been recorded. The decision and comment are written to the audit log.
        </p>
      )}
    </div>
  );
}
