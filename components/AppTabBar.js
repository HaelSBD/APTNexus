import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { useT } from "../utils/i18n";
import { useChat } from "../context/ChatContext";

const ION_ICONS = {
  Home: "home-outline",
  Patrol: "qr-code-outline",
  Gate: "enter-outline",
  Settings: "settings-outline",
  Team: "people-outline",
  Chat: "chatbubbles-outline",
  Inbox: "file-tray-outline",
  Duty: "shield-outline",
};

const TAB_LABELS = {
  Home: "tabDuty",
  Patrol: "tabPatrol",
  ID: "tabId",
  Gate: "tabGate",
  Settings: "tabSettings",
  Team: "tabTeam",
  Chat: "tabChat",
  Inbox: "tabInbox",
  Duty: "tabDutyBoard",
};

const AppTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const { unread } = useChat();

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

          if (route.name === "ID") {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.idHit}
                accessibilityRole="button"
                accessibilityLabel="ID"
                accessibilityState={{ selected: focused }}
              >
                <View style={[styles.idRing, focused && styles.idRingOn]}>
                  <View style={styles.idCircle}>
                    <Ionicons name="id-card" size={24} color="#fff" />
                  </View>
                </View>
              </Pressable>
            );
          }

          const badge = route.name === "Chat" ? unread : 0;
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.sideHit}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
            >
              <View style={[styles.sidePill, focused && styles.sidePillOn]}>
                <View>
                  <Ionicons
                    name={ION_ICONS[route.name] || "ellipse-outline"}
                    size={22}
                    color={focused ? colors.primaryDark : colors.placeholder}
                  />
                  {badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
                    </View>
                  ) : null}
                </View>
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
      paddingHorizontal: 8,
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
    badge: {
      position: "absolute",
      top: -4,
      right: -10,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
    idHit: { width: 74, height: 64, alignItems: "center", justifyContent: "flex-end" },
    idRing: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      elevation: 6,
    },
    idRingOn: { elevation: 8 },
    idCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
