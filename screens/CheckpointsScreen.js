import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { toast } from "../components/Toast";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { useCurrentUser } from "../context/UserContext";
import { api } from "../utils/api";
import { getGps } from "../utils/gps";
import { isSuperAdmin } from "../utils/roles";
import { DEFAULT_AREA_KEYS, areaLabel, checkpointArea, DEFAULT_AREA_LABELS } from "../utils/patrolArea";
import { buildReportHtml, createAndSharePdf, escapeHtml } from "../utils/printPdf";
import { useT } from "../utils/i18n";

const emptyForm = {
  name: "",
  siteId: "",
  area: "A",
  lat: "",
  lng: "",
};

function checkpointPayload(row) {
  const area = checkpointArea(row);
  return JSON.stringify({
    type: "aptnexus-checkpoint",
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    ...(area ? { area } : {}),
    ...(row.referralCode ? { code: row.referralCode } : {}),
    ...(row.siteId ? { siteId: row.siteId } : {}),
  });
}

const CheckpointsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user: me } = useCurrentUser();
  const { colors } = useSettings();
  const manage = isSuperAdmin(me);
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [rows, setRows] = useState([]);
  const [sites, setSites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [filterSite, setFilterSite] = useState("All");
  const [filterArea, setFilterArea] = useState("All");

  const load = useCallback(async () => {
    try {
      const [cp, siteData] = await Promise.all([api.checkpoints(), api.sites()]);
      setRows(cp.rows || []);
      setSites((siteData.rows || []).filter((row) => row.active !== false));
      setError("");
    } catch (err) {
      setRows([]);
      setSites([]);
      setError(err?.message || t("loadCheckpointsFailed"));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const visible = useMemo(() => {
    return (rows || []).filter((row) => {
      if (filterSite !== "All" && String(row.siteId) !== String(filterSite)) return false;
      if (filterArea !== "All" && checkpointArea(row) !== filterArea) return false;
      return true;
    });
  }, [rows, filterSite, filterArea]);

  const areaCounts = useMemo(() => {
    const counts = { All: rows.length };
    DEFAULT_AREA_KEYS.forEach((key) => {
      counts[key] = rows.filter((row) => checkpointArea(row) === key).length;
    });
    return counts;
  }, [rows]);

  const openCreate = () => {
    if (!manage) return;
    const defaultSite = sites[0]?.id || "";
    setEditor({ ...emptyForm, siteId: defaultSite, area: "A" });
  };

  const useLocation = async () => {
    setBusy(true);
    try {
      const gps = await getGps({ high: true });
      if (gps?.lat == null || gps?.lng == null) {
        toast.error(t("locationNeeded"));
        return;
      }
      setEditor((current) =>
        current
          ? {
              ...current,
              lat: String(gps.lat),
              lng: String(gps.lng),
            }
          : current,
      );
      toast.success(t("locationCaptured"));
    } catch (err) {
      toast.error(err?.message || t("locationNeeded"));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!manage || !editor || busy) return;
    const name = String(editor.name || "").trim();
    const siteId = String(editor.siteId || "").trim();
    const area = String(editor.area || "").trim().toUpperCase();
    const lat = Number(editor.lat);
    const lng = Number(editor.lng);
    if (name.length < 2) {
      toast.error(t("checkpointNameRequired"));
      return;
    }
    if (!siteId) {
      toast.error(t("checkpointSiteRequired"));
      return;
    }
    if (!DEFAULT_AREA_KEYS.includes(area)) {
      toast.error(t("checkpointAreaRequired"));
      return;
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error(t("checkpointGpsRequired"));
      return;
    }
    setBusy(true);
    try {
      const created = await api.createCheckpoint({ name, siteId, area, lat, lng });
      setEditor(null);
      await load();
      toast.success(t("checkpointAdded"));
      if (created?.row) setPreview(created.row);
    } catch (err) {
      toast.error(err?.message || t("saveCheckpointFailed"));
    } finally {
      setBusy(false);
    }
  };

  const remove = (row) => {
    if (!manage) return;
    Alert.alert(t("removeCheckpointTitle"), t("removeCheckpointBody", { name: row.name }), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("remove"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteCheckpoint(row.id);
            await load();
            toast.success(t("checkpointRemoved"));
          } catch (err) {
            toast.error(err?.message || t("removeCheckpointFailed"));
          }
        },
      },
    ]);
  };

  const downloadOne = async (row) => {
    const zone = areaLabel(checkpointArea(row), DEFAULT_AREA_LABELS);
    const payload = checkpointPayload(row);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(payload)}`;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #12233d; padding: 24px; text-align: center; }
  h1 { font-size: 20px; margin: 0 0 8px; }
  .meta { color: #5b6b7c; font-size: 13px; margin-bottom: 16px; line-height: 1.45; }
  img { width: 240px; height: 240px; }
  .code { margin-top: 14px; font-size: 16px; font-weight: 700; letter-spacing: 0.6px; }
</style></head><body>
  <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#2c5282;">APTNexus checkpoint</div>
  <h1>${escapeHtml(row.name || t("checkpointWord"))}</h1>
  <div class="meta">${escapeHtml([zone, row.siteName, row.referralCode].filter(Boolean).join(" · "))}</div>
  <img src="${qrUrl}" alt="QR" />
  <div class="code">${escapeHtml(row.referralCode || "")}</div>
</body></html>`;
    try {
      const result = await createAndSharePdf({
        html,
        dialogTitle: row.name || t("checkpointWord"),
        landscape: false,
      });
      if (result?.cancelled) return;
      toast.success(t("checkpointDownloaded"));
    } catch (err) {
      toast.error(err?.message || t("downloadFailed"));
    }
  };

  const downloadList = async () => {
    try {
      const result = await createAndSharePdf({
        html: buildReportHtml({
          title: t("checkpoints"),
          meta: t("checkpointsListMeta", { n: visible.length }),
          headers: ["#", t("checkpointWord"), t("areaWord"), t("site"), t("referralCode"), "GPS"],
          rows: visible.map((row, index) => [
            index + 1,
            row.name || "",
            areaLabel(checkpointArea(row), DEFAULT_AREA_LABELS),
            row.siteName || "",
            row.referralCode || "",
            row.lat != null && row.lng != null ? `${row.lat}, ${row.lng}` : "",
          ]),
        }),
        dialogTitle: t("checkpoints"),
      });
      if (result?.cancelled) return;
      toast.success(t("checkpointListDownloaded"));
    } catch (err) {
      toast.error(err?.message || t("downloadFailed"));
    }
  };

  const siteName = (id) => sites.find((s) => String(s.id) === String(id))?.name || "";
  const hasGps = (row) => row?.lat != null && row?.lng != null;

  return (
    <ScreenBackdrop>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <PageHeader
          kicker={t("checkpointsKicker")}
          title={t("checkpoints")}
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={downloadList} hitSlop={8} accessibilityLabel={t("download")}>
                <Ionicons name="download-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              {manage ? (
                <TouchableOpacity style={styles.addBtn} onPress={openCreate} hitSlop={8} accessibilityLabel={t("addCheckpoint")}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />

        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>{t("site")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <TouchableOpacity
              style={[styles.chip, filterSite === "All" && styles.chipOn]}
              onPress={() => setFilterSite("All")}
            >
              <Text style={[styles.chipText, filterSite === "All" && styles.chipTextOn]}>{t("allSites")}</Text>
            </TouchableOpacity>
            {sites.map((site) => (
              <TouchableOpacity
                key={site.id}
                style={[styles.chip, filterSite === site.id && styles.chipOn]}
                onPress={() => setFilterSite(site.id)}
              >
                <Text style={[styles.chipText, filterSite === site.id && styles.chipTextOn]} numberOfLines={1}>
                  {site.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: 12 }]}>{t("areaWord")}</Text>
          <View style={styles.areaFilters}>
            <TouchableOpacity
              style={[styles.areaChip, filterArea === "All" && styles.areaChipOn]}
              onPress={() => setFilterArea("All")}
            >
              <Text style={[styles.areaChipText, filterArea === "All" && styles.areaChipTextOn]}>
                {t("allAreas")} · {areaCounts.All}
              </Text>
            </TouchableOpacity>
            {DEFAULT_AREA_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.areaChip, filterArea === key && styles.areaChipOn]}
                onPress={() => setFilterArea(key)}
              >
                <Text style={[styles.areaChipText, filterArea === key && styles.areaChipTextOn]}>
                  {key} · {areaCounts[key] || 0}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {visible.map((row) => {
          const areaKey = checkpointArea(row);
          const zone = areaLabel(areaKey, DEFAULT_AREA_LABELS);
          const site = row.siteName || siteName(row.siteId);
          return (
            <View key={row.id} style={styles.card}>
              <TouchableOpacity style={styles.cardMain} onPress={() => setPreview(row)} activeOpacity={0.88}>
                <View style={styles.qrThumb}>
                  <QRCode value={checkpointPayload(row)} size={52} backgroundColor="transparent" color={colors.text} />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.name} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <View style={styles.badgeRow}>
                    {areaKey ? (
                      <View style={styles.areaBadge}>
                        <Text style={styles.areaBadgeText}>{areaKey}</Text>
                      </View>
                    ) : null}
                    {site ? (
                      <View style={styles.softBadge}>
                        <Ionicons name="business-outline" size={11} color={colors.textSecondary} />
                        <Text style={styles.softBadgeText} numberOfLines={1}>
                          {site}
                        </Text>
                      </View>
                    ) : null}
                    {hasGps(row) ? (
                      <View style={styles.softBadge}>
                        <Ionicons name="navigate-outline" size={11} color={colors.textSecondary} />
                        <Text style={styles.softBadgeText}>GPS</Text>
                      </View>
                    ) : null}
                  </View>
                  {row.referralCode ? (
                    <View style={styles.codeRow}>
                      <Text style={styles.codeLabel}>{t("referralCode")}</Text>
                      <Text style={styles.code}>{row.referralCode}</Text>
                    </View>
                  ) : zone ? (
                    <Text style={styles.meta}>{zone}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setPreview(row)}>
                  <Ionicons name="eye-outline" size={15} color={colors.primary} />
                  <Text style={styles.actionText}>{t("showQr")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => downloadOne(row)}>
                  <Ionicons name="download-outline" size={15} color={colors.primary} />
                  <Text style={styles.actionText}>{t("download")}</Text>
                </TouchableOpacity>
                {manage ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => remove(row)}>
                    <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    <Text style={[styles.actionText, { color: colors.danger }]}>{t("remove")}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}

        {!visible.length ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name={error ? "cloud-offline-outline" : "scan-outline"} size={24} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{error ? t("couldNotLoadCheckpoints") : t("noCheckpointsYet")}</Text>
            <Text style={styles.emptyCopy}>{error || (manage ? t("addFirstCheckpoint") : t("checkpointsAppear"))}</Text>
            {manage && !error ? (
              <TouchableOpacity style={styles.emptyPrimary} onPress={openCreate} activeOpacity={0.88}>
                <Text style={styles.primaryText}>{t("addCheckpoint")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(editor)} transparent animationType="fade" onRequestClose={() => setEditor(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
          <Pressable style={styles.overlayDismiss} onPress={() => setEditor(null)} />
          <View style={[styles.sheet, { marginTop: insets.top + 36, marginBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.sheetHandle} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetKicker}>{t("newCheckpoint")}</Text>
              <Text style={styles.sheetTitle}>{t("addCheckpoint")}</Text>

              <Text style={styles.label}>{t("name")}</Text>
              <TextInput
                style={styles.input}
                value={editor?.name || ""}
                onChangeText={(value) => setEditor((current) => ({ ...current, name: value }))}
                placeholder={t("checkpointNamePlaceholder")}
                placeholderTextColor={colors.placeholder}
              />

              <Text style={styles.label}>{t("site")}</Text>
              <View style={styles.optionGrid}>
                {sites.map((site) => {
                  const on = String(editor?.siteId) === String(site.id);
                  return (
                    <TouchableOpacity
                      key={site.id}
                      style={[styles.optionChip, on && styles.optionChipOn]}
                      onPress={() => setEditor((current) => ({ ...current, siteId: site.id, area: current?.area || "A" }))}
                    >
                      <Text style={[styles.optionChipText, on && styles.optionChipTextOn]} numberOfLines={1}>
                        {site.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>{t("areaWord")}</Text>
              <View style={styles.areaPickRow}>
                {DEFAULT_AREA_KEYS.map((key) => {
                  const on = editor?.area === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.areaPick, on && styles.areaPickOn]}
                      onPress={() => setEditor((current) => ({ ...current, area: key }))}
                    >
                      <Text style={[styles.areaPickKey, on && styles.areaPickKeyOn]}>{key}</Text>
                      <Text style={[styles.areaPickLabel, on && styles.areaPickLabelOn]}>
                        {areaLabel(key, DEFAULT_AREA_LABELS)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>GPS</Text>
              <View style={styles.gpsRow}>
                <TextInput
                  style={[styles.input, styles.gpsInput]}
                  value={editor?.lat || ""}
                  onChangeText={(value) => setEditor((current) => ({ ...current, lat: value }))}
                  placeholder={t("latitude")}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.gpsInput]}
                  value={editor?.lng || ""}
                  onChangeText={(value) => setEditor((current) => ({ ...current, lng: value }))}
                  placeholder={t("longitude")}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="decimal-pad"
                />
              </View>
              <TouchableOpacity style={styles.locateBtn} onPress={useLocation} disabled={busy} activeOpacity={0.88}>
                <Ionicons name="locate-outline" size={16} color={colors.primary} />
                <Text style={styles.locateText}>{t("useMyLocation")}</Text>
              </TouchableOpacity>

              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.ghost} onPress={() => setEditor(null)}>
                  <Text style={styles.ghostText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primary} onPress={save} disabled={busy} activeOpacity={0.88}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t("addCheckpoint")}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.overlay}>
          <Pressable style={styles.overlayDismiss} onPress={() => setPreview(null)} />
          <View style={[styles.previewSheet, { marginBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetHandle} />
            {preview ? (
              <>
                <Text style={styles.sheetKicker}>{t("checkpointWord")}</Text>
                <Text style={styles.sheetTitle}>{preview.name}</Text>
                <View style={styles.previewBadges}>
                  {checkpointArea(preview) ? (
                    <View style={styles.areaBadge}>
                      <Text style={styles.areaBadgeText}>{checkpointArea(preview)}</Text>
                    </View>
                  ) : null}
                  {preview.siteName || siteName(preview.siteId) ? (
                    <View style={styles.softBadge}>
                      <Ionicons name="business-outline" size={11} color={colors.textSecondary} />
                      <Text style={styles.softBadgeText}>{preview.siteName || siteName(preview.siteId)}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.previewQr}>
                  <QRCode value={checkpointPayload(preview)} size={196} backgroundColor="#fff" color="#12233d" />
                </View>
                {preview.referralCode ? (
                  <View style={styles.previewCodeBox}>
                    <Text style={styles.previewCodeLabel}>{t("referralCode")}</Text>
                    <Text style={styles.previewCode}>{preview.referralCode}</Text>
                  </View>
                ) : null}
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.ghost} onPress={() => setPreview(null)}>
                    <Text style={styles.ghostText}>{t("close")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primary} onPress={() => downloadOne(preview)} activeOpacity={0.88}>
                    <Text style={styles.primaryText}>{t("download")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScreenBackdrop>
  );
};

export default CheckpointsScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    body: { paddingHorizontal: 20 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    filterCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 14,
      ...shadows.card,
    },
    filterLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.textSecondary,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    filters: { gap: 8, paddingRight: 4 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: 160,
    },
    chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.textSecondary, fontWeight: "700", fontSize: 12 },
    chipTextOn: { color: "#fff" },
    areaFilters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    areaChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    areaChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    areaChipText: { color: colors.textSecondary, fontWeight: "800", fontSize: 12 },
    areaChipTextOn: { color: "#fff" },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    cardMain: { flexDirection: "row", alignItems: "center", gap: 12 },
    qrThumb: {
      width: 68,
      height: 68,
      borderRadius: 16,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardCopy: { flex: 1, minWidth: 0, gap: 5 },
    name: { fontSize: 16, fontWeight: "800", color: colors.text },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
    areaBadge: {
      minWidth: 28,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    areaBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
    softBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.muted,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      maxWidth: "70%",
    },
    softBadgeText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, flexShrink: 1 },
    codeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    codeLabel: { fontSize: 10, fontWeight: "700", color: colors.placeholder, textTransform: "uppercase", letterSpacing: 0.4 },
    code: { fontSize: 12, fontWeight: "800", color: colors.primary, letterSpacing: 0.5 },
    meta: { fontSize: 12, color: colors.textSecondary },
    actions: {
      flexDirection: "row",
      gap: 4,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 4,
    },
    actionText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
    empty: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 36,
      paddingHorizontal: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
      ...shadows.card,
    },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: { marginTop: 14, fontSize: 17, fontWeight: "800", color: colors.text },
    emptyCopy: { marginTop: 6, textAlign: "center", color: colors.textSecondary, lineHeight: 19, marginBottom: 18, fontSize: 13 },
    emptyPrimary: {
      minWidth: 160,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    overlayDismiss: { ...StyleSheet.absoluteFillObject },
    sheet: {
      width: "100%",
      maxWidth: 420,
      maxHeight: "88%",
      backgroundColor: colors.surface,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 18,
      ...shadows.card,
    },
    previewSheet: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 18,
      alignItems: "center",
      ...shadows.card,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    sheetKicker: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      textAlign: "center",
    },
    sheetTitle: { marginTop: 4, marginBottom: 14, fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center" },
    label: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      marginBottom: 12,
    },
    optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    optionChip: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: "100%",
    },
    optionChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    optionChipText: { color: colors.text, fontWeight: "700", fontSize: 13 },
    optionChipTextOn: { color: "#fff" },
    areaPickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    areaPick: {
      width: "47%",
      flexGrow: 1,
      minWidth: 120,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    areaPickOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    areaPickKey: { fontSize: 18, fontWeight: "800", color: colors.primary },
    areaPickKeyOn: { color: "#fff" },
    areaPickLabel: { marginTop: 2, fontSize: 12, fontWeight: "600", color: colors.textSecondary },
    areaPickLabelOn: { color: "rgba(255,255,255,0.82)" },
    gpsRow: { flexDirection: "row", gap: 8 },
    gpsInput: { flex: 1 },
    locateBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      marginBottom: 12,
      marginTop: -4,
      backgroundColor: colors.muted,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locateText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
    sheetActions: { flexDirection: "row", gap: 10, marginTop: 8, width: "100%" },
    ghost: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghostText: { color: colors.text, fontWeight: "800", fontSize: 15 },
    primary: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    previewBadges: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 14 },
    previewQr: {
      padding: 18,
      borderRadius: 20,
      backgroundColor: "#fff",
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewCodeBox: {
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginBottom: 10,
      width: "100%",
    },
    previewCodeLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.placeholder,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    previewCode: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: 1,
    },
  });
