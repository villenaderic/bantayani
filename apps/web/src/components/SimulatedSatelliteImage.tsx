import type { ImageryLayer } from "../types/farm";

interface SimulatedSatelliteImageProps {
  layer: ImageryLayer;
  condition: "healthy" | "damaged";
  label: string;
  className?: string;
}

/**
 * Renders a stand in satellite image for demo mode.
 * This is a generated illustration, never a real satellite observation.
 * Once a real imagery provider is connected, this component should be
 * replaced by an actual image tile renderer behind the same layer prop.
 */
export default function SimulatedSatelliteImage({
  layer,
  condition,
  label,
  className = "",
}: SimulatedSatelliteImageProps) {
  const healthy = condition === "healthy";

  const palette = getPalette(layer, healthy);

  return (
    <div className={`relative overflow-hidden rounded-md bg-slate-900 ${className}`}>
      <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`bg-${layer}-${condition}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.bgFrom} />
            <stop offset="100%" stopColor={palette.bgTo} />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#bg-${layer}-${condition})`} />

        {/* field parcel grid */}
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 10 }).map((__, col) => {
            const x = col * 40;
            const y = row * 37.5;
            const cellHealthy = healthy || Math.random() > 0.55;
            return (
              <rect
                key={`${row}-${col}`}
                x={x}
                y={y}
                width={38}
                height={35.5}
                fill={cellHealthy ? palette.cellHealthy : palette.cellDamaged}
                opacity={0.85}
              />
            );
          })
        )}

        {/* parcel outline */}
        <rect x="6" y="6" width="388" height="288" fill="none" stroke={palette.outline} strokeWidth="3" />

        {layer === "damage_mask" && !healthy && (
          <g opacity="0.65">
            <ellipse cx="150" cy="150" rx="90" ry="60" fill="#DC2626" />
            <ellipse cx="260" cy="110" rx="55" ry="35" fill="#DC2626" />
          </g>
        )}
      </svg>

      <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
        Simulated image, demo data
      </div>
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {label}
      </div>
    </div>
  );
}

function getPalette(layer: ImageryLayer, healthy: boolean) {
  switch (layer) {
    case "ndvi":
      return {
        bgFrom: healthy ? "#14532D" : "#7C2D12",
        bgTo: healthy ? "#166534" : "#92400E",
        cellHealthy: "#22C55E",
        cellDamaged: "#CA8A04",
        outline: "#F0FDF4",
      };
    case "water":
      return {
        bgFrom: healthy ? "#0C4A6E" : "#0369A1",
        bgTo: healthy ? "#075985" : "#0EA5E9",
        cellHealthy: "#38BDF8",
        cellDamaged: "#1D4ED8",
        outline: "#E0F2FE",
      };
    case "damage_mask":
      return {
        bgFrom: "#1E293B",
        bgTo: "#334155",
        cellHealthy: "#475569",
        cellDamaged: "#64748B",
        outline: "#F1F5F9",
      };
    case "false_color":
      return {
        bgFrom: healthy ? "#7F1D1D" : "#3F3F46",
        bgTo: healthy ? "#B91C1C" : "#52525B",
        cellHealthy: "#EF4444",
        cellDamaged: "#71717A",
        outline: "#FEF2F2",
      };
    case "true_color":
    default:
      return {
        bgFrom: healthy ? "#3F6212" : "#57534E",
        bgTo: healthy ? "#4D7C0F" : "#78716C",
        cellHealthy: "#65A30D",
        cellDamaged: "#A8A29E",
        outline: "#F7FEE7",
      };
  }
}
