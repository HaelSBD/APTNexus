import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { api } from "./api";

export function useDutyTracking(clockedIn, highAccuracy = false) {
  const subRef = useRef(null);
  const lastSent = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const stop = async () => {
      if (subRef.current) {
        subRef.current.remove();
        subRef.current = null;
      }
    };

    const start = async () => {
      if (!clockedIn) {
        await stop();
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted" || cancelled) return;
      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval: highAccuracy ? 8000 : 20000,
          distanceInterval: highAccuracy ? 10 : 25,
        },
        async (pos) => {
          const now = Date.now();
          if (now - lastSent.current < (highAccuracy ? 7000 : 18000)) return;
          lastSent.current = now;
          try {
            await api.ping({
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6)),
              accuracy: pos.coords.accuracy || null,
              speed: pos.coords.speed ?? null,
              heading: pos.coords.heading ?? null,
            });
          } catch {
            // Keep walking even if one ping drops.
          }
        },
      );
    };

    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [clockedIn, highAccuracy]);
}
