import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageHeader from "../components/PageHeader";
import { formatRelativeTime } from "../utils/format";
import { api } from "../utils/api";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useT } from "../utils/i18n";

const SecurityPatrolScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [lastPatrol, setLastPatrol] = useState(null);
  const [rows, setRows] = useState([]);
  const [points, setPoints] = useState([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([api.dutyStatus(), api.patrols(), api.checkpoints()])
        .then(([status, patrols, checkpoints]) => {
          setLastPatrol(status.lastPatrol || patrols.rows?.[0] || null);
          setRows((patrols.rows || []).slice(0, 8));
          setPoints(checkpoints.rows || []);
        })
        .catch(() => {});
    }, []),
  );

  return (
    <ScreenBackdrop>
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: insets.top + 12 }]}>
        <PageHeader kicker={t("patrolKicker")} title={t("checkpoints")} />

        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate("SecurityCameraScan", { mode: "qr" })}
          activeOpacity={0.88}
        >
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.scanText}>{t("scanCheckpoint")}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          {points.length ? t("pointsOnSite", { n: points.length }) : t("noCheckpointQrs")}
        </Text>

        <View style={styles.card}>
          <Text style={styles.section}>{t("lastScan")}</Text>
          <Text style={styles.bodyText}>
            {lastPatrol
              ? `${lastPatrol.checkpointName || lastPatrol.label}${lastPatrol.createdAt || lastPatrol.at ? ` · ${formatRelativeTime(lastPatrol.createdAt || lastPatrol.at)}` : ""}`
              : t("noneYet")}
          </Text>
        </View>

        {points.length ? (
          <View style={styles.card}>
            <Text style={styles.section}>{t("onThisSite")}</Text>
            {points.map((row, index) => (
              <View key={row.id || row.name} style={[styles.row, index === 0 && styles.rowFirst]}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text style={styles.rowTitle}>{row.name}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.section}>{t("recent")}</Text>
          {rows.length ? (
            rows.map((row, index) => (
              <View key={row.id} style={[styles.row, index === 0 && styles.rowFirst]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{row.checkpointName}</Text>
                  <Text style={styles.rowMeta}>{formatRelativeTime(row.createdAt)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.bodyText}>{t("noPatrolScans")}</Text>
          )}
        </View>
      </ScrollView>
    </ScreenBackdrop>
  );
};

export default SecurityPatrolScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    screen: { flex: 1 },
    body: { paddingHorizontal: 20, paddingBottom: 32 },
    scanBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    scanText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    hint: { marginTop: 10, marginBottom: 18, textAlign: "center", color: colors.textSecondary, fontSize: 13 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    section: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 },
    bodyText: { fontSize: 15, color: colors.text, lineHeight: 22 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingTop: 12,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowFirst: { paddingTop: 0, marginTop: 0, borderTopWidth: 0 },
    rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
    rowMeta: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  });
