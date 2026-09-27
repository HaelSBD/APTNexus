import React, { useCallback, useState } from "react";
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
  Switch,
  ActivityIndicator,
  Alert,
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
import { useT } from "../utils/i18n";

const emptyForm = { name: "", address: "", active: true, isDefault: false };

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
    setEditor({ ...row, active: row.active !== false, photoUri: "", photoFile: null });
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
        <Text style={styles.lead}>{t("sitesLead")}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {rows.length ? (
          rows.map((row) => (
            <View key={row.id} style={styles.card}>
              <TouchableOpacity style={styles.cardMain} onPress={() => openEdit(row)} activeOpacity={manage ? 0.88 : 1}>
                <SiteMark name={row.name} photoURL={row.photoURL} size={56} colors={colors} />
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.name}>{row.name}</Text>
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
                  <Text style={styles.meta}>
                    {row.onDutyCount ? t("staffOnDuty", { n: row.onDutyCount }) : t("nobodyOnDuty")}
                    {" · "}
                    {t("assignedCount", { n: row.assignedCount || (row.people || []).length })}
                  </Text>
                  {(row.people || []).length ? (
                    <Text style={styles.people}>
                      {(row.people || []).map((person) => person.displayName || person.username).join(" · ")}
                    </Text>
                  ) : (
                    <Text style={styles.meta}>{row.address || t("nobodyAssigned")}</Text>
                  )}
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
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={28} color={colors.placeholder} />
            <Text style={styles.emptyTitle}>{error ? t("couldNotLoadSites") : t("noSitesYet")}</Text>
            <Text style={styles.emptyCopy}>
              {error || (manage ? t("addFirstSite") : t("sitesAppear"))}
            </Text>
            {manage ? (
              <TouchableOpacity style={styles.primary} onPress={openCreate} activeOpacity={0.88}>
                <Text style={styles.primaryText}>{t("addSite")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Modal visible={Boolean(editor)} transparent animationType="fade" onRequestClose={() => setEditor(null)}>
        <Pressable style={styles.overlay} onPress={() => setEditor(null)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), maxHeight: "88%" }]} onPress={() => {}}>
            <ScrollView keyboardShouldPersistTaps="handled">
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
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("activeOnClockIn")}</Text>
              <Switch
                value={editor?.active !== false}
                onValueChange={(value) => setEditor((current) => ({ ...current, active: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("defaultSiteSwitch")}</Text>
              <Switch
                value={Boolean(editor?.isDefault)}
                onValueChange={(value) => setEditor((current) => ({ ...current, isDefault: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
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
        </Pressable>
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
    lead: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 16, marginTop: -8 },
    error: { color: colors.danger, fontWeight: "700", marginBottom: 12, lineHeight: 20 },
    people: { color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 4, lineHeight: 18 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    cardMain: { flexDirection: "row", alignItems: "center", gap: 12 },
    photoPick: { alignItems: "center", gap: 8, marginBottom: 16 },
    photoPickText: { color: colors.primary, fontWeight: "800", fontSize: 13 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    name: { fontSize: 16, fontWeight: "700", color: colors.text },
    meta: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
    badge: {
      backgroundColor: colors.muted,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: { fontSize: 10, fontWeight: "800", color: colors.primary, letterSpacing: 0.4, textTransform: "uppercase" },
    badgeOff: { backgroundColor: colors.muted },
    badgeOffText: { fontSize: 10, fontWeight: "800", color: colors.textSecondary, letterSpacing: 0.4, textTransform: "uppercase" },
    actions: { flexDirection: "row", gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    actionBtn: { paddingVertical: 4, paddingHorizontal: 2 },
    actionText: { fontWeight: "700", color: colors.primary, fontSize: 13 },
    empty: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyTitle: { marginTop: 10, fontSize: 17, fontWeight: "800", color: colors.text },
    emptyCopy: { marginTop: 6, textAlign: "center", color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end", padding: 16 },
    sheet: { backgroundColor: colors.surface, borderRadius: 22, padding: 18 },
    sheetKicker: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 1.1, textTransform: "uppercase" },
    sheetTitle: { marginTop: 4, marginBottom: 14, fontSize: 20, fontWeight: "800", color: colors.text },
    label: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
    input: { backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 12 },
    switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingVertical: 4 },
    switchLabel: { color: colors.text, fontWeight: "600", fontSize: 15 },
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
