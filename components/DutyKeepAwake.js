import { useEffect } from "react";
import { requireOptionalNativeModule } from "expo-modules-core";
import { useCurrentUser } from "../context/UserContext";
import { useSettings } from "../context/SettingsContext";

const ExpoKeepAwake = requireOptionalNativeModule("ExpoKeepAwake");

export default function DutyKeepAwake() {
  const { user, duty } = useCurrentUser();
  const { settings } = useSettings();
  const on = Boolean(user && settings.keepAwakeOnDuty && duty?.clockedIn);

  useEffect(() => {
    if (!on || !ExpoKeepAwake?.activate) return undefined;
    const tag = "aptnexus-duty";
    Promise.resolve(ExpoKeepAwake.activate(tag)).catch(() => {});
    return () => {
      Promise.resolve(ExpoKeepAwake.deactivate?.(tag)).catch(() => {});
    };
  }, [on]);

  return null;
}
