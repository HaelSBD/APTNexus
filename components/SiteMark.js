import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { resolveMediaUrl } from "../utils/media";

export function siteInitials(name) {
  const parts = String(name || "S").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "S") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function SiteMark({ name = "", photoURL = "", uri = "", size = 52, radius, colors, style }) {
  const [failed, setFailed] = useState(false);
  const sourceUri = uri || resolveMediaUrl(photoURL);
  useEffect(() => {
    setFailed(false);
  }, [sourceUri]);
  const showImage = Boolean(sourceUri) && !failed;
  const dim = { width: size, height: size, borderRadius: radius ?? Math.round(size * 0.22) };
  return (
    <View
      style={[
        styles.mark,
        dim,
        { backgroundColor: colors?.muted || "#E6EEF6", borderColor: colors?.border || "#d5e0ec" },
        style,
      ]}
    >
      {showImage ? (
        <Image source={{ uri: sourceUri }} style={styles.img} resizeMode="cover" resizeMethod="resize" onError={() => setFailed(true)} />
      ) : (
        <Text style={[styles.initials, { color: colors?.primary || "#1B4F72", fontSize: Math.max(12, Math.round(size * 0.28)) }]}>
          {siteInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  img: { width: "100%", height: "100%" },
  initials: { fontWeight: "800" },
});
