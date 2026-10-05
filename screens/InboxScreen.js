import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { useInbox } from "../context/InboxContext";
import { useCurrentUser } from "../context/UserContext";
import { formatRelativeTime } from "../utils/format";
import { isAdminRole } from "../utils/roles";
import { useT } from "../utils/i18n";

const ADMIN_TABS = [
  { key: "all", labelKey: "filterAll" },
  { key: "gate", labelKey: "gate" },
  { key: "patrol", labelKey: "tabPatrol" },
  { key: "duty", labelKey: "tabDutyBoard" },
  { key: "chat", labelKey: "tabChat" },
  { key: "update", labelKey: "tabBriefing" },
  { key: "support", labelKey: "tabSupport" },
  { key: "team", labelKey: "tabTeam" },
];

const SECURITY_TABS = [
  { key: "all", labelKey: "filterAll" },
  { key: "gate", labelKey: "gate" },
  { key: "patrol", labelKey: "tabPatrol" },
  { key: "chat", labelKey: "tabChat" },
  { key: "update", labelKey: "tabBriefing" },
];

const openChat = (navigation, params) => {
  navigation.navigate("Main", { screen: "Chat", params: params || {} });
};

const openRelated = (navigation, item, admin) => {
  if (item.kind === "update" || item.entity === "announcement") {
    openChat(navigation, { tab: "Updates" });
    return;
  }
  if (item.kind === "chat") {
    const channel = item.meta?.channel || "";
    if (channel.startsWith("g:") || item.meta?.groupId) {
      openChat(navigation, {
        tab: "Groups",
        groupId: item.meta?.groupId || channel.slice(2),
        groupName: item.meta?.groupName || "",
        channel,
      });
      return;
    }
    if (channel.startsWith("dm:") || item.meta?.peerId) {
      openChat(navigation, {
        channel,
        peerId: item.meta?.peerId || "",
        peerName: item.actorName || "",
        desk: item.meta?.desk || "",
      });
      return;
    }
    openChat(navigation, channel ? { channel } : {});
    return;
  }
  if (admin) {
    const parent = navigation.getParent();
    if (item.kind === "gate") {
      (parent || navigation).navigate("Visitors");
      return;
    }
    if (item.kind === "duty" || item.kind === "patrol") {
      navigation.navigate("Duty");
      return;
    }
    if (item.kind === "team") {
      if (item.entityId) (parent || navigation).navigate("TeamMember", { userId: item.entityId });
      else navigation.navigate("Team");
    }
    return;
  }
  const tab = item.kind === "gate" ? "Gate" : item.kind === "patrol" ? "Patrol" : "Home";
  navigation.navigate("Main", { screen: tab });
};

const InboxScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const asTab = route.name === "Inbox";
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const { profile, user } = useCurrentUser();
  const admin = isAdminRole(profile || user);
  const tabs = admin ? ADMIN_TABS : SECURITY_TABS;
  const { items, unread, refresh, markRead, markAllRead, remove } = useInbox();
  const [tab, setTab] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const data = useMemo(() => (tab === "all" ? items : items.filter((row) => row.kind === tab)), [items, tab]);
  const unreadInTab = useMemo(() => data.filter((row) => !row.read).length, [data]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const onPress = async (item) => {
    if (!item.read) await markRead(item);
    openRelated(navigation, item, admin);
  };

  const onLongPress = (item) => {
    Alert.alert(item.title, item.body || t("inboxUpdate"), [
      { text: t("cancel"), style: "cancel" },
      item.read ? null : { text: t("markAsRead"), onPress: () => markRead(item) },
      { text: t("remove"), style: "destructive", onPress: () => remove(item) },
    ].filter(Boolean));
  };

  return (
    <ScreenBackdrop>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 12, paddingBottom: asTab ? 118 : insets.bottom + 28 }]}
        ListHeaderComponent={
          <View>
            <PageHeader
              kicker={asTab ? t("operations") : t("updates")}
              title={asTab ? t("tabInbox") : t("notifications")}
              onBack={asTab ? undefined : () => navigation.goBack()}
              right={
                unread ? (
                  <TouchableOpacity onPress={markAllRead} hitSlop={8}>
                    <Text style={styles.readAll}>{t("readAll")}</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
            <Text style={styles.count}>
              {unread ? t("unreadCount", { n: unread }) : t("caughtUp")}
              {tab !== "all" ? ` · ${t("inThisTab", { n: unreadInTab })}` : ` · ${t("totalCount", { n: items.length })}`}
            </Text>
            <View style={styles.tabs}>
              {tabs.map((item) => {
                const count = item.key === "all" ? unread : items.filter((row) => row.kind === item.key && !row.read).length;
                return (
                  <TouchableOpacity key={item.key} style={[styles.tab, tab === item.key && styles.tabOn]} onPress={() => setTab(item.key)}>
                    <Text style={[styles.tabText, tab === item.key && styles.tabTextOn]}>{t(item.labelKey)}</Text>
                    {count ? (
                      <View style={[styles.tabBadge, tab === item.key && styles.tabBadgeOn]}>
                        <Text style={[styles.tabBadgeText, tab === item.key && styles.tabBadgeTextOn]}>{count > 9 ? "9+" : count}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-outline" size={26} color={colors.primary} />
            <Text style={styles.emptyTitle}>{tab === "all" ? t("noNotifications") : t("nothingInTab")}</Text>
            <Text style={styles.empty}>
              {admin ? t("inboxAdminHint") : t("inboxSecurityHint")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => onPress(item)}
            onLongPress={() => onLongPress(item)}
            activeOpacity={0.88}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, !item.read && styles.iconWrapOn]}>
                <Ionicons name={item.icon} size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  {!item.read ? <View style={styles.dot} /> : null}
                  <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
                </View>
                {item.meta ? <Text style={styles.meta}>{item.meta}</Text> : null}
              </View>
              <Text style={styles.time}>{formatRelativeTime(item.at)}</Text>
            </View>
            {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
          </TouchableOpacity>
        )}
      />
    </ScreenBackdrop>
  );
};

export default InboxScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    list: { paddingHorizontal: 16 },
    readAll: { color: colors.primary, fontWeight: "800", fontSize: 13 },
    count: { color: colors.textSecondary, marginTop: -8, marginBottom: 12, fontSize: 13 },
    tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
    tabTextOn: { color: "#fff" },
    tabBadge: {
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    tabBadgeOn: { backgroundColor: "rgba(255,255,255,0.22)" },
    tabBadgeText: { color: colors.primary, fontSize: 9, fontWeight: "800" },
    tabBadgeTextOn: { color: "#fff" },
    emptyWrap: { alignItems: "center", paddingVertical: 36, paddingHorizontal: 24 },
    emptyTitle: { fontWeight: "800", color: colors.text, marginTop: 8 },
    empty: { color: colors.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 19, fontSize: 13 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    cardUnread: { borderColor: colors.primary, backgroundColor: colors.muted },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapOn: { backgroundColor: colors.surface },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
    title: { fontWeight: "700", color: colors.text, fontSize: 15, flexShrink: 1 },
    titleUnread: { fontWeight: "800" },
    meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    time: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
    body: { marginTop: 10, color: colors.text, lineHeight: 20, fontSize: 14 },
  });
