import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "../components/Toast";
import { formatRelativeTime } from "../utils/format";
import { useCurrentUser } from "../context/UserContext";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { getGps } from "../utils/gps";
import { useT } from "../utils/i18n";
import ScreenBackdrop from "../components/ScreenBackdrop";
import SiteMark from "../components/SiteMark";
import Avatar from "../components/Avatar";
import { isAdminRole } from "../utils/roles";

let AdminHomePanel;

function AdminDesk(props) {
  if (!AdminHomePanel) AdminHomePanel = require("./AdminHome").default;
  return <AdminHomePanel {...props} />;
}

const SITE_KEY = "aptnexus:selected-site";

const pickSiteName = (rows, preferred) => {
  const active = (rows || []).filter((row) => row.active !== false);
  if (!active.length) return preferred || "";
  if (preferred && active.some((row) => row.name === preferred)) return preferred;
  return (active.find((row) => row.isDefault) || active[0]).name;
};

const greetingKey = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "goodMorning";
  if (hour >= 12 && hour < 18) return "goodAfternoon";
  return "goodNight";
};

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, duty, setDuty } = useCurrentUser();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [site, setSite] = useState(duty?.site || "");
  const [sites, setSites] = useState([]);
  const [siteOpen, setSiteOpen] = useState(false);
  const [lastPatrol, setLastPatrol] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deskTick, setDeskTick] = useState(0);
  const [greeting, setGreeting] = useState(greetingKey);

  const guardName = profile?.displayName || profile?.username || t("securityWord");
  const post = profile?.address || t("addPost");
  const onDuty = Boolean(duty.clockedIn);
  const admin = isAdminRole(profile);

  const openProfile = () => {
    const parent = navigation.getParent();
    if (parent) parent.navigate("Profile");
    else navigation.navigate("Profile");
  };

  const refresh = async () => {
    try {
      const [status, siteData, saved] = await Promise.all([
        api.dutyStatus(),
        api.sites().catch(() => ({ rows: [] })),
        AsyncStorage.getItem(SITE_KEY),
      ]);
      const rows = siteData.rows || [];
      setSites(rows);
      setDuty({ clockedIn: status.clockedIn, at: status.at, site: status.site });
      const next = pickSiteName(rows, status.clockedIn ? status.site : saved || status.site || site);
      if (next) {
        setSite(next);
        AsyncStorage.setItem(SITE_KEY, next).catch(() => {});
      }
      setLastPatrol(status.lastPatrol || null);
    } catch {
      // keep last known state
    }
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
      setGreeting(greetingKey());
      const interval = setInterval(() => setGreeting(greetingKey()), 30000);
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") setGreeting(greetingKey());
      });
      return () => {
        clearInterval(interval);
        sub.remove();
      };
    }, []),
  );

  const stamp = async (action) => {
    if (busy) return;
    if (action === "clock_in" && onDuty) {
      toast.info(t("alreadyIn"));
      return;
    }
    if (action === "clock_out" && !onDuty) {
      toast.info(t("clockInFirst"));
      return;
    }
    setBusy(true);
    const siteName = (action === "clock_out" ? duty.site || site : site).trim();
    if (action === "clock_in" && !siteName) {
      setBusy(false);
      toast.info(t("chooseSite"));
      setSiteOpen(true);
      return;
    }
    try {
      // Clock-in starts full-power GPS; clock-out keeps a strong end stamp. Idle reads elsewhere stay balanced.
      const gps = await getGps({ high: true });
      const result = await api.clock({ action, site: siteName, ...gps });
      setDuty({
        clockedIn: result.clockedIn,
        at: result.duty?.createdAt || new Date().toISOString(),
        site: siteName,
      });
      AsyncStorage.setItem(SITE_KEY, siteName).catch(() => {});
      toast.success(action === "clock_in" ? t("youOnDuty") : t("youClockedOut"));
    } catch (error) {
      toast.error(error?.message || t("clockFailed"));
    }
    setBusy(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    if (admin) setDeskTick((n) => n + 1);
    setRefreshing(false);
  };

  const checkpointName = lastPatrol?.checkpointName || lastPatrol?.label;
  const checkpointAt = lastPatrol?.createdAt || lastPatrol?.at;

  return (
    <ScreenBackdrop>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 6, paddingBottom: 118 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileSection} onPress={openProfile} activeOpacity={0.85}>
            <View style={styles.avatarWrap}>
              <Avatar photoURL={profile?.photoURL} style={styles.avatar} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>{t(greeting)}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {guardName}
              </Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-sharp" size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.address} numberOfLines={1}>
                  {admin ? t("management") : post}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={openProfile}>
              <Ionicons name="person-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {admin ? (
          <AdminDesk reloadKey={deskTick} />
        ) : (
          <>
        <View style={styles.dutyWrap}>
          <LinearGradient colors={colors.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dutyHero}>
            <View style={styles.dutyTop}>
              <Text style={styles.dutyKicker}>{t("dutyDesk")}</Text>
              <View style={[styles.pill, onDuty ? styles.pillOn : styles.pillOff]}>
                <View style={[styles.dot, onDuty && styles.dotLive]} />
                <Text style={styles.pillText}>{onDuty ? t("onDuty") : t("offDuty")}</Text>
              </View>
            </View>
            <Text style={styles.dutyTitle}>{onDuty ? t("onWatch") : t("readyShift")}</Text>
            <Text style={styles.dutySub}>
              {guardName}
              {onDuty && duty.at ? ` · ${t("since")} ${formatRelativeTime(duty.at)}` : ` · ${t("tapClockIn")}`}
            </Text>
          </LinearGradient>

          <View style={styles.dutyBody}>
            <TouchableOpacity style={styles.siteRow} onPress={() => setSiteOpen(true)} activeOpacity={0.88}>
              <SiteMark
                name={site || "S"}
                photoURL={(sites.find((row) => row.name === site) || {}).photoURL}
                size={36}
                colors={colors}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.siteLabel}>{t("site")}</Text>
                <Text style={styles.siteValue} numberOfLines={1}>
                  {site || t("tapToChoose")}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.placeholder} />
            </TouchableOpacity>

            <View style={styles.split}>
              <TouchableOpacity
                style={[styles.splitBtn, styles.splitIn, !onDuty && styles.splitInActive]}
                onPress={() => stamp("clock_in")}
                disabled={busy}
                activeOpacity={0.88}
              >
                {busy && !onDuty ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="enter-outline" size={18} color={!onDuty ? "#fff" : colors.primary} />
                    <Text style={[styles.splitText, !onDuty && styles.splitTextActive]}>{t("clockIn")}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.splitBtn, styles.splitOut, onDuty && styles.splitOutActive]}
                onPress={() => stamp("clock_out")}
                disabled={busy}
                activeOpacity={0.88}
              >
                {busy && onDuty ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="exit-outline" size={18} color={onDuty ? "#fff" : colors.danger} />
                    <Text style={[styles.splitOutText, onDuty && styles.splitTextActive]}>{t("clockOut")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardIcon}>
              <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>{t("lastCheckpoint")}</Text>
          </View>
          {lastPatrol && checkpointName ? (
            <View>
              <Text style={styles.cardValue}>{checkpointName}</Text>
              <Text style={styles.cardMeta}>
                {t("lastRound")}
                {checkpointAt ? ` · ${formatRelativeTime(checkpointAt)}` : ""}
              </Text>
            </View>
          ) : (
            <Text style={styles.cardMeta}>{t("noCheckpoint")}</Text>
          )}
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate("SecurityCameraScan", { mode: "qr" })}
            activeOpacity={0.88}
          >
            <Ionicons name="qr-code-outline" size={18} color="#fff" />
            <Text style={styles.scanBtnText}>{t("scanCheckpoint")}</Text>
          </TouchableOpacity>
        </View>
          </>
        )}

      </ScrollView>
      <Modal visible={siteOpen} transparent animationType="fade" onRequestClose={() => setSiteOpen(false)}>
        <Pressable style={styles.siteOverlay} onPress={() => setSiteOpen(false)}>
          <Pressable style={[styles.siteSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
            <Text style={styles.siteSheetKicker}>{t("site")}</Text>
            <Text style={styles.siteSheetTitle}>{t("chooseSite")}</Text>
            {sites.filter((row) => row.active !== false).length ? (
              sites
                .filter((row) => row.active !== false)
                .map((row) => {
                  const selected = row.name === site;
                  return (
                    <TouchableOpacity
                      key={row.id || row.name}
                      style={[styles.siteOption, selected && styles.siteOptionOn]}
                      onPress={() => {
                        setSite(row.name);
                        AsyncStorage.setItem(SITE_KEY, row.name).catch(() => {});
                        setSiteOpen(false);
                      }}
                      activeOpacity={0.88}
                    >
                      <SiteMark
                        name={row.name}
                        photoURL={row.photoURL}
                        size={40}
                        colors={selected ? { ...colors, muted: "rgba(255,255,255,0.18)", border: "transparent", primary: "#fff" } : colors}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.siteOptionName, selected && styles.siteOptionNameOn]}>{row.name}</Text>
                        <Text style={[styles.siteOptionMeta, selected && styles.siteOptionMetaOn]}>
                          {(row.people || []).length
                            ? (row.people || []).map((person) => person.displayName).join(" · ")
                            : row.address || (row.isDefault ? t("defaultSiteBadge") : t("site"))}
                        </Text>
                      </View>
                      {selected ? <Ionicons name="checkmark-circle" size={20} color="#fff" /> : null}
                    </TouchableOpacity>
                  );
                })
            ) : (
              <Text style={styles.siteEmpty}>{t("noSites")}</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenBackdrop>
  );
};

export default HomeScreen;

const makeStyles = (colors, shadows, dark) =>
  StyleSheet.create({
    screen: { flex: 1 },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16 },
    header: {
      backgroundColor: colors.primary,
      borderRadius: 22,
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      ...shadows.card,
    },
    profileSection: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
    avatarWrap: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: "#fff",
      overflow: "hidden",
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    avatar: { width: "100%", height: "100%" },
    userInfo: { marginLeft: 12, flex: 1, minWidth: 0 },
    greeting: { color: "rgba(255,255,255,0.72)", fontSize: 12 },
    name: { color: "#fff", fontWeight: "700", fontSize: 17, marginBottom: 2 },
    addressRow: { flexDirection: "row", alignItems: "center", minWidth: 0 },
    address: { color: "rgba(255,255,255,0.82)", fontSize: 12, flex: 1 },
    iconButton: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.14)",
      marginLeft: 8,
      position: "relative",
    },
    headerActions: { flexDirection: "row", alignItems: "center" },
    badge: {
      position: "absolute",
      top: -2,
      right: -2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
    dutyWrap: {
      marginTop: 16,
      borderRadius: 22,
      backgroundColor: colors.surface,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    dutyHero: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
    dutyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    dutyKicker: {
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
    dutyTitle: { color: "#fff", fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
    dutySub: { color: "rgba(255,255,255,0.72)", marginTop: 4, fontSize: 13 },
    dutyBody: { padding: 14 },
    siteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.muted,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 12,
    },
    siteIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: dark ? colors.surface : "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    siteLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    siteValue: { paddingVertical: 0, color: colors.text, fontWeight: "700", fontSize: 15 },
    siteOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end", padding: 16 },
    siteSheet: { backgroundColor: colors.surface, borderRadius: 22, padding: 18 },
    siteSheetKicker: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 1.1, textTransform: "uppercase" },
    siteSheetTitle: { marginTop: 4, marginBottom: 14, fontSize: 20, fontWeight: "800", color: colors.text },
    siteOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.muted,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
    },
    siteOptionOn: { backgroundColor: colors.primary },
    siteOptionIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: dark ? colors.surface : "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    siteOptionName: { fontSize: 15, fontWeight: "700", color: colors.text },
    siteOptionNameOn: { color: "#fff" },
    siteOptionMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    siteOptionMetaOn: { color: "rgba(255,255,255,0.78)" },
    siteEmpty: { color: colors.textSecondary, lineHeight: 20, paddingVertical: 8 },
    split: { flexDirection: "row", gap: 8 },
    splitBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: 14,
      paddingVertical: 12,
      borderWidth: 1,
      minHeight: 46,
    },
    splitIn: { backgroundColor: colors.muted, borderColor: colors.border },
    splitInActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    splitOut: {
      backgroundColor: dark ? "rgba(249, 112, 102, 0.12)" : "#fdf4f3",
      borderColor: dark ? "rgba(249, 112, 102, 0.28)" : "#f0d7d5",
    },
    splitOutActive: { backgroundColor: colors.danger, borderColor: colors.danger },
    splitText: { fontWeight: "700", color: colors.primary, fontSize: 13 },
    splitOutText: { fontWeight: "700", color: colors.danger, fontSize: 13 },
    splitTextActive: { color: "#fff" },
    card: {
      marginTop: 14,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    cardHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
    cardValue: { fontSize: 16, fontWeight: "700", color: colors.text },
    cardMeta: { marginTop: 2, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    cardCta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
    ctaText: { fontSize: 14, fontWeight: "700", color: colors.primary },
    scanBtn: {
      marginTop: 14,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    scanBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });
