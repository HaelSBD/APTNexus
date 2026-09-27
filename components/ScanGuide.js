import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";
import { useT } from "../utils/i18n";

const PLATE_RATIO = 4.6;

export function scanGuideSize(mode, screenW, screenH) {
  const landscape = screenW > screenH;
  if (mode === "qr") {
    const size = Math.min(screenW * (landscape ? 0.38 : 0.64), screenH * (landscape ? 0.52 : 0.38));
    return {
      width: size,
      height: size,
      left: (screenW - size) / 2,
      top: (screenH - size) / 2,
    };
  }
  const maxW = screenW * (landscape ? 0.72 : 0.9);
  const maxH = screenH * (landscape ? 0.26 : 0.17);
  let width = maxW;
  let height = width / PLATE_RATIO;
  if (height > maxH) {
    height = maxH;
    width = height * PLATE_RATIO;
  }
  return {
    width,
    height,
    left: (screenW - width) / 2,
    top: (screenH - height) / 2,
  };
}

const Corner = ({ style }) => <View style={[styles.corner, style]} />;

const ScanGuide = ({ mode, width, height }) => {
  const t = useT();
  const qr = mode === "qr";
  return (
    <View style={[styles.frame, { width, height }, qr ? styles.qrRadius : styles.plateRadius]}>
      <Corner style={styles.tl} />
      <Corner style={styles.tr} />
      <Corner style={styles.bl} />
      <Corner style={styles.br} />
      {qr ? (
        <>
          <View style={[styles.finder, styles.finderTl]} />
          <View style={[styles.finder, styles.finderTr]} />
          <View style={[styles.finder, styles.finderBl]} />
        </>
      ) : (
        <View style={styles.plateBoltRow}>
          <View style={styles.bolt} />
          <View style={styles.bolt} />
        </View>
      )}
      <Text style={[styles.guide, qr ? styles.guideQr : styles.guidePlate]}>
        {qr ? t("placeQr") : t("placePlate")}
      </Text>
    </View>
  );
};

export default ScanGuide;

const styles = StyleSheet.create({
  frame: {
    overflow: "visible",
  },
  qrRadius: { borderRadius: 18 },
  plateRadius: { borderRadius: 8 },
  guide: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.92)",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  guideQr: { bottom: 16, fontSize: 13 },
  guidePlate: { bottom: -28, fontSize: 12 },
  plateBoltRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  bolt: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  finder: {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: "rgba(255,255,255,0.55)",
    borderWidth: 3,
  },
  finderTl: { top: 14, left: 14, borderRightWidth: 0, borderBottomWidth: 0 },
  finderTr: { top: 14, right: 14, borderLeftWidth: 0, borderBottomWidth: 0 },
  finderBl: { bottom: 14, left: 14, borderRightWidth: 0, borderTopWidth: 0 },
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
