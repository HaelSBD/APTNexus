import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { api } from "./api";
import { ensureLocationPermission } from "./permissions";

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
      // Permission once: only prompts if still undetermined.
      const permission = await ensureLocationPermission();
      if (!permission.granted || cancelled) return;

      // Clocked-in: full-power trail. Idle (this watcher stops): no continuous GPS.
      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: highAccuracy ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced,
          timeInterval: highAccuracy ? 5000 : 20000,
          distanceInterval: highAccuracy ? 5 : 25,
          mayShowUserSettingsDialog: true,
        },
        async (pos) => {
          const now = Date.now();
          if (now - lastSent.current < (highAccuracy ? 4000 : 18000)) return;
          const meters = pos.coords.accuracy;
          if (highAccuracy && meters != null && meters > 45) return;
          lastSent.current = now;
          try {
            await api.ping({
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6)),
              accuracy: meters ?? null,
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
