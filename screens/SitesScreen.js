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
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import SiteMark from "../components/SiteMark";
import { toast } from "../components/Toast";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { useCurrentUser } from "../context/UserContext";
import { isSuperAdmin } from "../utils/roles";
import { prepareJpeg } from "../utils/media";
import { askPermission, openAppSettings } from "../utils/permissions";
import { fixedSiteAreas, normalizeSiteAreas } from "../utils/patrolArea";
import { useT } from "../utils/i18n";

const emptyForm = { name: "", address: "", active: true, isDefault: false, areas: fixedSiteAreas() };

const SitesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user: me } = useCurrentUser();
  const { colors } = useSettings();
  const manage = isSuperAdmin(me);
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.sites();
      setRows(data.rows || []);
      setError("");
    } catch (err) {
      setRows([]);
      setError(err?.message || t("loadSitesFailed"));
    }
  }, []);

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

  const openCreate = () => {
    if (!manage) return;
    setEditor({ ...emptyForm, isDefault: rows.length === 0, photoUri: "", photoFile: null });
  };
  const openEdit = (row) => {
    if (!manage) return;
    setEditor({
      ...row,
      active: row.active !== false,
      areas: fixedSiteAreas(),
      photoUri: "",
      photoFile: null,
    });
  };

  const pickPhoto = async (fromCamera) => {
    const permission = await askPermission(fromCamera ? "camera" : "photos");
    if (!permission.granted) {
      Alert.alert(t("appSettings"), fromCamera ? t("allowSiteCamera") : t("allowSitePhotos"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("openPhoneSettings"), onPress: openAppSettings },
      ]);
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    const uri = result.assets?.[0]?.uri;
    if (result.canceled || !uri) return;
    try {
      const prepared = await prepareJpeg(uri, 1200);
      setEditor((current) => ({
        ...current,
        photoUri: prepared.uri,
        photoFile: { uri: prepared.uri, name: "site.jpg", type: "image/jpeg" },
      }));
    } catch (error) {
      toast.error(error?.message || t("photoUseFailed"));
    }
  };

  const save = async () => {
    if (busy || !editor || !manage) return;
    const name = String(editor.name || "").trim();
    if (name.length < 2) {
      toast.error(t("siteNameRequired"));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name,
        address: String(editor.address || "").trim(),
        active: editor.active !== false,
        isDefault: Boolean(editor.isDefault),
      };
      const file = editor.photoFile || null;
      if (editor.id) await api.updateSite(editor.id, payload, file);
      else await api.createSite(payload, file);
      setEditor(null);
      await load();
      toast.success(editor.id ? t("siteUpdated") : t("siteAdded"));
    } catch (error) {
      toast.error(error?.message || t("saveSiteFailed"));
    } finally {
      setBusy(false);
    }
  };

  const setDefault = async (row) => {
    try {
      await api.updateSite(row.id, { isDefault: true });
      await load();
    } catch (error) {
      toast.error(error?.message || t("setDefaultFailed"));
    }
  };

  const remove = (row) => {
    Alert.alert(t("removeSiteTitle"), t("removeSiteBody", { name: row.name }), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("remove"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteSite(row.id);
            await load();
            toast.success(t("siteRemoved"));
          } catch (error) {
            toast.error(error?.message || t("removeSiteFailed"));
          }
        },
      },
    ]);
  };

  const totals = useMemo(() => {
    const onDuty = rows.reduce((sum, row) => sum + (row.onDutyCount || 0), 0);
    const active = rows.filter((row) => row.active !== false).length;
    return { sites: rows.length, onDuty, active };
  }, [rows]);

  return (
    <ScreenBackdrop>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <PageHeader
          kicker={t("sitesKicker")}
          title={t("deskSites")}
          onBack={() => navigation.goBack()}
          right={
            manage ? (
              <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.88}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            ) : null
          }
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {rows.length ? (
          <>
            <View style={styles.summary}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{totals.sites}</Text>
                <Text style={styles.summaryLabel}>{t("totalWord")}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{totals.onDuty}</Text>
                <Text style={styles.summaryLabel}>{t("onDuty")}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{totals.active}</Text>
                <Text style={styles.summaryLabel}>{t("active")}</Text>
              </View>
            </View>

            {rows.map((row) => {
              const assigned = row.assignedCount || (row.people || []).length;
              const onDuty = row.onDutyCount || 0;
              const areaCount = normalizeSiteAreas(row.areas || []).length;
              return (
                <View key={row.id} style={styles.card}>
                  <TouchableOpacity style={styles.cardMain} onPress={() => openEdit(row)} activeOpacity={manage ? 0.88 : 1}>
                    <SiteMark name={row.name} photoURL={row.photoURL} size={52} colors={colors} />
                    <View style={styles.cardCopy}>
                      <View style={styles.titleRow}>
                        <Text style={styles.name} numberOfLines={1}>
                          {row.name}
                        </Text>
                        {row.isDefault ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{t("defaultSite")}</Text>
                          </View>
                        ) : null}
                        {row.active === false ? (
                          <View style={[styles.badge, styles.badgeOff]}>
                            <Text style={styles.badgeOffText}>{t("off")}</Text>
                          </View>
                        ) : null}
                      </View>
                      {row.address ? (
                        <Text style={styles.subtitle} numberOfLines={1}>
                          {row.address}
                        </Text>
                      ) : null}
                      <View style={styles.statRow}>
                        <View style={styles.statPill}>
                          <View style={[styles.statDot, onDuty ? styles.statDotLive : null]} />
                          <Text style={[styles.statText, onDuty ? styles.statTextLive : null]}>
                            {onDuty ? t("staffOnDuty", { n: onDuty }) : t("nobodyOnDuty")}
                          </Text>
                        </View>
                        <Text style={styles.statSep}>·</Text>
                        <Text style={styles.statMuted}>{t("assignedCount", { n: assigned })}</Text>
                        <Text style={styles.statSep}>·</Text>
                        <Text style={styles.statMuted}>{t("areasCount", { n: areaCount })}</Text>
                      </View>
                    </View>
                    {manage ? <Ionicons name="chevron-forward" size={16} color={colors.placeholder} /> : null}
                  </TouchableOpacity>
                  {manage ? (
                    <View style={styles.actions}>
                      {!row.isDefault && row.active !== false ? (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setDefault(row)}>
                          <Text style={styles.actionText}>{t("makeDefault")}</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(row)}>
                        <Text style={styles.actionText}>{t("edit")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => remove(row)}>
                        <Text style={[styles.actionText, { color: colors.danger }]}>{t("remove")}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="business-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{error ? t("couldNotLoadSites") : t("noSitesYet")}</Text>
            <Text style={styles.emptyCopy}>{error || (manage ? t("addFirstSite") : t("sitesAppear"))}</Text>
            {manage ? (
              <TouchableOpacity style={styles.primary} onPress={openCreate} activeOpacity={0.88}>
                <Text style={styles.primaryText}>{t("addSite")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Modal visible={Boolean(editor)} transparent animationType="fade" onRequestClose={() => setEditor(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.overlayDismiss} onPress={() => setEditor(null)} />
          <Pressable
            style={[styles.sheet, { marginTop: Math.max(insets.top + 24, 48), maxHeight: "78%" }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
              <Text style={styles.sheetKicker}>{editor?.id ? t("editSite") : t("newSite")}</Text>
              <Text style={styles.sheetTitle}>{editor?.id ? editor.name || t("site") : t("addASite")}</Text>
              <TouchableOpacity
                style={styles.photoPick}
                onPress={() =>
                  Alert.alert(t("siteImage"), undefined, [
                    { text: t("takePhoto"), onPress: () => pickPhoto(true) },
                    { text: t("choosePhoto"), onPress: () => pickPhoto(false) },
                    { text: t("cancel"), style: "cancel" },
                  ])
                }
                activeOpacity={0.88}
              >
                <SiteMark name={editor?.name || "S"} photoURL={editor?.photoURL} uri={editor?.photoUri} size={88} radius={18} colors={colors} />
                <Text style={styles.photoPickText}>{editor?.photoUri || editor?.photoURL ? t("changeSiteImage") : t("addSiteImage")}</Text>
              </TouchableOpacity>
              <Text style={styles.label}>{t("name")}</Text>
              <TextInput
                style={styles.input}
                value={editor?.name || ""}
                onChangeText={(value) => setEditor((current) => ({ ...current, name: value }))}
                placeholder="Tower A"
                placeholderTextColor={colors.placeholder}
              />
              <Text style={styles.label}>{t("location")}</Text>
              <TextInput
                style={styles.input}
                value={editor?.address || ""}
                onChangeText={(value) => setEditor((current) => ({ ...current, address: value }))}
                placeholder={t("optionalLocation")}
                placeholderTextColor={colors.placeholder}
              />

              <View style={styles.areasBlock}>
                <Text style={styles.label}>{t("areasWord")}</Text>
                <Text style={styles.areasHint}>{t("siteAreasHint")}</Text>
                <View style={styles.areaChips}>
                  {fixedSiteAreas().map((area) => (
                    <View key={area.key} style={styles.areaChip}>
                      <Text style={styles.areaChipText}>{area.key}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.ghost} onPress={() => setEditor(null)}>
                  <Text style={styles.ghostText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primary} onPress={save} disabled={busy} activeOpacity={0.88}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{editor?.id ? t("save") : t("addSite")}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenBackdrop>
  );
};

export default SitesScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    body: { paddingHorizontal: 20 },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    error: { color: colors.danger, fontWeight: "700", marginBottom: 12, lineHeight: 20 },
    summary: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 8,
      marginBottom: 16,
      ...shadows.card,
    },
    summaryStat: { flex: 1, alignItems: "center" },
    summaryValue: { fontSize: 20, fontWeight: "800", color: colors.text },
    summaryLabel: { marginTop: 2, fontSize: 11, fontWeight: "700", color: colors.textSecondary },
    summaryDivider: { width: 1, height: 28, backgroundColor: colors.border },
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
    cardCopy: { flex: 1, minWidth: 0, gap: 3 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    name: { fontSize: 16, fontWeight: "800", color: colors.text, flexShrink: 1 },
    subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
    statRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" },
    statPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.muted,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.placeholder },
    statDotLive: { backgroundColor: colors.live },
    statText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
    statTextLive: { color: colors.text },
    statSep: { color: colors.placeholder, fontSize: 12, fontWeight: "700" },
    statMuted: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
    badge: {
      backgroundColor: colors.muted,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: { fontSize: 10, fontWeight: "800", color: colors.primary, letterSpacing: 0.4, textTransform: "uppercase" },
    badgeOff: { backgroundColor: colors.muted },
    badgeOffText: { fontSize: 10, fontWeight: "800", color: colors.textSecondary, letterSpacing: 0.4, textTransform: "uppercase" },
    actions: { flexDirection: "row", gap: 14, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    actionBtn: { paddingVertical: 2 },
    actionText: { fontWeight: "700", color: colors.primary, fontSize: 13 },
    photoPick: { alignItems: "center", gap: 8, marginBottom: 16 },
    photoPickText: { color: colors.primary, fontWeight: "800", fontSize: 13 },
    empty: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 36,
      paddingHorizontal: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
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
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-start",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    overlayDismiss: { ...StyleSheet.absoluteFillObject },
    sheet: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 18,
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
    sheetKicker: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 1.1, textTransform: "uppercase", textAlign: "center" },
    sheetTitle: { marginTop: 4, marginBottom: 14, fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center" },
    label: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
    input: { backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 12 },
    areasBlock: { marginTop: 8, marginBottom: 4 },
    areasHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: -2, marginBottom: 10 },
    areaChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
    areaChip: {
      minWidth: 44,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    areaChipText: { fontSize: 14, fontWeight: "800", color: colors.primary },
    sheetActions: { flexDirection: "row", gap: 10, marginTop: 12 },
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
  });
