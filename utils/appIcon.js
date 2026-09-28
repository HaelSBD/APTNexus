import { Platform } from "react-native";

const NATIVE_NAMES = {
  light: "Light",
  sunset: "Sunset",
};

export async function applyAppIcon(id) {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return "saved";
  let icons;
  try {
    icons = require("expo-alternate-app-icons");
  } catch {
    return "saved";
  }
  if (!icons?.supportsAlternateIcons || typeof icons.setAlternateAppIcon !== "function") {
    return "saved";
  }
  const wanted = NATIVE_NAMES[id] || null;
  try {
    const current = typeof icons.getAppIconName === "function" ? icons.getAppIconName() : null;
    if ((current || null) === wanted) return "applied";
    await icons.setAlternateAppIcon(wanted);
    return "applied";
  } catch {
    return "saved";
  }
}
