import { Vibration } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { getSettingsSnapshot } from "../context/SettingsContext";

const ExpoHaptics = requireOptionalNativeModule("ExpoHaptics");

function tapHaptic() {
  if (ExpoHaptics?.notificationAsync) {
    Promise.resolve(ExpoHaptics.notificationAsync("success")).catch(() => {});
  }
}

export function playAlertFeedback(force = false) {
  const snap = getSettingsSnapshot();
  if (!force && snap.notifications === false) return;
  try {
    if (force || snap.notificationVibration) Vibration.vibrate(36);
  } catch {
    // no vibrator
  }
  if (force || snap.notificationSound) tapHaptic();
}

export function playToggleFeedback(kind) {
  if (kind === "vibration") {
    try {
      Vibration.vibrate(48);
    } catch {
      // no vibrator
    }
    return;
  }
  if (kind === "sound") tapHaptic();
}
