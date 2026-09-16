import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSync } from "../context/SyncContext";

/**
 * Shown at the top of the dashboard and the farm inspection screen
 * whenever field evidence is waiting to be uploaded, either still
 * offline or the last automatic attempt failed. Tapping it retries
 * immediately rather than waiting for the next connectivity change.
 */
export default function PendingSyncBanner() {
  const { pendingCount, isSyncing, lastSyncError, syncNow } = useSync();

  if (pendingCount === 0 && !isSyncing) return null;

  return (
    <TouchableOpacity style={styles.banner} onPress={syncNow} disabled={isSyncing} activeOpacity={0.8}>
      {isSyncing ? <ActivityIndicator size="small" color="#B45309" /> : null}
      <View style={styles.textColumn}>
        <Text style={styles.title}>
          {isSyncing
            ? "Syncing field evidence..."
            : `${pendingCount} field evidence submission${pendingCount === 1 ? "" : "s"} waiting to sync`}
        </Text>
        {!isSyncing && (
          <Text style={styles.subtitle}>{lastSyncError ?? "Saved on this device. Tap to sync now."}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },
  subtitle: {
    fontSize: 12,
    color: "#B45309",
    marginTop: 1,
  },
});
