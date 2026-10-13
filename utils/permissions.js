import { Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

function pack(result) {
  return {
    granted: result?.status === "granted",
    canAsk: result?.canAskAgain !== false,
    status: result?.status || "undetermined",
  };
}

export async function readPermissions() {
  const [camera, photos, location] = await Promise.all([
    ImagePicker.getCameraPermissionsAsync().catch(() => ({ status: "undetermined", canAskAgain: true })),
    ImagePicker.getMediaLibraryPermissionsAsync().catch(() => ({ status: "undetermined", canAskAgain: true })),
    Location.getForegroundPermissionsAsync().catch(() => ({ status: "undetermined", canAskAgain: true })),
  ]);
  return {
    camera: pack(camera),
    photos: pack(photos),
    location: pack(location),
  };
}

export async function askPermission(kind) {
  if (kind === "camera") return pack(await ImagePicker.requestCameraPermissionsAsync());
  if (kind === "photos") return pack(await ImagePicker.requestMediaLibraryPermissionsAsync());
  if (kind === "location") return ensureLocationPermission();
  return { granted: false, canAsk: true, status: "undetermined" };
}

/** Ask for location only when still undetermined — never re-prompt after grant/deny. */
export async function ensureLocationPermission() {
  const current = pack(await Location.getForegroundPermissionsAsync().catch(() => ({ status: "undetermined", canAskAgain: true })));
  if (current.granted || current.status === "denied" || current.status === "blocked") return current;
  if (!current.canAsk) return current;
  return pack(await Location.requestForegroundPermissionsAsync());
}

export function openAppSettings() {
  return Linking.openSettings();
}
