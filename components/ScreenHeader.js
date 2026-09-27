import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles } from "../context/SettingsContext";

const ScreenHeader = ({ title, onBack, right, compact = false }) => {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.header, compact && styles.headerCompact, { paddingTop: insets.top + (compact ? 8 : 18) }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.side} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
};

export default ScreenHeader;

const makeStyles = (colors) =>
  StyleSheet.create({
    header: {
      backgroundColor: colors.header,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      paddingHorizontal: 12,
      paddingBottom: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerCompact: {
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      paddingBottom: 14,
    },
    side: { width: 40, alignItems: "center", justifyContent: "center" },
    title: { flex: 1, color: "#fff", fontSize: 24, fontWeight: "bold", textAlign: "center" },
  });
