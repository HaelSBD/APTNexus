import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSettings } from "../context/SettingsContext";

function ScreenBackdrop({ children, style }) {
  const { colors } = useSettings();
  const page =
    Array.isArray(colors.page) && colors.page.length >= 2
      ? colors.page
      : [colors.background || "#E6EEF6", colors.background || "#E6EEF6"];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <LinearGradient colors={page} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.fill} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { ...StyleSheet.absoluteFillObject },
});

export default React.memo(ScreenBackdrop);
