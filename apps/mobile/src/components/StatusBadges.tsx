import { StyleSheet, Text, View } from "react-native";
import type { DamageSeverity, DetectionStatus } from "../types/api";

const SEVERITY_COLORS: Record<DamageSeverity, { bg: string; text: string }> = {
  critical: { bg: "#FEE2E2", text: "#B91C1C" },
  high: { bg: "#FFEDD5", text: "#C2410C" },
  significant: { bg: "#FEF3C7", text: "#B45309" },
  moderate: { bg: "#FEF9C3", text: "#A16207" },
  low: { bg: "#D1FAE5", text: "#047857" },
};

const STATUS_LABELS: Record<DetectionStatus, string> = {
  automated_detection: "Automated",
  potential_damage: "Potential damage",
  under_government_review: "Under review",
  verified_damage: "Verified",
  field_validated: "Field validated",
  rejected: "Rejected",
};

export function SeverityBadge({ severity }: { severity: DamageSeverity }) {
  const colors = SEVERITY_COLORS[severity];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{severity.toUpperCase()}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: DetectionStatus }) {
  return (
    <View style={[styles.badge, styles.statusBadge]}>
      <Text style={[styles.badgeText, styles.statusText]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadge: {
    backgroundColor: "#F1F5F9",
  },
  statusText: {
    color: "#475569",
    fontWeight: "600",
  },
});
