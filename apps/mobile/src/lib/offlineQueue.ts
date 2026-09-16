import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { submitFieldEvidence } from "./api";

const QUEUE_STORAGE_KEY = "bantayani_pending_evidence";
const EVIDENCE_DIR = `${FileSystem.documentDirectory}field-evidence/`;

export interface PendingEvidence {
  id: string;
  detectionId: string;
  localPhotoUri: string;
  notes?: string;
  gpsLat?: number;
  gpsLng?: number;
  capturedAt: string;
  lastError?: string;
}

async function ensureEvidenceDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(EVIDENCE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(EVIDENCE_DIR, { intermediates: true });
  }
}

/**
 * Copies a picked photo out of the image picker's cache location into
 * this app's own document directory, so it survives long enough to be
 * uploaded later, the cache the picker returned it in is not guaranteed
 * to still exist by the time connectivity comes back.
 */
async function persistPhoto(sourceUri: string, evidenceId: string): Promise<string> {
  await ensureEvidenceDir();
  const extensionMatch = /\.(\w+)$/.exec(sourceUri);
  const extension = extensionMatch ? extensionMatch[1] : "jpg";
  const destination = `${EVIDENCE_DIR}${evidenceId}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

async function readQueue(): Promise<PendingEvidence[]> {
  const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingEvidence[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingEvidence[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<PendingEvidence[]> {
  return readQueue();
}

export async function getQueueCount(): Promise<number> {
  return (await readQueue()).length;
}

/**
 * Saves a field evidence submission for later, used when submitting it
 * immediately failed for what looks like a connectivity reason. The
 * photo is copied to persistent local storage so it is still there
 * whenever the queue is next flushed, on app start, when connectivity
 * returns, or when the officer taps "Sync now".
 */
export async function enqueueEvidence(entry: {
  detectionId: string;
  photoUri: string;
  notes?: string;
  gpsLat?: number;
  gpsLng?: number;
}): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const localPhotoUri = await persistPhoto(entry.photoUri, id);
  const queue = await readQueue();
  queue.push({
    id,
    detectionId: entry.detectionId,
    localPhotoUri,
    notes: entry.notes,
    gpsLat: entry.gpsLat,
    gpsLng: entry.gpsLng,
    capturedAt: new Date().toISOString(),
  });
  await writeQueue(queue);
}

/**
 * Attempts to upload every queued submission. Entries that succeed are
 * removed from the queue and their local photo copy is deleted; entries
 * that still fail (still offline, or a real server error) stay queued
 * with the latest error message attached, to retry on the next flush.
 * Returns how many succeeded and how many are still pending.
 */
export async function flushQueue(): Promise<{ succeeded: number; stillPending: number }> {
  const queue = await readQueue();
  if (queue.length === 0) return { succeeded: 0, stillPending: 0 };

  const remaining: PendingEvidence[] = [];
  let succeeded = 0;

  for (const entry of queue) {
    try {
      await submitFieldEvidence(entry.detectionId, entry.localPhotoUri, {
        notes: entry.notes,
        gpsLat: entry.gpsLat,
        gpsLng: entry.gpsLng,
      });
      succeeded += 1;
      await FileSystem.deleteAsync(entry.localPhotoUri, { idempotent: true });
    } catch (err) {
      remaining.push({
        ...entry,
        lastError: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }

  await writeQueue(remaining);
  return { succeeded, stillPending: remaining.length };
}

/**
 * A network request that failed to even reach the server (no
 * connectivity, DNS failure, timed out) throws a generic TypeError or
 * an AbortError in React Native's fetch, distinct from a response that
 * came back with a non-2xx status, which submitFieldEvidence already
 * turns into an Error carrying the server's own message. This is how
 * FieldEvidenceCapture decides whether to queue an entry for later
 * versus show the officer a real, actionable error right away.
 */
export function looksLikeConnectivityError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "AbortError") return true;
  return /network request failed|failed to fetch|network error/i.test(err.message);
}
