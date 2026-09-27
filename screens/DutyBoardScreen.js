import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { formatRelativeTime } from "../utils/format";
import { useT } from "../utils/i18n";

const stampMs = (item) => {
  const date = new Date(item?.createdAt);
  const ms = date.getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

const clockTime = (item) => {
  const ms = stampMs(item);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const shiftLength = (item, now, t) => {
  const ms = stampMs(item);
  if (!ms) return "";
  const mins = Math.max(0, Math.floor((now - ms) / 60000));
  if (mins < 1) return t("justIn");
  if (mins < 60) return t("minsShort", { n: mins });
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? t("hoursMins", { h: hours, m: rest }) : t("hoursShort", { n: hours });
};

const initial = (name) => String(name || "S").trim().charAt(0).toUpperCase();
const isClockIn = (item) => String(item?.action || "") === "clock_in";

const DutyBoardScreen = () => {
  const insets = useSafeAreaInsets();
  const asTab = useRoute().name === "Duty";
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [logs, setLogs] = useState([]);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const data = await api.dutyLogs();
      setLogs(data.rows || []);
    } catch {
      try {
        const data = await api.overview();
        setLogs(data.dutyLogs || []);
      } catch {
        setLogs([]);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const tick = setInterval(() => {
        setNow(Date.now());
        load();
      }, 30000);
      return () => clearInterval(tick);
    }, [load]),
  );

  const sorted = useMemo(() => [...logs].sort((a, b) => stampMs(b) - stampMs(a)), [logs]);
  const onDuty = useMemo(() => {
    const latest = new Map();
    sorted.forEach((item) => {
      const key = item.guardId || item.guardName;
      if (!key || latest.has(key)) return;
      latest.set(key, item);
    });
    return [...latest.values()].filter(isClockIn).sort((a, b) => stampMs(a) - stampMs(b));
  }, [sorted]);

  const todayIns = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return sorted.filter((item) => isClockIn(item) && stampMs(item) >= start.getTime()).length;
  }, [sorted, now]);

  const activity = useMemo(() => sorted.slice(0, 24), [sorted]);
  const lastStamp = activity[0];
  const sites = [...new Set(onDuty.map((item) => item.site || "APTNexus"))];

  return (
    <ScreenBackdrop>
      <FlatList
        data={activity}
        keyExtractor={(item, index) => item.id || `log-${index}`}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={6}
        removeClippedSubviews
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 12, paddingBottom: asTab ? 118 : 36 }]}
        ListHeaderComponent={
          <View>
            <PageHeader kicker={t("liveRoster")} title={t("dutyBoard")} />
            <LinearGradient colors={colors.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.heroTop}>
                <Text style={styles.kicker}>{t("liveRoster")}</Text>
                <View style={[styles.pill, onDuty.length ? styles.pillOn : styles.pillOff]}>
                  <View style={[styles.dot, onDuty.length ? styles.dotLive : null]} />
                  <Text style={styles.pillText}>{onDuty.length ? t("onWatch") : t("rosterClear")}</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>{onDuty.length ? t("staffOnDuty", { n: onDuty.length }) : t("noOneOnDuty")}</Text>
              <Text style={styles.heroSub}>
                {onDuty.length
                  ? sites.join(" · ")
                  : lastStamp
                    ? `${t("lastStamp")} · ${formatRelativeTime(lastStamp.createdAt)}`
                    : t("waitingClockIn")}
              </Text>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{onDuty.length}</Text>
                  <Text style={styles.statLabel}>{t("onSite")}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{todayIns}</Text>
                  <Text style={styles.statLabel}>{t("inToday")}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{activity.length}</Text>
                  <Text style={styles.statLabel}>{t("stamps")}</Text>
                </View>
              </View>
            </LinearGradient>

            <Text style={styles.section}>{t("onWatchSection")}</Text>
            {onDuty.length ? (
              onDuty.map((item) => (
                <View key={item.guardId || item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initial(item.guardName)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{item.guardName || t("securityWord")}</Text>
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                        <Text style={styles.meta}>{item.site || "APTNexus"}</Text>
                      </View>
                    </View>
                    <View style={styles.liveTag}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>{t("live")}</Text>
                    </View>
                  </View>
                  <View style={styles.shiftRow}>
                    <View style={styles.shiftChip}>
                      <Ionicons name="time-outline" size={14} color={colors.primary} />
                      <Text style={styles.shiftText}>{t("sinceTime", { time: clockTime(item) || formatRelativeTime(item.createdAt) })}</Text>
                    </View>
                    <Text style={styles.duration}>{shiftLength(item, now, t)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="shield-outline" size={22} color={colors.primary} />
                <Text style={styles.emptyTitle}>{t("nobodyClockedIn")}</Text>
                <Text style={styles.emptyCopy}>{t("nobodyClockedInHint")}</Text>
              </View>
            )}

            <Text style={styles.section}>{t("recentActivity")}</Text>
            {!activity.length ? (
              <Text style={styles.emptyCopy}>{t("activityHint")}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const inShift = isClockIn(item);
          return (
            <View style={styles.logRow}>
              <View style={[styles.logIcon, inShift ? styles.logIn : styles.logOut]}>
                <Ionicons name={inShift ? "enter-outline" : "exit-outline"} size={16} color={inShift ? colors.primary : colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>{item.guardName || t("securityWord")}</Text>
                <Text style={styles.logMeta}>
                  {inShift ? t("clockedIn") : t("clockedOut")}
                  {item.site ? ` · ${item.site}` : ""}
                </Text>
              </View>
              <Text style={styles.logTime}>{clockTime(item) || formatRelativeTime(item.createdAt)}</Text>
            </View>
          );
        }}
      />
    </ScreenBackdrop>
  );
};

export default DutyBoardScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    list: { paddingHorizontal: 16 },
    hero: {
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 16,
      marginBottom: 18,
      overflow: "hidden",
    },
    heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
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
    pillOff: {},
    pillText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.45)" },
    dotLive: { backgroundColor: colors.live },
    heroTitle: { color: "#fff", fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
    heroSub: { color: "rgba(255,255,255,0.72)", marginTop: 4, fontSize: 13 },
    stats: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 14,
      paddingVertical: 10,
    },
    stat: { flex: 1, alignItems: "center" },
    statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
    statLabel: { color: "rgba(255,255,255,0.62)", fontSize: 11, fontWeight: "700", marginTop: 2 },
    statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.12)" },
    section: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.textSecondary,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: colors.primary, fontWeight: "800", fontSize: 18 },
    title: { fontWeight: "800", color: colors.text, fontSize: 16 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
    meta: { color: colors.textSecondary, fontSize: 13 },
    liveTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "rgba(47, 158, 68, 0.12)",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2F9E44" },
    liveText: { color: "#2F9E44", fontSize: 11, fontWeight: "800" },
    shiftRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    shiftChip: { flexDirection: "row", alignItems: "center", gap: 6 },
    shiftText: { color: colors.text, fontWeight: "600", fontSize: 13 },
    duration: { color: colors.primary, fontWeight: "800", fontSize: 13 },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 18,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyTitle: { fontWeight: "800", color: colors.text, marginTop: 8 },
    emptyCopy: { color: colors.textSecondary, textAlign: "center", marginTop: 4, lineHeight: 19, fontSize: 13, marginBottom: 12 },
    logRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    logIn: { backgroundColor: colors.muted },
    logOut: { backgroundColor: "rgba(180, 35, 24, 0.08)" },
    logTitle: { fontWeight: "800", color: colors.text, fontSize: 14 },
    logMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    logTime: { color: colors.textSecondary, fontWeight: "700", fontSize: 12 },
  });
