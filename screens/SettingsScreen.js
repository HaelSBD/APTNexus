import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Linking,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { useCurrentUser } from "../context/UserContext";
import { api } from "../utils/api";
import { useT } from "../utils/i18n";
import { playToggleFeedback } from "../utils/alertFeedback";
import { askPermission, openAppSettings, readPermissions } from "../utils/permissions";
import Avatar from "../components/Avatar";
import { isAdminRole, isSuperAdmin } from "../utils/roles";

const LANGUAGES = [
  { id: "en", short: "EN", label: "English" },
  { id: "ms", short: "BM", label: "Bahasa Melayu" },
  { id: "zh", short: "ZH", label: "中文" },
];

const languageMeta = (id) => LANGUAGES.find((row) => row.id === id) || LANGUAGES[0];

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, duty } = useCurrentUser();
  const { settings, setSetting, colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [page, setPage] = useState("hub");
  const [photoOpen, setPhotoOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [perms, setPerms] = useState({
    camera: { granted: false, canAsk: true },
    photos: { granted: false, canAsk: true },
    location: { granted: false, canAsk: true },
  });

  const isAdmin = isAdminRole(profile);
  const name = profile?.displayName || profile?.username || "Security";
  const roleLabel = isSuperAdmin(profile) ? t("roleSuper") : isAdmin ? t("roleAdmin") : t("roleSecurity");
  const lang = languageMeta(settings.language);
  const onDuty = Boolean(duty?.clockedIn);
  const appearanceLabel = settings.appearance === "dark" ? t("dark") : settings.appearance === "light" ? t("light") : t("auto");

  const loadPermissions = useCallback(async () => {
    const next = await readPermissions();
    setPerms(next);
  }, []);

  const goHub = () => setPage("hub");
  const stacked = !navigation.getState()?.routeNames?.includes("Home");
  const back = page !== "hub" ? goHub : stacked ? () => navigation.goBack() : undefined;

  useFocusEffect(
    useCallback(() => {
      loadPermissions();
      return () => setPage("hub");
    }, [loadPermissions]),
  );

  useEffect(() => {
    if (page === "app" || page === "gps") loadPermissions();
  }, [page, loadPermissions]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (page !== "hub") {
        setPage("hub");
        return true;
      }
      if (stacked && navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [page, stacked, navigation]);

  const changePassword = async () => {
    if (!currentPassword || newPassword.length < 6) {
      toast.error(t("passwordNeed"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      await api.updateMe({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("passwordUpdated"));
      setPage("hub");
    } catch (error) {
      toast.error(error?.message || t("passwordNeed"));
    } finally {
      setBusy(false);
    }
  };

  const sendSupport = async () => {
    const body = message.trim();
    if (!body) {
      toast.error(t("writeMessage"));
      return;
    }
    setBusy(true);
    try {
      await api.sendFeedback({ subject: subject.trim() || t("support"), message: body });
      setSubject("");
      setMessage("");
      toast.success(t("feedbackSent"));
      setPage("hub");
    } catch {
      Alert.alert(t("support"), t("emailFallback"), [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("openEmail"),
          onPress: () =>
            Linking.openURL(
              `mailto:support@aptnexus.sbd-one.com?subject=${encodeURIComponent(subject.trim() || "APTNexus support")}&body=${encodeURIComponent(body)}`,
            ),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onPermission = async (kind) => {
    const row = perms[kind];
    if (row?.granted || row?.canAsk === false) {
      openAppSettings();
      return;
    }
    const next = await askPermission(kind);
    setPerms((current) => ({ ...current, [kind]: next }));
  };

  const titles = {
    appearance: t("appearance"),
    notifications: t("notifications"),
    password: t("changePassword"),
    language: t("language"),
    gps: t("gps"),
    privacy: t("privacy"),
    support: t("support"),
    app: t("appSettings"),
  };
  const title = titles[page] || t("settings");

  return (
    <ScreenBackdrop>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.body, { paddingTop: insets.top + 12, paddingBottom: stacked ? 36 : 118 }]}
        >
          <PageHeader title={title} onBack={back} />

          {page === "hub" ? (
            <>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setPhotoOpen(true)}>
                <LinearGradient colors={colors.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                  <Avatar photoURL={profile?.photoURL} style={styles.heroPhoto} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroName}>{name}</Text>
                    <Text style={styles.heroHint}>{t("tapFull")}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.section}>{t("account")}</Text>
              <View style={styles.group}>
                <LinkRow
                  styles={styles}
                  colors={colors}
                  icon="lock-closed-outline"
                  title={t("changePassword")}
                  subtitle={t("changePasswordHint")}
                  onPress={() => setPage("password")}
                  last
                />
              </View>

              <Text style={styles.section}>{t("preferences")}</Text>
              <View style={styles.group}>
                <LinkRow
                  styles={styles}
                  colors={colors}
                  icon="notifications-outline"
                  title={t("notifications")}
                  subtitle={settings.notifications ? t("alertsOn") : t("alertsOff")}
                  badge={settings.notifications ? t("on") : t("off")}
                  onPress={() => setPage("notifications")}
                />
                <LinkRow
                  styles={styles}
                  colors={colors}
                  icon="moon-outline"
                  title={t("appearance")}
                  subtitle={appearanceLabel}
                  badge={appearanceLabel}
                  onPress={() => setPage("appearance")}
                />
                <LinkRow
                  styles={styles}
                  colors={colors}
                  icon="language-outline"
                  title={t("language")}
                  subtitle={t("languageHint")}
                  badge={lang.short}
                  onPress={() => setPage("language")}
                />
                <LinkRow
                  styles={styles}
                  colors={colors}
                  icon="phone-portrait-outline"
                  title={t("appSettings")}
                  subtitle={t("appSettingsHint")}
                  onPress={() => setPage("app")}
                  last
                />
              </View>

              <Text style={styles.section}>{t("legal")}</Text>
              <View style={styles.group}>
                <LinkRow
                  styles={styles}
                  colors={colors}
                  icon="location-outline"
                  title={t("gps")}
                  subtitle={onDuty ? t("gpsLive") : t("gpsIdle")}
                  badge={onDuty ? t("trackingOn") : t("trackingOff")}
                  onPress={() => setPage("gps")}
                />
                <LinkRow
                  styles={styles}
                  colors={colors}
                  icon="document-text-outline"
                  title={t("privacy")}
                  subtitle={t("privacyHint")}
                  onPress={() => setPage("privacy")}
                />
                <LinkRow
                  styles={styles}
                  colors={colors}
                  icon="paper-plane-outline"
                  title={t("support")}
                  subtitle={t("supportHint")}
                  onPress={() => setPage("support")}
                  last
                />
              </View>
            </>
          ) : null}

          {page === "appearance" ? (
            <View style={styles.group}>
              {[
                { id: "light", label: t("light"), hint: t("lightHint") },
                { id: "dark", label: t("dark"), hint: t("darkHint") },
                { id: "system", label: t("auto"), hint: t("autoHint") },
              ].map((option, index, list) => {
                const on = settings.appearance === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.choice, index === list.length - 1 && styles.choiceLast]}
                    onPress={() => {
                      setSetting("appearance", option.id);
                      toast.success(t("appearanceApplied"));
                    }}
                    activeOpacity={0.85}
                  >
                    <View>
                      <Text style={styles.choiceTitle}>{option.label}</Text>
                      <Text style={styles.choiceHint}>{option.hint}</Text>
                    </View>
                    {on ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : <View style={styles.choiceOff} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {page === "notifications" ? (
            <View style={styles.group}>
              <ToggleRow
                styles={styles}
                colors={colors}
                label={t("notifOn")}
                hint={t("notifOnHint")}
                value={settings.notifications}
                onValueChange={(value) => {
                  setSetting("notifications", value);
                  if (value) toast.success(t("alertsOn"));
                }}
              />
              <ToggleRow
                styles={styles}
                colors={colors}
                label={t("sound")}
                hint={t("soundHint")}
                value={settings.notificationSound}
                onValueChange={(value) => {
                  setSetting("notificationSound", value);
                  if (value) playToggleFeedback("sound");
                }}
              />
              <ToggleRow
                styles={styles}
                colors={colors}
                label={t("vibration")}
                hint={t("vibrationHint")}
                value={settings.notificationVibration}
                onValueChange={(value) => {
                  setSetting("notificationVibration", value);
                  if (value) playToggleFeedback("vibration");
                }}
                last
              />
            </View>
          ) : null}

          {page === "password" ? (
            <View style={styles.group}>
              <PasswordField
                styles={styles}
                colors={colors}
                label={t("currentPassword")}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                visible={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
              />
              <PasswordField
                styles={styles}
                colors={colors}
                label={t("newPassword")}
                value={newPassword}
                onChangeText={setNewPassword}
                visible={showNew}
                onToggle={() => setShowNew((v) => !v)}
              />
              <PasswordField
                styles={styles}
                colors={colors}
                label={t("confirmPassword")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                visible={showNew}
                onToggle={() => setShowNew((v) => !v)}
              />
              <TouchableOpacity style={styles.save} onPress={changePassword} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t("updatePassword")}</Text>}
              </TouchableOpacity>
            </View>
          ) : null}

          {page === "language" ? (
            <View style={styles.group}>
              {LANGUAGES.map((option, index) => {
                const on = settings.language === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.choice, index === LANGUAGES.length - 1 && styles.choiceLast]}
                    onPress={() => {
                      setSetting("language", option.id);
                      toast.success(option.id === "ms" ? "Bahasa dikemas kini." : option.id === "zh" ? "语言已更新。" : "Language updated.");
                    }}
                    activeOpacity={0.85}
                  >
                    <View>
                      <Text style={styles.choiceTitle}>{option.label}</Text>
                      <Text style={styles.choiceHint}>{option.short}</Text>
                    </View>
                    {on ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : <View style={styles.choiceOff} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {page === "app" ? (
            <View style={styles.group}>
              <PermissionRow
                styles={styles}
                colors={colors}
                t={t}
                icon="camera-outline"
                label={t("camera")}
                granted={perms.camera.granted}
                onPress={() => onPermission("camera")}
              />
              <PermissionRow
                styles={styles}
                colors={colors}
                t={t}
                icon="images-outline"
                label={t("photos")}
                granted={perms.photos.granted}
                onPress={() => onPermission("photos")}
              />
              <PermissionRow
                styles={styles}
                colors={colors}
                t={t}
                icon="location-outline"
                label={t("location")}
                granted={perms.location.granted}
                onPress={() => onPermission("location")}
                last
              />
              <TouchableOpacity style={styles.secondary} onPress={openAppSettings}>
                <Text style={styles.secondaryText}>{t("openPhoneSettings")}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {page === "gps" ? (
            <View style={styles.group}>
              <View style={[styles.statusPill, onDuty ? styles.statusOn : styles.statusOff]}>
                <View style={[styles.dot, { backgroundColor: onDuty ? "#2F9E44" : colors.placeholder }]} />
                <Text style={[styles.statusText, { color: onDuty ? "#2F9E44" : colors.textSecondary }]}>
                  {onDuty ? t("gpsLive") : t("gpsIdle")}
                </Text>
              </View>
              <Text style={styles.bodyText}>{t("gpsBody")}</Text>
              <PermissionRow
                styles={styles}
                colors={colors}
                t={t}
                icon="navigate-outline"
                label={t("gpsPermission")}
                granted={perms.location.granted}
                onPress={() => onPermission("location")}
                last={!isAdmin}
              />
              {isAdmin ? (
                <ToggleRow
                  styles={styles}
                  colors={colors}
                  label={t("highGps")}
                  hint={t("highGpsHint")}
                  value={settings.highAccuracyGps}
                  onValueChange={(value) => setSetting("highAccuracyGps", value)}
                  last
                />
              ) : null}
            </View>
          ) : null}

          {page === "privacy" ? (
            <View style={styles.group}>
              <Text style={styles.bodyText}>{t("privacy1")}</Text>
              <Text style={[styles.bodyText, { marginBottom: 0 }]}>{t("privacy2")}</Text>
            </View>
          ) : null}

          {page === "support" ? (
            <View style={styles.group}>
              <Text style={styles.bodyText}>{t("supportBody")}</Text>
              <Text style={styles.label}>{t("subject")}</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder={t("subjectHint")}
                placeholderTextColor={colors.placeholder}
              />
              <Text style={styles.label}>{t("message")}</Text>
              <TextInput
                style={[styles.input, styles.area]}
                value={message}
                onChangeText={setMessage}
                placeholder={t("messageHint")}
                placeholderTextColor={colors.placeholder}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity style={styles.save} onPress={sendSupport} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t("sendFeedback")}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondary}
                onPress={() =>
                  Linking.openURL(
                    `mailto:support@aptnexus.sbd-one.com?subject=${encodeURIComponent(subject.trim() || "APTNexus support")}&body=${encodeURIComponent(message.trim())}`,
                  )
                }
              >
                <Text style={styles.secondaryText}>{t("emailSupport")}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={photoOpen} transparent animationType="fade" onRequestClose={() => setPhotoOpen(false)}>
        <TouchableOpacity style={styles.photoBackdrop} activeOpacity={1} onPress={() => setPhotoOpen(false)}>
          <Avatar photoURL={profile?.photoURL} style={styles.photoFull} />
          <Text style={styles.photoClose}>{t("tapClose")}</Text>
        </TouchableOpacity>
      </Modal>
    </ScreenBackdrop>
  );
};

const LinkRow = ({ styles, colors, icon, title, subtitle, onPress, danger, last, badge }) => (
  <TouchableOpacity style={[styles.linkRow, last && styles.linkRowLast]} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.linkTitle, danger && styles.linkTitleDanger]}>{title}</Text>
      {subtitle ? <Text style={[styles.linkSub, danger && styles.linkSubDanger]}>{subtitle}</Text> : null}
    </View>
    {badge ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    ) : null}
    <Ionicons name="chevron-forward" size={16} color={danger ? colors.danger : colors.placeholder} />
  </TouchableOpacity>
);

const ToggleRow = ({ styles, colors, label, hint, value, onValueChange, last }) => (
  <View style={[styles.toggleRow, last && styles.linkRowLast]}>
    <View style={{ flex: 1 }}>
      <Text style={styles.linkTitle}>{label}</Text>
      {hint ? <Text style={styles.linkSub}>{hint}</Text> : null}
    </View>
    <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
  </View>
);

const PermissionRow = ({ styles, colors, t, icon, label, granted, onPress, last }) => (
  <View style={[styles.toggleRow, last && styles.linkRowLast]}>
    <View style={[styles.iconWrap, granted && styles.iconWrapOk]}>
      <Ionicons name={icon} size={18} color={granted ? "#2F9E44" : colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.linkTitle}>{label}</Text>
      <Text style={styles.linkSub}>{granted ? t("allowed") : t("notAllowed")}</Text>
    </View>
    <TouchableOpacity style={styles.permBtn} onPress={onPress}>
      <Text style={styles.permBtnText}>{granted ? t("openPhoneSettings") : t("askPermission")}</Text>
    </TouchableOpacity>
  </View>
);

const PasswordField = ({ styles, colors, label, value, onChangeText, visible, onToggle }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.passwordWrap}>
      <TextInput
        style={styles.passwordInput}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.placeholder}
      />
      <TouchableOpacity onPress={onToggle} hitSlop={8} style={styles.eye}>
        <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  </View>
);

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    screen: { flex: 1 },
    body: { paddingHorizontal: 20, paddingBottom: 36 },
    section: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      marginBottom: 8,
      marginTop: 6,
    },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 18,
      padding: 16,
      marginBottom: 20,
    },
    heroPhoto: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 2, borderColor: "rgba(255,255,255,0.35)" },
    heroName: { color: "#fff", fontSize: 18, fontWeight: "700" },
    heroHint: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 3 },
    group: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    linkRowLast: { borderBottomWidth: 0 },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapDanger: { backgroundColor: "rgba(180, 35, 24, 0.12)" },
    iconWrapOk: { backgroundColor: "rgba(47, 158, 68, 0.12)" },
    linkTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
    linkTitleDanger: { color: colors.danger },
    linkSub: { marginTop: 2, fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
    linkSubDanger: { color: colors.danger },
    badge: {
      backgroundColor: colors.muted,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
    choice: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    choiceLast: { borderBottomWidth: 0 },
    choiceTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
    choiceHint: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
    choiceOff: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6, marginTop: 10 },
    input: { backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 16 },
    area: { minHeight: 110, paddingTop: 12 },
    passwordWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: 12,
    },
    passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 16 },
    eye: { paddingHorizontal: 12, paddingVertical: 10 },
    save: { marginTop: 16, marginBottom: 10, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", minHeight: 48 },
    saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    secondary: { marginBottom: 12, borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    secondaryText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
    permBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.muted },
    permBtnText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
    bodyText: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, paddingVertical: 8 },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginTop: 8,
    },
    statusOn: { backgroundColor: "rgba(47, 158, 68, 0.12)" },
    statusOff: { backgroundColor: colors.muted },
    dot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: "700" },
    photoBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    photoFull: { width: 280, height: 280, borderRadius: 16, backgroundColor: colors.muted },
    photoClose: { marginTop: 16, color: "#fff", fontWeight: "600" },
  });

export default SettingsScreen;
