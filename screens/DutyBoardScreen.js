import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import Avatar from "../components/Avatar";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { formatRelativeTime } from "../utils/format";
import { isSecurityRole } from "../utils/roles";
import { useT } from "../utils/i18n";

const stampMs = (item) => {
  const date = new Date(item?.createdAt || item?.at);
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

const isClockIn = (item) => String(item?.action || "") === "clock_in";

const DutyBoardScreen = () => {
  const insets = useSafeAreaInsets();
  const asTab = useRoute().name === "Duty";
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [staff, setStaff] = useState([]);
  const [logs, setLogs] = useState([]);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const [usersData, logsData] = await Promise.all([
        api.users().catch(() => null),
        api.dutyLogs().catch(() => null),
      ]);
      let nextStaff = (usersData?.rows || []).filter((row) => isSecurityRole(row) && row.active !== false);
      let nextLogs = logsData?.rows || [];

      if (!usersData || !logsData) {
        const overview = await api.overview().catch(() => null);
        if (!usersData) {
          nextStaff = (overview?.users || []).filter((row) => isSecurityRole(row) && row.active !== false);
        }
        if (!logsData) nextLogs = overview?.dutyLogs || [];
      }

      setStaff(nextStaff);
      setLogs(nextLogs);
    } catch {
      setStaff([]);
      setLogs([]);
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

  const latestByGuard = useMemo(() => {
    const sorted = [...logs].sort((a, b) => stampMs(b) - stampMs(a));
    const map = new Map();
    sorted.forEach((item) => {
      const key = String(item.guardId || item.guardName || "");
      if (!key || map.has(key)) return;
      map.set(key, item);
    });
    return map;
  }, [logs]);

  const roster = useMemo(() => {
    const rows = staff.map((person) => {
      const id = String(person.id || "");
      const latest =
        latestByGuard.get(id) ||
        latestByGuard.get(String(person.displayName || "")) ||
        latestByGuard.get(String(person.username || "")) ||
        null;
      const working = latest ? isClockIn(latest) : false;
      return {
        id,
        displayName: person.displayName || person.username || t("securityWord"),
        username: person.username || "",
        photoURL: person.photoURL || "",
        working,
        site: latest?.site || person.address || "APTNexus",
        latest,
      };
    });

    // Include any clocked-in guards missing from the user list (legacy logs).
    latestByGuard.forEach((item, key) => {
      if (!isClockIn(item)) return;
      if (rows.some((row) => row.id === key || row.displayName === item.guardName)) return;
      rows.push({
        id: key,
        displayName: item.guardName || t("securityWord"),
        username: "",
        photoURL: "",
        working: true,
        site: item.site || "APTNexus",
        latest: item,
      });
    });

    return rows.sort((a, b) => {
      if (a.working !== b.working) return a.working ? -1 : 1;
      return String(a.displayName).localeCompare(String(b.displayName), undefined, { sensitivity: "base" });
    });
  }, [staff, latestByGuard, t]);

  const onDutyCount = roster.filter((row) => row.working).length;
  const offDutyCount = roster.length - onDutyCount;
  const sites = [...new Set(roster.filter((row) => row.working).map((row) => row.site || "APTNexus"))];

  const todayIns = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return logs.filter((item) => isClockIn(item) && stampMs(item) >= start.getTime()).length;
  }, [logs, now]);

  const renderCard = ({ item }) => (
    <View style={[styles.card, item.working ? styles.cardOn : styles.cardOff]}>
      <View style={styles.cardTop}>
        <Avatar photoURL={item.photoURL} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {item.displayName}
          </Text>
          {item.username ? (
            <Text style={styles.username} numberOfLines={1}>
              @{item.username}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.meta} numberOfLines={1}>
              {item.working ? item.site : t("notOnSite")}
            </Text>
          </View>
        </View>
        <View style={[styles.statusTag, item.working ? styles.statusOn : styles.statusOff]}>
          <View style={[styles.statusDot, item.working ? styles.liveDot : styles.offDot]} />
          <Text style={[styles.statusText, item.working ? styles.statusTextOn : styles.statusTextOff]}>
            {item.working ? t("onDuty") : t("offDuty")}
          </Text>
        </View>
      </View>
      <View style={styles.shiftRow}>
        {item.working && item.latest ? (
          <>
            <View style={styles.shiftChip}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={styles.shiftText}>
                {t("sinceTime", { time: clockTime(item.latest) || formatRelativeTime(item.latest.createdAt) })}
              </Text>
            </View>
            <Text style={styles.duration}>{shiftLength(item.latest, now, t)}</Text>
          </>
        ) : item.latest ? (
          <>
            <View style={styles.shiftChip}>
              <Ionicons name="exit-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.shiftTextMuted}>
                {t("lastStamp")} · {clockTime(item.latest) || formatRelativeTime(item.latest.createdAt)}
              </Text>
            </View>
            <Text style={styles.durationMuted}>{t("clockedOut")}</Text>
          </>
        ) : (
          <Text style={styles.shiftTextMuted}>{t("noClockYet")}</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScreenBackdrop>
      <FlatList
        data={roster}
        keyExtractor={(item) => item.id}
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
                <Text style={styles.kicker}>{t("securityRoster")}</Text>
                <View style={[styles.pill, onDutyCount ? styles.pillOn : styles.pillOff]}>
                  <View style={[styles.dot, onDutyCount ? styles.dotLive : null]} />
                  <Text style={styles.pillText}>{onDutyCount ? t("onWatch") : t("rosterClear")}</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>
                {onDutyCount ? t("staffOnDuty", { n: onDutyCount }) : t("noOneOnDuty")}
              </Text>
              <Text style={styles.heroSub}>
                {onDutyCount ? sites.join(" · ") : t("waitingClockIn")}
              </Text>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{onDutyCount}</Text>
                  <Text style={styles.statLabel}>{t("onDuty")}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{offDutyCount}</Text>
                  <Text style={styles.statLabel}>{t("offDuty")}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{todayIns}</Text>
                  <Text style={styles.statLabel}>{t("inToday")}</Text>
                </View>
              </View>
            </LinearGradient>

            <Text style={styles.section}>{t("securityStatusSection")}</Text>
          </View>
        }
        renderItem={renderCard}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="shield-outline" size={22} color={colors.primary} />
            <Text style={styles.emptyTitle}>{t("noSecurityStaff")}</Text>
            <Text style={styles.emptyCopy}>{t("noSecurityRosterHint")}</Text>
          </View>
        }
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
    cardOn: { borderColor: "rgba(47, 158, 68, 0.35)" },
    cardOff: {},
    cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.muted,
    },
    title: { fontWeight: "800", color: colors.text, fontSize: 16 },
    username: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
    meta: { color: colors.textSecondary, fontSize: 13, flex: 1 },
    statusTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    statusOn: { backgroundColor: "rgba(47, 158, 68, 0.12)" },
    statusOff: { backgroundColor: colors.muted },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    liveDot: { backgroundColor: "#2F9E44" },
    offDot: { backgroundColor: colors.textSecondary },
    statusText: { fontSize: 11, fontWeight: "800" },
    statusTextOn: { color: "#2F9E44" },
    statusTextOff: { color: colors.textSecondary },
    shiftRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    shiftChip: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, paddingRight: 8 },
    shiftText: { color: colors.text, fontWeight: "600", fontSize: 13 },
    shiftTextMuted: { color: colors.textSecondary, fontWeight: "600", fontSize: 13 },
    duration: { color: colors.primary, fontWeight: "800", fontSize: 13 },
    durationMuted: { color: colors.textSecondary, fontWeight: "700", fontSize: 12 },
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
    emptyCopy: { color: colors.textSecondary, textAlign: "center", marginTop: 4, lineHeight: 19, fontSize: 13 },
  });
