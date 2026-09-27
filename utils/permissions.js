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
  if (kind === "location") return pack(await Location.requestForegroundPermissionsAsync());
  return { granted: false, canAsk: true, status: "undetermined" };
}

export function openAppSettings() {
  return Linking.openSettings();
}
