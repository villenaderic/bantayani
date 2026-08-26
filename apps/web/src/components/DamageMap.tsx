import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { DetectionSummary } from "../types/detection";
import type { DamageSeverity } from "../types/farm";

const SEVERITY_COLOR: Record<DamageSeverity, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  significant: "#F59E0B",
  moderate: "#EAB308",
  low: "#16A34A",
};

interface DamageMapProps {
  detections: DetectionSummary[];
  selectedId: string | null;
  onSelect: (detection: DetectionSummary) => void;
}

const PHILIPPINES_CENTER: [number, number] = [12.8797, 121.774];

export default function DamageMap({ detections, selectedId, onSelect }: DamageMapProps) {
  return (
    <MapContainer center={PHILIPPINES_CENTER} zoom={6} className="h-full w-full" zoomControl={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClusteredMarkers detections={detections} selectedId={selectedId} onSelect={onSelect} />
    </MapContainer>
  );
}

function ClusteredMarkers({ detections, selectedId, onSelect }: DamageMapProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  const markerIcons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    return (severity: DamageSeverity, isSelected: boolean) => {
      const key = `${severity}-${isSelected}`;
      if (cache.has(key)) return cache.get(key)!;
      const color = SEVERITY_COLOR[severity];
      const size = isSelected ? 26 : 18;
      const icon = L.divIcon({
        className: "bantayani-marker",
        html: `<div style="
          width:${size}px;
          height:${size}px;
          border-radius:9999px;
          background:${color};
          border:2px solid white;
          box-shadow:0 0 0 ${isSelected ? 3 : 1}px rgba(0,0,0,0.15);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      cache.set(key, icon);
      return icon;
    };
  }, []);

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
      clusterGroupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    clusterGroup.clearLayers();

    detections.forEach((detection) => {
      const marker = L.marker([detection.lat, detection.lng], {
        icon: markerIcons(detection.severity, detection.id === selectedId),
      });
      marker.on("click", () => onSelect(detection));
      marker.bindTooltip(
        `${detection.farmId}, ${detection.severity.toUpperCase()}, ${detection.municipality}`,
        { direction: "top", offset: [0, -10] }
      );
      clusterGroup.addLayer(marker);
    });
  }, [detections, selectedId, markerIcons, onSelect]);

  return null;
}
