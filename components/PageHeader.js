import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings, useThemedStyles } from "../context/SettingsContext";

export default function PageHeader({ kicker, title, onBack, right }) {
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.back} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.copy}>
          {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    wrap: { marginBottom: 18 },
    row: { flexDirection: "row", alignItems: "center" },
    back: { marginRight: 4, marginLeft: -6 },
    copy: { flex: 1 },
    kicker: { color: colors.textSecondary, fontSize: 14, fontWeight: "600", marginBottom: 4 },
    title: { color: colors.text, fontSize: 26, fontWeight: "700" },
    right: { marginLeft: 8 },
  });
