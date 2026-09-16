import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import NetInfo from "@react-native-community/netinfo";
import { flushQueue, getQueueCount } from "../lib/offlineQueue";

interface SyncContextValue {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncError: string | null;
  syncNow: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const wasOffline = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await getQueueCount());
  }, []);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    setLastSyncError(null);
    try {
      const { stillPending } = await flushQueue();
      setPendingCount(stillPending);
      if (stillPending > 0) {
        setLastSyncError("Still offline, or the server could not be reached. Will retry automatically.");
      }
    } catch (err) {
      setLastSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  // Flush automatically the moment the device regains a network
  // connection, on top of the manual "Sync now" affordance, so evidence
  // captured in the field goes up as soon as it's able to without the
  // officer having to remember to trigger it.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (isOnline && wasOffline.current) {
        syncNow();
      }
      wasOffline.current = !isOnline;
    });
    return () => unsubscribe();
  }, [syncNow]);

  return (
    <SyncContext.Provider value={{ pendingCount, isSyncing, lastSyncError, syncNow, refreshPendingCount }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within a SyncProvider");
  return context;
}
