import { useRef, useState } from "react";
import type { FarmDetail, ImageryLayer } from "../types/farm";
import SimulatedSatelliteImage from "./SimulatedSatelliteImage";

interface ImageryViewerProps {
  farm: FarmDetail;
}

const LAYERS: { id: ImageryLayer; label: string }[] = [
  { id: "true_color", label: "True Color" },
  { id: "false_color", label: "False Color" },
  { id: "ndvi", label: "NDVI" },
  { id: "water", label: "Water" },
  { id: "damage_mask", label: "Damage Mask" },
];

type CompareMode = "swipe" | "side_by_side";

export default function ImageryViewer({ farm }: ImageryViewerProps) {
  const [layer, setLayer] = useState<ImageryLayer>("true_color");
  const [mode, setMode] = useState<CompareMode>("swipe");
  const [swipePosition, setSwipePosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(farm.afterDate);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const selectedReading = farm.readings.find((r) => r.date === selectedDate) ?? farm.readings[farm.readings.length - 1];
  const isAfterSelected = selectedDate === farm.afterDate;

  function handleDragStart() {
    isDragging.current = true;
  }

  function handleDragEnd() {
    isDragging.current = false;
  }

  function handleDragMove(clientX: number) {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * 100;
    setSwipePosition(Math.min(100, Math.max(0, relativeX)));
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-white ${isFullscreen ? "fixed inset-4 z-50 flex flex-col shadow-2xl" : ""}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {LAYERS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLayer(l.id)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                layer === l.id
                  ? "bg-agri-green text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border border-slate-300">
            <button
              onClick={() => setMode("swipe")}
              className={`px-3 py-1.5 text-xs font-medium ${
                mode === "swipe" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              Swipe
            </button>
            <button
              onClick={() => setMode("side_by_side")}
              className={`px-3 py-1.5 text-xs font-medium ${
                mode === "side_by_side" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              Side by side
            </button>
          </div>

          <div className="flex items-center gap-1 rounded border border-slate-300 px-1">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
              className="px-2 py-1 text-sm text-slate-600 hover:text-slate-900"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="min-w-[3ch] text-center text-xs text-slate-500">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="px-2 py-1 text-sm text-slate-600 hover:text-slate-900"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen((f) => !f)}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className={`relative bg-slate-950 ${isFullscreen ? "flex-1" : "aspect-[16/9]"}`}>
        <div
          className="h-full w-full overflow-hidden"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
        >
          {mode === "side_by_side" ? (
            <div className="grid h-full grid-cols-2 gap-0.5 bg-slate-800">
              <SimulatedSatelliteImage
                layer={layer}
                condition="healthy"
                label={`Before, ${formatDate(farm.beforeDate)}`}
                className="h-full"
              />
              <SimulatedSatelliteImage
                layer={layer}
                condition="damaged"
                label={`After, ${formatDate(farm.afterDate)}`}
                className="h-full"
              />
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative h-full w-full select-none"
              onMouseMove={(e) => handleDragMove(e.clientX)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
              onTouchEnd={handleDragEnd}
            >
              <SimulatedSatelliteImage
                layer={layer}
                condition="damaged"
                label={`After, ${formatDate(farm.afterDate)}`}
                className="absolute inset-0 h-full w-full"
              />
              <div
                className="absolute inset-0 h-full w-full"
                style={{ clipPath: `inset(0 ${100 - swipePosition}% 0 0)` }}
              >
                <SimulatedSatelliteImage
                  layer={layer}
                  condition="healthy"
                  label={`Before, ${formatDate(farm.beforeDate)}`}
                  className="h-full w-full"
                />
              </div>
              <div
                className="absolute top-0 h-full w-1 -translate-x-1/2 cursor-ew-resize bg-white shadow-lg"
                style={{ left: `${swipePosition}%` }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-md">
                  <span className="text-xs">↔</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date scrubber */}
      <div className="border-t border-slate-200 px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Observation date</span>
          <span>
            Cloud cover {selectedReading.cloudPercentage}%,{" "}
            {selectedReading.isUsable ? "usable" : "not usable"}
          </span>
        </div>
        <div className="flex gap-1">
          {farm.readings.map((r) => (
            <button
              key={r.date}
              onClick={() => setSelectedDate(r.date)}
              className={`flex-1 rounded py-2 text-center text-[11px] transition ${
                r.date === selectedDate
                  ? "bg-agri-green text-white"
                  : r.isUsable
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-50 text-slate-300"
              }`}
              disabled={!r.isUsable}
              title={r.isUsable ? "" : "Imagery not usable due to cloud cover"}
            >
              {formatDateShort(r.date)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          {isAfterSelected
            ? "Showing the most recent observation used in this detection."
            : "Showing a historical observation for reference."}
        </p>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
