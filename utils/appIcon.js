import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

const NATIVE_NAMES = {
  midnight: Platform.OS === "android" ? "Midnight" : null,
  light: "Light",
  sunset: "Sunset",
};

function loadNativeModule() {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return null;
  try {
    // Safe in Expo Go / builds without the native module — does not throw.
    return requireOptionalNativeModule("ExpoAlternateAppIcons");
  } catch {
    return null;
  }
}

function nativeNameFor(id) {
  if (Object.prototype.hasOwnProperty.call(NATIVE_NAMES, id)) return NATIVE_NAMES[id];
  return Platform.OS === "android" ? "Midnight" : null;
}

function sameIcon(current, wanted) {
  const normalize = (name) => {
    if (name == null || name === "" || name === "Midnight") {
      return Platform.OS === "android" ? "Midnight" : null;
    }
    return name;
  };
  return normalize(current) === normalize(wanted);
}

/**
 * @returns {"applied" | "unsupported" | "failed"}
 */
export async function applyAppIcon(id) {
  const native = loadNativeModule();
  if (!native || typeof native.setAlternateAppIcon !== "function") {
    return "unsupported";
  }

  const wanted = nativeNameFor(id);
  try {
    const current = typeof native.getAppIconName === "function" ? native.getAppIconName() : null;
    if (sameIcon(current, wanted)) return "applied";
    await native.setAlternateAppIcon(wanted);
    return "applied";
  } catch {
    return "failed";
  }
}
