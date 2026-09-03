import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { fetchAnalyticsSummary, fetchDetections } from "../lib/api";
import { SeverityBadge, StatusBadge } from "../components/StatusBadges";
import type { AnalyticsSummary, DetectionSummary } from "../types/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { RootStackParamList, TabParamList } from "../../App";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Dashboard">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [detections, setDetections] = useState<DetectionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [summaryData, detectionsData] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchDetections(),
      ]);
      setSummary(summaryData);
      const sorted = [...detectionsData].sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, significant: 2, moderate: 3, low: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      setDetections(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleRefresh() {
    setIsRefreshing(true);
    load();
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1F6B3B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>BantayAni</Text>
          <Text style={styles.headerSubtitle}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {summary && (
        <View style={styles.statsGrid}>
          <StatCard label="Active incidents" value={String(summary.activeIncidents)} />
          <StatCard label="Critical" value={String(summary.criticalIncidents)} tone="critical" />
          <StatCard label="Potential damage" value={`${summary.potentialDamageHa.toFixed(0)} ha`} />
          <StatCard label="Verified" value={`${summary.verifiedDamageHa.toFixed(0)} ha`} tone="verified" />
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent detections</Text>

      <FlatList
        data={detections}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("FarmInspection", { detectionId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.farmId}</Text>
              <SeverityBadge severity={item.severity} />
            </View>
            <Text style={styles.cardSubtitle}>
              {item.damageType}, {item.municipality}, {item.province}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMeta}>
                {item.confidence}% confidence, {item.affectedAreaHectares.toFixed(1)} ha affected
              </Text>
              <StatusBadge status={item.status} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "critical" | "verified";
}) {
  const color = tone === "critical" ? "#DC2626" : tone === "verified" ? "#059669" : "#1E293B";
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
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
  signOut: {
    fontSize: 13,
    color: "#64748B",
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMeta: {
    fontSize: 12,
    color: "#94A3B8",
    flexShrink: 1,
    marginRight: 8,
  },
});
