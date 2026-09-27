import * as Location from "expo-location";

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

export async function getGps() {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return { lat: null, lng: null, accuracy: null };

    let best = await Location.getLastKnownPositionAsync().catch(() => null);
    best = toFix(best);

    try {
      const live = await readPosition(Location.Accuracy.High, 6000);
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
