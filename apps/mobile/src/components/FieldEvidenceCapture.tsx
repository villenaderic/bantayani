import { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { submitFieldEvidence } from "../lib/api";
import { enqueueEvidence, looksLikeConnectivityError } from "../lib/offlineQueue";
import { useSync } from "../context/SyncContext";

interface FieldEvidenceCaptureProps {
  detectionId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

type GpsState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "found"; lat: number; lng: number }
  | { status: "unavailable" };

export default function FieldEvidenceCapture({ detectionId, onSubmitted, onCancel }: FieldEvidenceCaptureProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [gps, setGps] = useState<GpsState>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshPendingCount } = useSync();

  async function pickPhoto(source: "camera" | "library") {
    setError(null);
    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError(
          source === "camera"
            ? "Camera permission was not granted."
            : "Photo library permission was not granted."
        );
        return;
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

      if (result.canceled || !result.assets?.[0]) return;

      setPhotoUri(result.assets[0].uri);
      captureLocation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the camera or photo library.");
    }
  }

  async function captureLocation() {
    setGps({ status: "locating" });
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setGps({ status: "unavailable" });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGps({ status: "found", lat: position.coords.latitude, lng: position.coords.longitude });
    } catch {
      setGps({ status: "unavailable" });
    }
  }

  async function handleSubmit() {
    if (!photoUri) return;
    setIsSubmitting(true);
    setError(null);
    const evidence = {
      notes: notes.trim() || undefined,
      gpsLat: gps.status === "found" ? gps.lat : undefined,
      gpsLng: gps.status === "found" ? gps.lng : undefined,
    };
    try {
      await submitFieldEvidence(detectionId, photoUri, evidence);
      onSubmitted();
    } catch (err) {
      if (looksLikeConnectivityError(err)) {
        // No connection right now, save it on the device instead of
        // losing the photo and GPS fix, it will upload automatically
        // once the app is back online, or when the officer taps "Sync
        // now" on the pending evidence banner.
        try {
          await enqueueEvidence({ detectionId, photoUri, ...evidence });
          await refreshPendingCount();
          onSubmitted();
          return;
        } catch (queueErr) {
          setError(queueErr instanceof Error ? queueErr.message : "Could not save this evidence for later.");
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Failed to submit field evidence.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!photoUri) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Add field evidence</Text>
        <Text style={styles.hint}>
          Take a photo or choose one from your library to confirm this detection in person.
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => pickPhoto("camera")}>
            <Text style={styles.secondaryButtonText}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => pickPhoto("library")}>
            <Text style={styles.secondaryButtonText}>Choose from library</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Add field evidence</Text>
      <Image source={{ uri: photoUri }} style={styles.preview} />

      <View style={styles.gpsRow}>
        {gps.status === "locating" && (
          <>
            <ActivityIndicator size="small" color="#64748B" />
            <Text style={styles.gpsText}>Getting your location...</Text>
          </>
        )}
        {gps.status === "found" && (
          <Text style={styles.gpsText}>
            Location captured: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
          </Text>
        )}
        {gps.status === "unavailable" && (
          <Text style={styles.gpsText}>Location unavailable, evidence will be submitted without GPS.</Text>
        )}
      </View>

      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Add a note about what you observed"
        placeholderTextColor="#94A3B8"
        style={styles.notesInput}
        multiline
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit evidence</Text>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setPhotoUri(null)} disabled={isSubmitting}>
        <Text style={styles.cancelText}>Choose a different photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginTop: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#0369A1",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#0369A1",
    fontSize: 13,
    fontWeight: "600",
  },
  cancelText: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#F1F5F9",
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  gpsText: {
    fontSize: 12,
    color: "#64748B",
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#1F6B3B",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginBottom: 8,
  },
});
