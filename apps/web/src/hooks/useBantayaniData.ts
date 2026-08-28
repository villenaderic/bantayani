import { useEffect, useState } from "react";
import { fetchDetections, fetchDisasters } from "../lib/api";
import { demoDetections } from "../data/demoDetections";
import { demoDisasters } from "../data/demoDisasters";
import type { DetectionSummary } from "../types/detection";
import type { DisasterEvent } from "../types/disaster";

interface BantayaniData {
  detections: DetectionSummary[];
  disasters: DisasterEvent[];
  isLoading: boolean;
  isLive: boolean;
}

export function useBantayaniData(): BantayaniData {
  const [detections, setDetections] = useState<DetectionSummary[]>(demoDetections);
  const [disasters, setDisasters] = useState<DisasterEvent[]>(demoDisasters);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [liveDetections, liveDisasters] = await Promise.all([fetchDetections(), fetchDisasters()]);
        if (cancelled) return;
        setDetections(liveDetections);
        setDisasters(liveDisasters);
        setIsLive(true);
      } catch {
        if (cancelled) return;
        // Backend not reachable. Keep the bundled demo data already in state
        // so the interface stays fully usable without a running API.
        setIsLive(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { detections, disasters, isLoading, isLive };
}
