import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { DetectionSummary } from "../types/detection";
import type { DamageSeverity } from "../types/farm";
import { generateFarmPolygon } from "../lib/geometry";

const SEVERITY_COLOR: Record<DamageSeverity, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  significant: "#F59E0B",
  moderate: "#EAB308",
  low: "#16A34A",
};

// Below this zoom level the map shows clustered points, since individual
// farm polygons are too small to read and too numerous to render cheaply
// at a national scale. At or above it, actual farm boundaries are drawn.
// This matches the zoom dependent level of detail described in section 72
// of the project specification.
const POLYGON_ZOOM_THRESHOLD = 12;

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
      <DamageLayers detections={detections} selectedId={selectedId} onSelect={onSelect} />
    </MapContainer>
  );
}

function DamageLayers(props: DamageMapProps) {
  const [zoom, setZoom] = useState(6);

  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom()),
  });

  const showPolygons = zoom >= POLYGON_ZOOM_THRESHOLD;

  return showPolygons ? <FarmPolygons {...props} /> : <ClusteredMarkers {...props} />;
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
      disableClusteringAtZoom: POLYGON_ZOOM_THRESHOLD,
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

function FarmPolygons({ detections, selectedId, onSelect }: DamageMapProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const layerGroup = L.layerGroup();
    layerGroupRef.current = layerGroup;
    map.addLayer(layerGroup);

    return () => {
      map.removeLayer(layerGroup);
      layerGroupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    detections.forEach((detection) => {
      const boundary =
        detection.boundary && detection.boundary.length >= 3
          ? detection.boundary
          : generateFarmPolygon(detection.farmId, detection.lat, detection.lng, detection.areaHectares);

      const isSelected = detection.id === selectedId;
      const color = SEVERITY_COLOR[detection.severity];

      const polygon = L.polygon(boundary as L.LatLngExpression[], {
        color,
        weight: isSelected ? 3 : 1.5,
        fillColor: color,
        fillOpacity: isSelected ? 0.5 : 0.3,
      });

      polygon.on("click", () => onSelect(detection));
      polygon.bindTooltip(
        `${detection.farmId}, ${detection.crop}, ${detection.severity.toUpperCase()}, ${detection.affectedAreaHectares.toFixed(1)} ha affected`,
        { sticky: true }
      );

      layerGroup.addLayer(polygon);
    });
  }, [detections, selectedId, onSelect]);

  return null;
}
