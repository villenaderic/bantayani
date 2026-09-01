import { useEffect, useState } from "react";
import { fetchFarms, type FarmRecord } from "../lib/api";
import { demoDetections } from "../data/demoDetections";
import { useAuth } from "../context/AuthContext";

function demoFarmRecords(): FarmRecord[] {
  // The bundled demo dataset only ever has farms that already have a
  // detection, there is no offline equivalent of a CSV imported farm
  // with no detection yet, so every demo record gets one here.
  return demoDetections.map((d) => ({
    farmId: d.farmId,
    lat: d.lat,
    lng: d.lng,
    boundary: [],
    region: d.region,
    province: d.province,
    municipality: d.municipality,
    barangay: d.barangay,
    crop: d.crop,
    areaHectares: d.areaHectares,
    detection: {
      id: d.id,
      damageType: d.damageType,
      severity: d.severity,
      status: d.status,
      confidence: d.confidence,
      affectedAreaHectares: d.affectedAreaHectares,
      detectionDate: d.detectionDate,
      disasterId: d.disasterId ?? null,
    },
  }));
}

interface FarmsData {
  farms: FarmRecord[];
  isLoading: boolean;
  isLive: boolean;
}

export function useFarms(): FarmsData {
  const { user, isCheckingSession } = useAuth();
  const [farms, setFarms] = useState<FarmRecord[]>(demoFarmRecords());
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (isCheckingSession) return;

    let cancelled = false;

    fetchFarms()
      .then((data) => {
        if (cancelled) return;
        setFarms(data);
        setIsLive(true);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLive(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingSession, user?.id]);

  return { farms, isLoading, isLive };
}
