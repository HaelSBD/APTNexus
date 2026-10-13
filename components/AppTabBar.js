import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { useT } from "../utils/i18n";

const ION_ICONS = {
  Home: "home-outline",
  Patrol: "qr-code-outline",
  Gate: "enter-outline",
  Settings: "settings-outline",
  Team: "people-outline",
  Visitors: "clipboard-outline",
  // ID tab hidden for now — re-enable with IDScreen in AuthedNavigation:
  // ID: "id-card-outline",
};

const TAB_LABELS = {
  Home: "tabDuty",
  Patrol: "tabPatrol",
  Gate: "tabGate",
  Settings: "tabSettings",
  Team: "tabTeams",
  Visitors: "tabVisitors",
};

const AppTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = t(TAB_LABELS[route.name]) || options.tabBarLabel || options.title || route.name;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.sideHit}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
            >
              <View style={[styles.sidePill, focused && styles.sidePillOn]}>
                <Ionicons
                  name={ION_ICONS[route.name] || "ellipse-outline"}
                  size={22}
                  color={focused ? colors.primaryDark : colors.placeholder}
                />
                <Text style={[styles.sideLabel, focused ? styles.sideLabelOn : null]}>
                  {typeof label === "string" ? label : route.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default memo(AppTabBar);

const makeStyles = (colors) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: 14,
      paddingTop: 16,
      backgroundColor: colors.background,
    },
    bar: {
      height: 64,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderRadius: 28,
      paddingHorizontal: 6,
      paddingBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 4,
    },
    sideHit: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
    sidePill: {
      minWidth: 52,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      paddingVertical: 6,
      borderRadius: 18,
    },
    sidePillOn: { backgroundColor: colors.tabTint },
    sideLabel: {
      marginTop: 3,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.2,
      color: colors.placeholder,
    },
    sideLabelOn: { color: colors.primaryDark },
  });
