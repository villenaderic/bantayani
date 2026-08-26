import type { TimelineEntry } from "../types/farm";

interface TimelineProps {
  entries: TimelineEntry[];
}

export default function Timeline({ entries }: TimelineProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Observation timeline</h3>
      <ol className="space-y-4">
        {entries.map((entry, index) => (
          <li key={entry.date} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                  entry.isDetectionEvent ? "bg-red-500" : "bg-agri-green"
                }`}
              />
              {index < entries.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-slate-200" />}
            </div>
            <div className="pb-2">
              <p className="text-xs text-slate-400">{formatDate(entry.date)}</p>
              <p className={`text-sm font-medium ${entry.isDetectionEvent ? "text-red-600" : "text-slate-800"}`}>
                {entry.label}
              </p>
              <p className="text-xs text-slate-500">{entry.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
