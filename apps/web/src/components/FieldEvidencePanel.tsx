import { useEffect, useState } from "react";
import { fetchFieldEvidence, resolveMediaUrl, type FieldEvidenceItem } from "../lib/api";

interface FieldEvidencePanelProps {
  detectionId: string;
}

export default function FieldEvidencePanel({ detectionId }: FieldEvidencePanelProps) {
  const [entries, setEntries] = useState<FieldEvidenceItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    fetchFieldEvidence(detectionId)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load field evidence");
      });
    return () => {
      cancelled = true;
    };
  }, [detectionId]);

  if (error) return null; // Non-live backend or a genuine failure, stay quiet rather than clutter the page.
  if (!entries || entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">
        Field evidence, {entries.length} {entries.length === 1 ? "photo" : "photos"}
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        Submitted by field officers, separate from the satellite based detection above.
      </p>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-3 border-t border-slate-100 pt-3 first:border-0 first:pt-0">
            <button
              onClick={() => setExpandedPhoto(resolveMediaUrl(entry.photoUrl))}
              className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-slate-200"
            >
              <img
                src={resolveMediaUrl(entry.photoUrl)}
                alt="Field evidence"
                className="h-full w-full object-cover"
              />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-700">{entry.userName}</p>
              <p className="text-xs text-slate-400">{formatDateTime(entry.createdAt)}</p>
              {entry.gpsLat !== null && entry.gpsLng !== null && (
                <p className="text-xs text-slate-400">
                  {entry.gpsLat.toFixed(5)}, {entry.gpsLng.toFixed(5)}
                </p>
              )}
              {entry.notes && <p className="mt-1 text-sm text-slate-600">{entry.notes}</p>}
            </div>
          </div>
        ))}
      </div>

      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setExpandedPhoto(null)}
        >
          <img src={expandedPhoto} alt="Field evidence, full size" className="max-h-full max-w-full rounded" />
        </div>
      )}
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
