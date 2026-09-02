import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  fetchDetections,
  fieldValidateDetection,
  rejectDetection,
  verifyDetection,
} from "../lib/api";
import { SeverityBadge, StatusBadge } from "../components/StatusBadges";
import type { DetectionSummary, DetectionStatus } from "../types/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "FarmInspection">;

const VIEWER_ROLE = "viewer";
const REVIEWER_ROLES = new Set([
  "national_administrator",
  "regional_officer",
  "provincial_officer",
  "municipal_agriculture_officer",
  "gis_analyst",
  "field_validator",
]);

export default function FarmInspectionScreen({ route }: Props) {
  const { detectionId } = route.params;
  const { user } = useAuth();
  const [detection, setDetection] = useState<DetectionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDetections()
      .then((all) => {
        if (cancelled) return;
        setDetection(all.find((d) => d.id === detectionId) ?? null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detectionId]);

  async function handleAction(action: "verify" | "reject" | "field-validation") {
    if (!detection) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      const updater = { verify: verifyDetection, reject: rejectDetection, "field-validation": fieldValidateDetection }[
        action
      ];
      const updated = await updater(detection.id);
      setDetection(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1F6B3B" />
      </View>
    );
  }

  if (!detection) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Detection not found.</Text>
      </View>
    );
  }

  const isDecided: boolean = (["verified_damage", "field_validated", "rejected"] as DetectionStatus[]).includes(
    detection.status
  );
  const canAct = user ? REVIEWER_ROLES.has(user.role) && user.role !== VIEWER_ROLE : false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.farmId}>{detection.farmId}</Text>
      <Text style={styles.location}>
        {detection.barangay}, {detection.municipality}, {detection.province}
      </Text>

      <View style={styles.badgeRow}>
        <SeverityBadge severity={detection.severity} />
        <StatusBadge status={detection.status} />
      </View>

      <View style={styles.summaryCard}>
        <SummaryRow label="Damage type" value={detection.damageType} />
        <SummaryRow label="Confidence" value={`${detection.confidence}%`} />
        <SummaryRow label="Affected area" value={`${detection.affectedAreaHectares.toFixed(1)} ha`} />
        <SummaryRow label="Total farm area" value={`${detection.areaHectares.toFixed(1)} ha`} />
        <SummaryRow label="Crop" value={detection.crop} />
        <SummaryRow label="Detection date" value={detection.detectionDate} />
      </View>

      <Text style={styles.disclaimer}>
        This is an automated, satellite based estimate. It requires government review before it is
        treated as confirmed damage.
      </Text>

      {!canAct ? (
        <Text style={styles.permissionNote}>
          {user
            ? "Viewer accounts are read only and cannot record a verification decision."
            : "Sign in with a government account to record a verification decision."}
        </Text>
      ) : (
        <View style={styles.actions}>
          <ActionButton
            label="Verify damage"
            color="#1F6B3B"
            disabled={isDecided || isSubmitting}
            onPress={() => handleAction("verify")}
          />
          <ActionButton
            label="Reject"
            color="#64748B"
            disabled={isDecided || isSubmitting}
            onPress={() => handleAction("reject")}
          />
          <ActionButton
            label="Needs field validation"
            color="#0369A1"
            disabled={isDecided || isSubmitting}
            onPress={() => handleAction("field-validation")}
          />
        </View>
      )}

      {actionError && <Text style={styles.errorText}>{actionError}</Text>}
      {isDecided && <Text style={styles.decidedNote}>This detection has already been decided.</Text>}
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  color,
  disabled,
  onPress,
}: {
  label: string;
  color: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: disabled ? "#CBD5E1" : color }]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
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
  notFound: {
    color: "#64748B",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  farmId: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  location: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#94A3B8",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  disclaimer: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 20,
    lineHeight: 18,
  },
  permissionNote: {
    fontSize: 13,
    color: "#B45309",
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 8,
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 12,
  },
  decidedNote: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 12,
    textAlign: "center",
  },
});
