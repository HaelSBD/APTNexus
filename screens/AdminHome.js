import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { useT } from "../utils/i18n";

const DESK_ITEMS = [
  { titleKey: "deskSettings", hintKey: "deskSettingsHint", icon: "settings-outline", route: "Settings", tone: "gate", stack: true },
  { titleKey: "deskSites", hintKey: "deskSitesHint", icon: "business-outline", route: "Sites", tone: "gate", stack: true },
  { titleKey: "deskCheckpoints", hintKey: "deskCheckpointsHint", icon: "scan-outline", route: "Checkpoints", tone: "scan", stack: true },
  { titleKey: "deskTeam", hintKey: "deskTeamHint", icon: "people-outline", route: "Team", tone: "gate" },
  { titleKey: "deskVisitors", hintKey: "deskVisitorsHint", icon: "clipboard-outline", route: "Visitors", tone: "scan" },
  { titleKey: "deskPatrol", hintKey: "deskPatrolHint", icon: "qr-code-outline", route: "Patrol", tone: "scan" },
];

/** When the desk is collapsed, only these quick links stay visible (this order). */
const COLLAPSED_ROUTES = ["Settings", "Sites", "Checkpoints"];

const ActionRow = ({ item, last, onPress, styles, colors, t }) => (
  <TouchableOpacity style={[styles.row, last && styles.rowLast]} onPress={onPress} activeOpacity={0.86}>
    <View style={[styles.rowIcon, item.tone === "scan" ? styles.scanIcon : styles.gateIcon]}>
      <Ionicons name={item.icon} size={18} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{t(item.titleKey)}</Text>
      <Text style={styles.rowHint}>{t(item.hintKey)}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
  </TouchableOpacity>
);

const AdminHomePanel = ({ reloadKey = 0 }) => {
  const navigation = useNavigation();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [open, setOpen] = useState(true);
  const [stats, setStats] = useState({ onDuty: 0, visitors: 0, patrols: 0, sites: 0 });

  const openScreen = (item) => {
    if (item.stack) {
      const parent = navigation.getParent();
      (parent || navigation).navigate(item.route);
      return;
    }
    navigation.navigate(item.route);
  };

  const load = useCallback(() => {
    api
      .overview()
      .then((data) => {
        const latest = new Map();
        (data.dutyLogs || []).forEach((row) => {
          const key = row.guardId || row.guardName;
          if (!key || latest.has(key)) return;
          latest.set(key, row);
        });
        const onDuty = [...latest.values()].filter((row) => row.action === "clock_in").length;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const startMs = start.getTime();
        setStats({
          onDuty,
          visitors: (data.visitors || []).filter((row) => new Date(row.createdAt).getTime() >= startMs).length,
          patrols: (data.patrols || []).filter((row) => new Date(row.createdAt).getTime() >= startMs).length,
          sites: (data.sites || []).length,
        });
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, reloadKey]),
  );

  const toggle = () => setOpen((current) => !current);

  const items = useMemo(
    () =>
      open
        ? DESK_ITEMS
        : COLLAPSED_ROUTES.map((route) => DESK_ITEMS.find((item) => item.route === route)).filter(Boolean),
    [open],
  );

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.92}>
        <LinearGradient colors={colors.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.kicker}>{t("management")}</Text>
            <View style={styles.heroActions}>
              <View style={[styles.pill, styles.pillOn]}>
                <View style={[styles.dot, styles.dotLive]} />
                <Text style={styles.pillText}>{t("live")}</Text>
              </View>
              <View style={styles.toggle}>
                <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={18} color="#fff" />
                <Text style={styles.toggleText}>{open ? t("hide") : t("show")}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.heroTitle}>{t("commandDesk")}</Text>
          <Text style={styles.heroSub}>
            {t("deskSummary", {
              onDuty: stats.onDuty,
              sites: stats.sites,
              siteLabel: stats.sites === 1 ? t("siteWord") : t("sitesWord"),
              visitors: stats.visitors,
            })}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.body}>
        {items.map((item, index) => (
          <ActionRow
            key={item.route}
            item={item}
            last={index === items.length - 1}
            onPress={() => openScreen(item)}
            styles={styles}
            colors={colors}
            t={t}
          />
        ))}
      </View>
    </View>
  );
};

export default AdminHomePanel;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    wrap: {
      marginTop: 16,
      borderRadius: 22,
      backgroundColor: colors.surface,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    hero: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
    heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    heroActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    toggle: {
      minWidth: 52,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    toggleText: {
      color: "rgba(255,255,255,0.86)",
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginTop: -1,
    },
    kicker: {
      color: "rgba(255,255,255,0.62)",
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    pillOn: { backgroundColor: "rgba(212, 160, 23, 0.28)" },
    pillText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.45)" },
    dotLive: { backgroundColor: colors.live },
    heroTitle: { color: "#fff", fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
    heroSub: { color: "rgba(255,255,255,0.72)", marginTop: 4, fontSize: 13 },
    body: { padding: 14 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    scanIcon: { backgroundColor: colors.muted },
    gateIcon: { backgroundColor: colors.muted },
    rowTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
    rowHint: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  });
