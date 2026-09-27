import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Image } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { formatRelativeTime } from "../utils/format";
import { resolveMediaUrl } from "../utils/media";
import { useT } from "../utils/i18n";

const VisitorsLogScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.visitors();
      setRows(data.rows || []);
    } catch {
      setRows([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return rows.filter((row) => new Date(row.createdAt).getTime() >= start.getTime()).length;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.visitorName, row.icNumber, row.plateNumber, row.unit, row.phone, row.guardName]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, query]);

  return (
    <ScreenBackdrop>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 12, paddingBottom: 36 }]}
        ListHeaderComponent={
          <View>
            <PageHeader kicker={t("gateLog")} title={t("tabVisitors")} onBack={() => navigation.goBack()} />
            <Text style={styles.count}>{t("registeredToday", { today, total: rows.length })}</Text>
            <View style={styles.search}>
              <Ionicons name="search-outline" size={16} color={colors.placeholder} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={t("searchVisitors")}
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t("noVisitors")}</Text>}
        renderItem={({ item }) => {
          const photo = item.icPhotoUrl ? { uri: resolveMediaUrl(item.icPhotoUrl) } : null;
          return (
            <View style={styles.card}>
              {photo ? <Image source={photo} style={styles.photo} /> : <View style={styles.photoFallback} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.visitorName}</Text>
                <Text style={styles.meta}>
                  {item.unit ? t("unitLabel", { unit: item.unit }) : t("unitEmpty")}
                  {item.plateNumber ? ` · ${item.plateNumber}` : ""}
                </Text>
                <Text style={styles.meta}>
                  {item.guardName || t("gate")}
                  {item.createdAt ? ` · ${formatRelativeTime(item.createdAt)}` : ""}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </ScreenBackdrop>
  );
};

export default VisitorsLogScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    list: { paddingHorizontal: 16 },
    count: { color: colors.textSecondary, marginTop: -8, marginBottom: 12, fontSize: 13 },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      marginBottom: 14,
    },
    searchInput: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 15 },
    empty: { color: colors.textSecondary, textAlign: "center", marginTop: 24 },
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
    photo: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.muted },
    photoFallback: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.muted },
    title: { fontWeight: "700", color: colors.text, fontSize: 15 },
    meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  });
