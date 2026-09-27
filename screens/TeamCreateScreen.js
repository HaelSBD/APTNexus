import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Share,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { makeTempPassword, sanitizeUsername } from "../utils/accounts";
import SiteSelect from "../components/SiteSelect";
import { useCurrentUser } from "../context/UserContext";
import { isSuperAdmin } from "../utils/roles";
import { translateRole, useT } from "../utils/i18n";

const BASE_ROLES = [
  { id: "security", hintKey: "roleHintSecurity", icon: "shield-outline" },
  { id: "admin", hintKey: "roleHintAdmin", icon: "briefcase-outline" },
  { id: "superadmin", hintKey: "roleHintSuper", icon: "diamond-outline" },
];

const emptyForm = {
  displayName: "",
  username: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  role: "security",
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const Field = ({ icon, label, hint, colors, styles, children }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      {children}
    </View>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const TeamCreateScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const { user: me } = useCurrentUser();
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const manage = isSuperAdmin(me);
  const roles = useMemo(
    () => (manage ? BASE_ROLES : BASE_ROLES.filter((item) => item.id !== "superadmin")),
    [manage],
  );

  useEffect(() => {
    if (!manage) navigation.goBack();
  }, [manage, navigation]);

  const selected = useMemo(() => roles.find((item) => item.id === form.role) || roles[0], [form.role, roles]);
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (busy || !manage) return;
    const username = sanitizeUsername(form.username);
    const displayName = form.displayName.trim() || username;
    if (displayName.length < 2) {
      toast.error(t("nameTooShort"));
      return;
    }
    if (username.length < 3) {
      toast.error(t("usernameTooShort"));
      return;
    }
    const email = form.email.trim().toLowerCase();
    if (!isEmail(email)) {
      toast.error(t("emailInvalid"));
      return;
    }
    if (form.password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }
    setBusy(true);
    try {
      await api.createUser({
        username,
        email,
        password: form.password,
        displayName,
        phone: form.role === "superadmin" ? "" : form.phone.trim(),
        address: form.role === "superadmin" ? "" : form.address.trim(),
        role: form.role,
      });
      setCreated({
        displayName,
        username,
        email,
        password: form.password,
        role: translateRole(t, selected.id),
      });
      toast.success(t("accountCreated", { role: translateRole(t, selected.id) }));
    } catch (error) {
      toast.error(error?.message || t("createFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (!manage) return null;

  if (created) {
    return (
      <ScreenBackdrop>
        <ScrollView contentContainerStyle={[styles.body, { paddingTop: insets.top + 12, paddingBottom: 36 }]}>
          <PageHeader kicker={t("management")} title={t("accountReady")} onBack={() => navigation.goBack()} />
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={26} color="#fff" />
            </View>
            <Text style={styles.successTitle}>{created.displayName}</Text>
            <Text style={styles.successMeta}>
              {created.role} · @{created.username}
            </Text>
            <View style={styles.credBox}>
              <Text style={styles.credLabel}>{t("theyCanSignIn")}</Text>
              <Text style={styles.credValue}>{created.email}</Text>
              <Text style={styles.credMeta}>@{created.username}</Text>
              <Text style={styles.credPass}>{created.password}</Text>
              <Text style={styles.credNote}>{t("shareOnce")}</Text>
            </View>
            <TouchableOpacity
              style={styles.save}
              onPress={() =>
                Share.share({
                  message: t("shareLogin", {
                    email: created.email,
                    username: created.username,
                    password: created.password,
                    role: created.role,
                  }),
                }).catch(() => {})
              }
            >
              <Text style={styles.saveText}>{t("shareCredentials")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => {
                setCreated(null);
                setForm(emptyForm);
                setShowPassword(false);
              }}
            >
              <Text style={styles.secondaryText}>{t("createAnother")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>{t("backToTeam")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.body, { paddingTop: insets.top + 12, paddingBottom: 36 }]}
        >
          <PageHeader kicker={t("management")} title={t("addAccount")} onBack={() => navigation.goBack()} />
          <View style={styles.preview}>
            <View style={styles.previewIcon}>
              <Ionicons name={selected.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewKicker}>{t("newRoleAccount", { role: translateRole(t, selected.id) })}</Text>
              <Text style={styles.previewName} numberOfLines={1}>
                {form.displayName.trim() || t("newAccount")}
              </Text>
            </View>
          </View>

          <Text style={styles.section}>{t("accountType")}</Text>
          <View style={styles.roleRow}>
            {roles.map((item) => {
              const on = form.role === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.roleChip, on && styles.roleChipOn]}
                  onPress={() => setValue("role", item.id)}
                  activeOpacity={0.88}
                >
                  <View style={[styles.roleIcon, on && styles.roleIconOn]}>
                    <Ionicons name={item.icon} size={16} color={on ? "#fff" : colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleLabel, on && styles.roleLabelOn]}>{translateRole(t, item.id)}</Text>
                    {item.hintKey ? <Text style={[styles.roleHint, on && styles.roleHintOn]}>{t(item.hintKey)}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("profile")}</Text>
            <Field icon="person-outline" label={t("fullName")} colors={colors} styles={styles}>
              <TextInput
                style={styles.input}
                value={form.displayName}
                onChangeText={(value) => setValue("displayName", value)}
                placeholder={t("fullName")}
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />
            </Field>
            <Field icon="at-outline" label={t("username")} hint={t("usernameHint")} colors={colors} styles={styles}>
              <TextInput
                style={styles.input}
                value={form.username}
                onChangeText={(value) => setValue("username", sanitizeUsername(value))}
                placeholder={t("username")}
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
              />
            </Field>
            {form.role === "superadmin" ? null : (
              <>
                <Field
                  icon="business-outline"
                  label={t("site")}
                  hint={t("chooseSiteList")}
                  colors={colors}
                  styles={styles}
                >
                  <SiteSelect value={form.address} onChange={(value) => setValue("address", value)} placeholder={t("selectSite")} />
                </Field>
                <Field icon="call-outline" label={t("phone")} hint={t("optional")} colors={colors} styles={styles}>
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(value) => setValue("phone", value)}
                    placeholder={t("phoneNumber")}
                    placeholderTextColor={colors.placeholder}
                    keyboardType="phone-pad"
                  />
                </Field>
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("signInSection")}</Text>
            <Field icon="mail-outline" label={t("email")} hint={t("emailHint")} colors={colors} styles={styles}>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(value) => setValue("email", value.replace(/\s/g, ""))}
                placeholder={t("email")}
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>
            <Field
              icon="lock-closed-outline"
              label={t("tempPassword")}
              hint={t("tempPasswordHint")}
              colors={colors}
              styles={styles}
            >
              <TextInput
                style={styles.input}
                value={form.password}
                onChangeText={(value) => setValue("password", value)}
                placeholder={t("tempPassword")}
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((open) => !open)} hitSlop={10}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </Field>
            <TouchableOpacity
              style={styles.generate}
              onPress={() => {
                setValue("password", makeTempPassword());
                setShowPassword(true);
              }}
            >
              <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
              <Text style={styles.generateText}>{t("generatePassword")}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.save} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t("createRoleAccount", { role: translateRole(t, selected.id) })}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackdrop>
  );
};

export default TeamCreateScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    body: { paddingHorizontal: 20 },
    preview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    previewIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    previewKicker: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
    previewName: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: 2 },
    section: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.textSecondary,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    roleRow: { gap: 10, marginBottom: 16 },
    roleChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    roleChipOn: { borderColor: colors.primary, backgroundColor: colors.muted },
    roleIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    roleIconOn: { backgroundColor: colors.primary },
    roleLabel: { fontWeight: "800", color: colors.text, fontSize: 15 },
    roleLabelOn: { color: colors.primaryDark },
    roleHint: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
    roleHintOn: { color: colors.textSecondary },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    cardTitle: { fontSize: 13, fontWeight: "800", color: colors.textSecondary, marginBottom: 4 },
    field: { marginTop: 12 },
    label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    input: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 16 },
    hint: { color: colors.placeholder, fontSize: 12, marginTop: 6 },
    generate: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
    generateText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
    save: { marginTop: 4, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    secondary: {
      marginTop: 10,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryText: { color: colors.text, fontWeight: "700", fontSize: 15 },
    link: { color: colors.primary, fontWeight: "700", textAlign: "center", marginTop: 16 },
    successCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 22,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    successIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    successTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
    successMeta: { color: colors.textSecondary, marginTop: 4, fontWeight: "600" },
    credBox: {
      width: "100%",
      backgroundColor: colors.muted,
      borderRadius: 14,
      padding: 14,
      marginTop: 16,
      marginBottom: 8,
    },
    credLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
    credValue: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: 6 },
    credMeta: { color: colors.textSecondary, fontSize: 13, fontWeight: "600", marginTop: 4 },
    credPass: { color: colors.primary, fontSize: 16, fontWeight: "800", marginTop: 4 },
    credNote: { color: colors.textSecondary, fontSize: 12, marginTop: 8, lineHeight: 18 },
  });
