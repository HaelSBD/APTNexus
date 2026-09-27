import React, { useCallback, useState } from "react";
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
  Alert,
  Image,
  Linking,
  Share,
  Switch,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { toast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { useCurrentUser } from "../context/UserContext";
import { api } from "../utils/api";
import { resolveMediaUrl } from "../utils/media";
import { initialOf, makeTempPassword, sanitizeUsername } from "../utils/accounts";
import SiteSelect from "../components/SiteSelect";
import { isSuperAdmin } from "../utils/roles";
import { translateRole, useT } from "../utils/i18n";
const ROLES = [
  { id: "security", icon: "shield-outline" },
  { id: "admin", icon: "briefcase-outline" },
];

const TeamMemberScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user: me } = useCurrentUser();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const userId = route.params?.userId || route.params?.user?.id;

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState(route.params?.user || null);
  const [displayName, setDisplayName] = useState(route.params?.user?.displayName || "");
  const [username, setUsername] = useState(route.params?.user?.username || "");
  const [email, setEmail] = useState(route.params?.user?.email || "");
  const [phone, setPhone] = useState(route.params?.user?.phone || "");
  const [address, setAddress] = useState(route.params?.user?.address || "");
  const [role, setRole] = useState(
    route.params?.user?.role === "superadmin" || route.params?.user?.role === "admin"
      ? route.params.user.role
      : "security",
  );
  const [active, setActive] = useState(route.params?.user?.active !== false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const hydrate = (data, fallback) => {
    const user = data?.user || fallback;
    if (!user) return;
    setRecord(user);
    setDisplayName(user.displayName || "");
    setUsername(user.username || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setAddress(user.address || "");
    setRole(user.role === "superadmin" || user.role === "admin" ? user.role : "security");
    setActive(user.active !== false);
  };

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.user(userId);
      hydrate(data);
    } catch {
      hydrate({ user: route.params?.user }, route.params?.user);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const self = String(userId) === String(me?.id);
  const manage = isSuperAdmin(me);

  const save = async (extra = {}) => {
    if (busy || !userId || !manage) return;
    if (!displayName.trim() || sanitizeUsername(username).length < 3) {
      toast.error(t("nameUsernameRequired"));
      return;
    }
    if (extra.password && String(extra.password).length < 6) {
      toast.error(t("passwordNeedShort"));
      return;
    }
    setBusy(true);
    try {
      const data = await api.updateUser(userId, {
        displayName: displayName.trim(),
        username: sanitizeUsername(username),
        role,
        active,
        ...(role === "superadmin"
          ? { email: email.trim(), phone: "", address: "" }
          : { phone: phone.trim(), address: address.trim() }),
        ...extra,
      });
      hydrate(data);
      if (extra.password) {
        setPassword("");
        setShowPassword(false);
        toast.success(t("passwordUpdated"));
      } else {
        toast.success(t("accountUpdated"));
      }
    } catch (error) {
      toast.error(error?.message || t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (next) => {
    if (!manage) return;
    if (self && !next) {
      toast.error(t("cannotDisableOwn"));
      return;
    }
    setActive(next);
    setBusy(true);
    try {
      const data = await api.updateUser(userId, { active: next });
      hydrate(data);
      toast.success(next ? t("accountEnabled") : t("accountDisabled"));
    } catch (error) {
      setActive(!next);
      toast.error(error?.message || t("accessFailed"));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = () => {
    const next = makeTempPassword();
    setPassword(next);
    setShowPassword(true);
    Alert.alert(t("resetPasswordTitle"), t("resetPasswordBody", { username }), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("setPassword"),
        onPress: () => save({ password: next }),
      },
    ]);
  };

  const remove = () => {
    if (!manage) return;
    if (self) {
      toast.error(t("cannotDeleteOwn"));
      return;
    }
    Alert.alert(t("deleteAccountTitle"), t("deleteAccountBody", { name: displayName || username }), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await api.deleteUser(userId);
            toast.success(t("accountDeleted"));
            navigation.goBack();
          } catch (error) {
            toast.error(error?.message || t("deleteFailed"));
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenBackdrop>
        <View style={[styles.center, { paddingTop: insets.top + 12 }]}>
          <PageHeader kicker={t("management")} title={t("accountTitle")} onBack={() => navigation.goBack()} />
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenBackdrop>
    );
  }

  if (!record) {
    return (
      <ScreenBackdrop>
        <View style={[styles.body, { paddingTop: insets.top + 12 }]}>
          <PageHeader kicker={t("management")} title={t("accountTitle")} onBack={() => navigation.goBack()} />
          <Text style={styles.empty}>{t("accountGone")}</Text>
        </View>
      </ScreenBackdrop>
    );
  }

  const photo = record.photoURL ? { uri: resolveMediaUrl(record.photoURL) } : null;

  return (
    <ScreenBackdrop>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.body, { paddingTop: insets.top + 12, paddingBottom: 36 }]}
        >
          <PageHeader kicker={t("management")} title={t("accountTitle")} onBack={() => navigation.goBack()} />

          <LinearGradient colors={colors.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroTop}>
              {photo ? (
                <Image source={photo} style={styles.heroPhoto} />
              ) : (
                <View style={styles.heroAvatar}>
                  <Text style={styles.heroInitial}>{initialOf(displayName || username)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{displayName || username}</Text>
                <Text style={styles.heroMeta}>
                  @{username}
                  {self ? ` · ${t("you")}` : ""}
                </Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  {active ? translateRole(t, role) : t("disabled")}
                </Text>
              </View>
            </View>
            <View style={styles.quick}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => (phone ? Linking.openURL(`tel:${phone}`) : toast.info(t("noPhone")))}
              >
                <Ionicons name="call-outline" size={16} color="#fff" />
                <Text style={styles.quickText}>{t("call")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() =>
                  Share.share({ message: t("shareUsername", { username }) }).catch(() => {})
                }
              >
                <Ionicons name="share-outline" size={16} color="#fff" />
                <Text style={styles.quickText}>{t("share")}</Text>
              </TouchableOpacity>
              {manage ? (
                <TouchableOpacity style={styles.quickBtn} onPress={resetPassword}>
                  <Ionicons name="key-outline" size={16} color="#fff" />
                  <Text style={styles.quickText}>{t("reset")}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </LinearGradient>

          {manage && role !== "superadmin" ? (
            <View style={styles.card}>
              <Text style={styles.section}>{t("role")}</Text>
              <View style={styles.roleRow}>
                {ROLES.map((item) => {
                  const on = role === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.roleChip, on && styles.roleChipOn]}
                      onPress={() => setRole(item.id)}
                      disabled={self && item.id !== "admin"}
                    >
                      <Ionicons name={item.icon} size={16} color={on ? "#fff" : colors.primary} />
                      <Text style={[styles.roleLabel, on && styles.roleLabelOn]}>{translateRole(t, item.id)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.section}>{t("profile")}</Text>
            {manage ? (
              <>
                <Text style={styles.label}>{t("fullName")}</Text>
                <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholderTextColor={colors.placeholder} />
                <Text style={styles.label}>{t("username")}</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(value) => setUsername(sanitizeUsername(value))}
                  autoCapitalize="none"
                  placeholderTextColor={colors.placeholder}
                />
                {role === "superadmin" ? (
                  <>
                    <Text style={styles.label}>{t("email")}</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor={colors.placeholder}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>{t("site")}</Text>
                    <SiteSelect compact value={address} onChange={setAddress} placeholder={t("selectSite")} />
                    <Text style={styles.label}>{t("phone")}</Text>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholderTextColor={colors.placeholder}
                    />
                  </>
                )}
                <TouchableOpacity style={styles.save} onPress={() => save()} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t("saveChanges")}</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t("fullName")}</Text>
                <Text style={styles.input}>{displayName || "—"}</Text>
                <Text style={styles.label}>{t("username")}</Text>
                <Text style={styles.input}>@{username || "—"}</Text>
                <Text style={styles.label}>{t("site")}</Text>
                <Text style={styles.input}>{address || t("unassigned")}</Text>
                <Text style={styles.label}>{t("phone")}</Text>
                <Text style={styles.input}>{phone || "—"}</Text>
              </>
            )}
          </View>

          {manage ? (
            <>
              <View style={styles.card}>
                <Text style={styles.section}>{t("password")}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t("tempPassword")}
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((open) => !open)} hitSlop={8}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordActions}>
                  <TouchableOpacity
                    style={styles.ghost}
                    onPress={() => {
                      setPassword(makeTempPassword());
                      setShowPassword(true);
                    }}
                  >
                    <Text style={styles.ghostText}>{t("generate")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.ghostPrimary} onPress={() => save({ password })} disabled={!password}>
                    <Text style={styles.ghostPrimaryText}>{t("setPassword")}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.section}>{t("signInAccess")}</Text>
                    <Text style={styles.switchHint}>
                      {self ? t("cannotDisableSelf") : active ? t("accountCanSignIn") : t("accountCannotSignIn")}
                    </Text>
                  </View>
                  <Switch
                    value={active}
                    onValueChange={toggleActive}
                    disabled={self || busy}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <TouchableOpacity style={[styles.danger, self && styles.dangerOff]} onPress={remove} disabled={self || busy}>
                <Text style={styles.dangerText}>{self ? t("cannotDeleteSelf") : t("deleteAccount")}</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackdrop>
  );
};

export default TeamMemberScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    body: { paddingHorizontal: 20 },
    center: { paddingHorizontal: 20, flex: 1 },
    empty: { color: colors.textSecondary, marginTop: 12 },
    hero: { borderRadius: 22, padding: 16, marginBottom: 14, overflow: "hidden" },
    heroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    heroPhoto: { width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.12)" },
    heroAvatar: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroInitial: { color: "#fff", fontWeight: "800", fontSize: 20 },
    heroName: { color: "#fff", fontSize: 18, fontWeight: "800" },
    heroMeta: { color: "rgba(255,255,255,0.72)", marginTop: 2, fontSize: 13 },
    pill: {
      backgroundColor: "rgba(255,255,255,0.12)",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    pillText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    quick: { flexDirection: "row", gap: 8, marginTop: 14 },
    quickBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderRadius: 12,
      paddingVertical: 10,
    },
    quickText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    section: { fontSize: 13, fontWeight: "800", color: colors.textSecondary, marginBottom: 8 },
    label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6, marginTop: 10 },
    input: { backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 16, marginBottom: 0 },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    save: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    roleRow: { flexDirection: "row", gap: 8 },
    roleChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: 12,
      paddingVertical: 12,
      backgroundColor: colors.muted,
    },
    roleChipOn: { backgroundColor: colors.primary },
    roleLabel: { fontWeight: "800", color: colors.text },
    roleLabelOn: { color: "#fff" },
    passwordActions: { flexDirection: "row", gap: 8, marginTop: 12 },
    ghost: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghostText: { color: colors.text, fontWeight: "700" },
    ghostPrimary: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.muted,
    },
    ghostPrimaryText: { color: colors.primary, fontWeight: "800" },
    switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    switchHint: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
    danger: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: "rgba(180, 35, 24, 0.1)",
      marginBottom: 8,
    },
    dangerOff: { opacity: 0.55 },
    dangerText: { color: colors.danger, fontWeight: "800" },
  });
