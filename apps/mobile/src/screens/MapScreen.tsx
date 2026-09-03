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

function buildMapHtml(detections: DetectionSummary[]): string {
  const points = detections.map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    color: SEVERITY_COLOR[d.severity] ?? "#94A3B8",
    label: `${d.farmId}, ${d.severity.toUpperCase()}, ${d.municipality}`,
  }));

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const map = L.map('map').setView([${PHILIPPINES_CENTER[0]}, ${PHILIPPINES_CENTER[1]}], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const points = ${JSON.stringify(points)};
      points.forEach(function (p) {
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: 8,
          color: '#fff',
          weight: 2,
          fillColor: p.color,
          fillOpacity: 0.9
        }).addTo(map);
        marker.bindTooltip(p.label);
        marker.on('click', function () {
          window.ReactNativeWebView.postMessage(JSON.stringify({ detectionId: p.id }));
        });
      });
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
