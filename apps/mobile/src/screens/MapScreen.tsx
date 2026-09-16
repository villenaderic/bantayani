import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { fetchDetections } from "../lib/api";
import type { DetectionSummary } from "../types/api";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList, TabParamList } from "../../App";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Map">,
  NativeStackScreenProps<RootStackParamList>
>;

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  significant: "#F59E0B",
  moderate: "#EAB308",
  low: "#16A34A",
};

const PHILIPPINES_CENTER: [number, number] = [12.8797, 121.774];

// Matches POLYGON_ZOOM_THRESHOLD in apps/web/src/components/DamageMap.tsx:
// clustered points at country/region scale, actual farm boundaries once
// zoomed in far enough for them to be legible and worth rendering.
const POLYGON_ZOOM_THRESHOLD = 12;

function buildMapHtml(detections: DetectionSummary[]): string {
  const points = detections.map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    color: SEVERITY_COLOR[d.severity] ?? "#94A3B8",
    label: `${d.farmId}, ${d.severity.toUpperCase()}, ${d.municipality}`,
    boundary: d.boundary && d.boundary.length >= 3 ? d.boundary : null,
    areaHectares: d.affectedAreaHectares,
  }));

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      .bantayani-cluster {
        background: rgba(31, 107, 59, 0.85);
        border-radius: 9999px;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-family: -apple-system, Roboto, sans-serif;
        border: 2px solid #fff;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
    <script>
      const map = L.map('map').setView([${PHILIPPINES_CENTER[0]}, ${PHILIPPINES_CENTER[1]}], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const points = ${JSON.stringify(points)};

      function notifySelected(id) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ detectionId: id }));
      }

      // Fallback square around the pin when a farm has no real boundary
      // recorded yet, roughly sized from its affected area, same idea as
      // apps/web/src/lib/geometry.ts's generateFarmPolygon, simplified.
      function fallbackBoundary(p) {
        const sideKm = Math.max(0.05, Math.sqrt(Math.max(p.areaHectares, 0.5) * 0.01));
        const dLat = sideKm / 111;
        const dLng = sideKm / (111 * Math.cos((p.lat * Math.PI) / 180));
        return [
          [p.lat - dLat, p.lng - dLng],
          [p.lat - dLat, p.lng + dLng],
          [p.lat + dLat, p.lng + dLng],
          [p.lat + dLat, p.lng - dLng],
        ];
      }

      const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        disableClusteringAtZoom: ${POLYGON_ZOOM_THRESHOLD},
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          const size = count >= 20 ? 42 : count >= 8 ? 36 : 30;
          return L.divIcon({
            html: '<div class="bantayani-cluster" style="width:' + size + 'px;height:' + size + 'px;">' + count + '</div>',
            className: '',
            iconSize: [size, size],
          });
        },
      });

      points.forEach(function (p) {
        const marker = L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;border-radius:9999px;background:' + p.color + ';border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.15);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        });
        marker.bindTooltip(p.label);
        marker.on('click', function () { notifySelected(p.id); });
        clusterGroup.addLayer(marker);
      });
      map.addLayer(clusterGroup);

      const polygonLayer = L.layerGroup();
      points.forEach(function (p) {
        const boundary = p.boundary || fallbackBoundary(p);
        const polygon = L.polygon(boundary, {
          color: p.color,
          weight: 1.5,
          fillColor: p.color,
          fillOpacity: 0.35,
        });
        polygon.bindTooltip(p.label);
        polygon.on('click', function () { notifySelected(p.id); });
        polygonLayer.addLayer(polygon);
      });

      function applyZoomLayers() {
        const showPolygons = map.getZoom() >= ${POLYGON_ZOOM_THRESHOLD};
        if (showPolygons) {
          if (map.hasLayer(clusterGroup)) map.removeLayer(clusterGroup);
          if (!map.hasLayer(polygonLayer)) map.addLayer(polygonLayer);
        } else {
          if (map.hasLayer(polygonLayer)) map.removeLayer(polygonLayer);
          if (!map.hasLayer(clusterGroup)) map.addLayer(clusterGroup);
        }
      }
      map.on('zoomend', applyZoomLayers);
      applyZoomLayers();
    </script>
  </body>
</html>
`;
}

export default function MapScreen({ navigation }: Props) {
  const [detections, setDetections] = useState<DetectionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchDetections()
      .then(setDetections)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load the map"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as { detectionId: string };
      navigation.navigate("FarmInspection", { detectionId: payload.detectionId });
    } catch {
      // Ignore malformed messages from the WebView bridge.
    }
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!detections) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1F6B3B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Map</Text>
        <Text style={styles.headerSubtitle}>{detections.length} detections</Text>
      </View>
      <WebView
        originWhitelist={["*"]}
        source={{ html: buildMapHtml(detections) }}
        onMessage={handleMessage}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  errorText: {
    color: "#DC2626",
    paddingHorizontal: 24,
    textAlign: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  webview: {
    flex: 1,
  },
});
