import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  FlatList,
  RefreshControl,
  Image,
  Linking,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { useCurrentUser } from "../context/UserContext";
import { api } from "../utils/api";
import { resolveMediaUrl } from "../utils/media";
import { initialOf } from "../utils/accounts";
import { isSecurityRole, isSuperAdmin } from "../utils/roles";
import { translateRole, useT } from "../utils/i18n";

const FILTERS = [
  { key: "all", labelKey: "filterAll" },
  { key: "security", labelKey: "roleSecurity" },
  { key: "admin", labelKey: "roleAdmin" },
  { key: "disabled", labelKey: "disabled" },
];

const openStack = (navigation, name, params) => {
  const parent = navigation.getParent();
  (parent || navigation).navigate(name, params);
};

const TeamScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const asTab = useRoute().name === "Team";
  const { user: me } = useCurrentUser();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.users();
      setUsers(data.rows || []);
    } catch {
      setUsers([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const superViewer = isSuperAdmin(me);

  const counts = useMemo(() => {
    // Super Admins are never counted or shown on Team.
    const visible = users.filter((row) => !isSuperAdmin(row));
    const active = visible.filter((row) => row.active !== false);
    return {
      total: visible.length,
      security: active.filter(isSecurityRole).length,
      admin: active.filter((row) => row.role === "admin").length,
    };
  }, [users]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = users.filter((row) => {
      // Super Admins stay hidden from everyone — including other Super Admins.
      if (isSuperAdmin(row)) return false;
      if (filter === "security" && !isSecurityRole(row)) return false;
      if (filter === "admin" && row.role !== "admin") return false;
      if (filter === "disabled" && row.active !== false) return false;
      if (filter !== "disabled" && filter !== "all" && row.active === false) return false;
      if (!q) return true;
      return [row.displayName, row.username, row.phone, row.address, row.role, row.email].join(" ").toLowerCase().includes(q);
    });
    return [...rows].sort((a, b) =>
      String(a.displayName || a.username || "").localeCompare(String(b.displayName || b.username || ""), undefined, {
        sensitivity: "base",
      }),
    );
  }, [users, query, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => {
    const photo = item.photoURL ? { uri: resolveMediaUrl(item.photoURL) } : null;
    const disabled = item.active === false;
    const self = String(item.id) === String(me?.id);
    return (
      <Pressable
        style={({ pressed }) => [styles.card, disabled && styles.cardDisabled, pressed && styles.cardPressed]}
        onPress={() => openStack(navigation, "TeamMember", { userId: item.id, user: item })}
        android_ripple={{ color: colors.muted }}
      >
        {photo ? (
          <Image source={photo} style={styles.photo} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialOf(item.displayName || item.username)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.displayName || item.username}
            </Text>
            {self ? <Text style={styles.you}>{t("you")}</Text> : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            @{item.username}
            {item.address ? ` · ${item.address}` : ""}
          </Text>
          <View style={styles.chipRow}>
            <View style={[styles.chip, item.role === "admin" ? styles.chipAdmin : styles.chipSecurity]}>
              <Text style={[styles.chipText, item.role === "admin" && styles.chipTextAdmin]}>
                {translateRole(t, item.role)}
              </Text>
            </View>
            {disabled ? (
              <View style={styles.chipOff}>
                <Text style={styles.chipOffText}>{t("disabled")}</Text>
              </View>
            ) : item.phone ? (
              <Text style={styles.phone}>{item.phone}</Text>
            ) : null}
          </View>
        </View>
        {item.phone ? (
          <TouchableOpacity style={styles.call} onPress={() => Linking.openURL(`tel:${item.phone}`)} hitSlop={8}>
            <Ionicons name="call-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
      </Pressable>
    );
  };

  return (
    <ScreenBackdrop>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 12, paddingBottom: asTab ? 118 : 36 }]}
        ListHeaderComponent={
          <View>
            <PageHeader
              kicker={t("management")}
              title={t("tabTeam")}
              onBack={asTab ? undefined : () => navigation.goBack()}
              right={
                superViewer ? (
                  <TouchableOpacity style={styles.addBtn} onPress={() => openStack(navigation, "TeamCreate")} activeOpacity={0.88}>
                    <Ionicons name="person-add-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                ) : null
              }
            />
            <Text style={styles.count}>
              {t("teamCountDetail", { total: counts.total, security: counts.security, admin: counts.admin })}
            </Text>
            <View style={styles.search}>
              <Ionicons name="search-outline" size={16} color={colors.placeholder} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={t("searchTeam")}
                placeholderTextColor={colors.placeholder}
              />
            </View>
            <View style={styles.filters}>
              {FILTERS.map((item) => {
                const on = filter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.filter, on && styles.filterOn]}
                    onPress={() => setFilter(item.key)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.filterText, on && styles.filterTextOn]}>{t(item.labelKey)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={22} color={colors.primary} />
            <Text style={styles.emptyTitle}>{query || filter !== "all" ? t("noMatches") : t("noAccounts")}</Text>
            <Text style={styles.emptyCopy}>
              {query || filter !== "all" ? t("tryFilter") : superViewer ? t("addTeamHint") : t("teamAppear")}
            </Text>
          </View>
        }
      />
    </ScreenBackdrop>
  );
};

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    list: { paddingHorizontal: 16 },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    count: { color: colors.textSecondary, marginTop: -8, marginBottom: 14, fontSize: 13 },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    searchInput: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 15 },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    filter: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
    filterTextOn: { color: "#fff" },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    cardDisabled: { opacity: 0.62 },
    cardPressed: { backgroundColor: colors.muted },
    photo: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.muted },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: colors.primary, fontWeight: "800", fontSize: 18 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    name: { flex: 1, fontWeight: "700", color: colors.text, fontSize: 15 },
    you: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.primary,
      backgroundColor: colors.muted,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
      overflow: "hidden",
    },
    meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    chipRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" },
    chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    chipSecurity: { backgroundColor: colors.muted },
    chipAdmin: { backgroundColor: "rgba(212, 160, 23, 0.16)" },
    chipText: { fontSize: 11, fontWeight: "800", color: colors.primary },
    chipTextAdmin: { color: colors.warning },
    chipOff: { backgroundColor: "rgba(180, 35, 24, 0.1)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    chipOffText: { fontSize: 11, fontWeight: "800", color: colors.danger },
    phone: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
    call: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    empty: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 24 },
    emptyTitle: { fontWeight: "800", color: colors.text, marginTop: 8 },
    emptyCopy: { color: colors.textSecondary, textAlign: "center", marginTop: 4, lineHeight: 19, fontSize: 13 },
  });

export default TeamScreen;
