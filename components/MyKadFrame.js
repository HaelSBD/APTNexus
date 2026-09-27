import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";
import { useT } from "../utils/i18n";

const MYKAD_RATIO = 85.6 / 54;

export function myKadFrameSize(screenW, screenH) {
  const landscape = screenW > screenH;
  const maxW = screenW * (landscape ? 0.62 : 0.94);
  const maxH = screenH * (landscape ? 0.48 : 0.34);
  let width = maxW;
  let height = width / MYKAD_RATIO;
  if (height > maxH) {
    height = maxH;
    width = height * MYKAD_RATIO;
  }
  return { width, height, left: (screenW - width) / 2, top: (screenH - height) / 2 };
}

const Corner = ({ style }) => <View style={[styles.corner, style]} />;

const MyKadFrame = ({ width, height }) => {
  const t = useT();
  return (
  <View style={[styles.card, { width, height }]}>
    <Corner style={styles.tl} />
    <Corner style={styles.tr} />
    <Corner style={styles.bl} />
    <Corner style={styles.br} />
    <View style={styles.chip} />
    <Text style={styles.guide}>{t("placeMyKad")}</Text>
  </View>
  );
};

export default MyKadFrame;

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: "visible",
  },
  guide: {
    position: "absolute",
    alignSelf: "center",
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.88)",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  chip: {
    position: "absolute",
    left: 14,
    top: "38%",
    width: 28,
    height: 22,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: colors.scanGuide,
  },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
});
