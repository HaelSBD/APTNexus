import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeShadows, paletteFor } from "../theme";

const STORAGE_KEY = "aptnexus:settings";

export const defaultSettings = {
  appearance: "system",
  language: "en",
  notifications: true,
  notificationSound: true,
  notificationVibration: false,
  highAccuracyGps: false,
};

let snapshot = { ...defaultSettings };

export function getSettingsSnapshot() {
  return snapshot;
}

const SettingsContext = createContext({
  settings: defaultSettings,
  dark: false,
  colors: paletteFor(false),
  shadows: makeShadows(paletteFor(false)),
  setSetting: async () => {},
  feedback: { tap: () => {}, success: () => {}, warn: () => {} },
});

export function SettingsProvider({ children }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const parsed = JSON.parse(raw);
        const next = {
          ...defaultSettings,
          appearance: parsed.appearance || defaultSettings.appearance,
          language: parsed.language || defaultSettings.language,
          notifications: parsed.notifications != null ? Boolean(parsed.notifications) : defaultSettings.notifications,
          notificationSound: parsed.notificationSound != null ? Boolean(parsed.notificationSound) : defaultSettings.notificationSound,
          notificationVibration: parsed.notificationVibration != null ? Boolean(parsed.notificationVibration) : defaultSettings.notificationVibration,
          highAccuracyGps: Boolean(parsed.highAccuracyGps),
        };
        snapshot = next;
        setSettings(next);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const dark = settings.appearance === "dark" || (settings.appearance === "system" && systemScheme === "dark");
  const colors = useMemo(() => paletteFor(dark), [dark]);
  const shadows = useMemo(() => makeShadows(colors), [colors]);

  const setSetting = useCallback(async (key, value) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      snapshot = next;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const feedback = useMemo(() => ({ tap: () => {}, success: () => {}, warn: () => {} }), []);

  const value = useMemo(
    () => ({ settings, dark, colors, shadows, setSetting, feedback }),
    [settings, dark, colors, shadows, setSetting, feedback],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useThemedStyles(factory) {
  const theme = useSettings();
  const colors = theme?.colors || paletteFor(false);
  const shadows = theme?.shadows || makeShadows(colors);
  const dark = Boolean(theme?.dark);
  return useMemo(() => factory(colors, shadows, dark), [colors, shadows, dark]);
}
