import * as Location from "expo-location";
import { ensureLocationPermission } from "./permissions";

const wait = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));

const toFix = (pos) => {
  if (!pos?.coords) return null;
  return {
    lat: Number(pos.coords.latitude.toFixed(6)),
    lng: Number(pos.coords.longitude.toFixed(6)),
    accuracy: pos.coords.accuracy || null,
    speed: pos.coords.speed ?? null,
    heading: pos.coords.heading ?? null,
  };
};

async function readPosition(accuracy, timeoutMs) {
  const pos = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy }),
    wait(timeoutMs),
  ]);
  return toFix(pos);
}

/**
 * One-shot GPS read.
 * - high: true  → BestForNavigation (clock-in / full-power stamp)
 * - high: false → Balanced (default for gate/patrol and idle reads)
 * Location permission is requested only once (when still undetermined).
 */
export async function getGps({ high = false } = {}) {
  try {
    const permission = await ensureLocationPermission();
    if (!permission.granted) return { lat: null, lng: null, accuracy: null };

    let best = await Location.getLastKnownPositionAsync().catch(() => null);
    best = toFix(best);

    const accuracy = high ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced;
    const timeoutMs = high ? 8000 : 4500;

    try {
      const live = await readPosition(accuracy, timeoutMs);
      if (live && (!best || live.accuracy == null || best.accuracy == null || live.accuracy <= best.accuracy)) {
        best = live;
      }
    } catch {
      // keep last-known if the live read times out
    }

    return best || { lat: null, lng: null, accuracy: null };
  } catch {
    return { lat: null, lng: null, accuracy: null };
  }
}
