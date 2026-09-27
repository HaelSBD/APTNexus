import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useCurrentUser } from "../context/UserContext";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { prepareJpeg } from "../utils/media";
import { useT } from "../utils/i18n";
import { askPermission, openAppSettings } from "../utils/permissions";
import { isAdminRole, isSuperAdmin } from "../utils/roles";
import Avatar from "../components/Avatar";

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, refresh, duty, signOut } = useCurrentUser();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const admin = isAdminRole(profile);
  const superAdmin = isSuperAdmin(profile);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const fillFromProfile = useCallback(() => {
    setDisplayName(profile?.displayName || "");
    setEmail(profile?.email || "");
    setPhone(profile?.phone || "");
    setAddress(profile?.address || "");
    setPassword("");
  }, [profile?.displayName, profile?.email, profile?.phone, profile?.address]);

  useEffect(() => {
    if (!editing) fillFromProfile();
  }, [editing, fillFromProfile]);

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => {});
    }, [refresh]),
  );

  const startEdit = () => {
    fillFromProfile();
    setEditing(true);
  };

  const cancelEdit = () => {
    fillFromProfile();
    setEditing(false);
  };

  const save = async (photo) => {
    setBusy(true);
    try {
      await api.updateMe(
        {
          displayName,
          ...(superAdmin
            ? { email, ...(password ? { newPassword: password } : {}) }
            : { phone, address }),
          ...(photo?.base64 ? { photoBase64: photo.base64 } : {}),
        },
        photo?.uri ? { field: "photo", uri: photo.uri, name: "avatar.jpg", type: "image/jpeg" } : undefined,
      );
      await refresh();
      toast.success(photo?.uri ? t("photoUpdated") : t("saved"));
      if (!photo?.uri) setEditing(false);
    } catch (error) {
      toast.error(error?.message || t("saved"));
    } finally {
      setBusy(false);
    }
  };

  const capture = async (fromCamera) => {
    try {
      const kind = fromCamera ? "camera" : "photos";
      const permission = await askPermission(kind);
      if (!permission.granted) {
        Alert.alert(t("appSettings"), fromCamera ? t("permissionCamera") : t("permissionPhotos"), [
          { text: t("cancel"), style: "cancel" },
          { text: t("openPhoneSettings"), onPress: openAppSettings },
        ]);
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
      const uri = result.assets?.[0]?.uri;
      if (result.canceled || !uri) return;
      const prepared = await prepareJpeg(uri);
      await save(prepared);
    } catch (error) {
      toast.error(error?.message || t("photoUpdated"));
    }
  };

  const pickPhoto = () => {
    Alert.alert(t("changePhoto"), undefined, [
      { text: t("takePhoto"), onPress: () => capture(true) },
      { text: t("choosePhoto"), onPress: () => capture(false) },
      { text: t("viewPhoto"), onPress: () => setPhotoOpen(true) },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  const logout = () => {
    Alert.alert(t("signOut"), undefined, [
      { text: t("cancel"), style: "cancel" },
      { text: t("signOut"), style: "destructive", onPress: signOut },
    ]);
  };

  const name = profile?.displayName || profile?.username || "Security";
  const username = profile?.username || "";
  const roleLabel = superAdmin ? t("roleSuper") : profile?.role === "admin" ? t("roleAdmin") : t("roleSecurity");
  const onDuty = Boolean(duty?.clockedIn);

  return (
    <ScreenBackdrop>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.body, { paddingTop: insets.top + 12 }]}>
          <PageHeader
            kicker={t("accountKicker")}
            title={t("profile")}
            onBack={() => navigation.goBack()}
            right={
              <TouchableOpacity
                onPress={editing ? cancelEdit : startEdit}
                style={styles.editBtn}
                accessibilityLabel={editing ? t("cancel") : t("editProfile")}
              >
                <Text style={styles.editBtnText}>{editing ? t("cancel") : t("editProfile")}</Text>
              </TouchableOpacity>
            }
          />

          <LinearGradient colors={colors.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <TouchableOpacity onPress={editing ? pickPhoto : () => setPhotoOpen(true)} activeOpacity={0.85}>
              <Avatar photoURL={profile?.photoURL} style={styles.avatar} />
              <View style={styles.camBadge}>
                <Ionicons name={editing ? "camera" : "expand-outline"} size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{editing ? displayName || name : name}</Text>
              {username ? <Text style={styles.heroMeta}>@{username}</Text> : null}
              <View style={styles.chips}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{roleLabel}</Text>
                </View>
                <View style={[styles.chip, onDuty && styles.chipLive]}>
                  <Text style={[styles.chipText, onDuty && styles.chipLiveText]}>{onDuty ? t("trackingOn") : t("trackingOff")}</Text>
                </View>
              </View>
              {editing ? (
                <TouchableOpacity onPress={pickPhoto}>
                  <Text style={styles.change}>{t("changePhoto")}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </LinearGradient>

          <View style={styles.card}>
            {editing ? (
              <>
                <Text style={styles.label}>{t("name")}</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholderTextColor={colors.placeholder}
                />
                {superAdmin ? (
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
                    <Text style={styles.label}>{t("password")}</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      placeholder={t("keepPassword")}
                      placeholderTextColor={colors.placeholder}
                      autoComplete="new-password"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>{t("phone")}</Text>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholderTextColor={colors.placeholder}
                    />
                    <Text style={styles.label}>{t("post")}</Text>
                    <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={setAddress}
                      placeholderTextColor={colors.placeholder}
                    />
                  </>
                )}
                <TouchableOpacity style={styles.save} onPress={() => save()} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t("save")}</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <InfoRow styles={styles} label={t("username")} value={username || t("notSet")} />
                <InfoRow styles={styles} label={t("role")} value={roleLabel} />
                {superAdmin ? (
                  <InfoRow styles={styles} label={t("email")} value={profile?.email || t("notSet")} last />
                ) : (
                  <>
                    <InfoRow styles={styles} label={t("phone")} value={profile?.phone || t("notSet")} />
                    <InfoRow styles={styles} label={t("post")} value={profile?.address || t("notSet")} last />
                  </>
                )}
              </View>
            )}
          </View>

          {!admin ? (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate("Settings")}
              activeOpacity={0.88}
            >
              <Ionicons name="settings-outline" size={18} color={colors.primary} />
              <Text style={styles.settingsText}>{t("settings")}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.logout} onPress={logout} activeOpacity={0.88}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutText}>{t("signOut")}</Text>
          </TouchableOpacity>
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

const InfoRow = ({ styles, label, value, last }) => (
  <View style={[styles.infoRow, last && styles.infoRowLast]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "—"}</Text>
  </View>
);

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    screen: { flex: 1 },
    body: { paddingHorizontal: 20, paddingBottom: 36 },
    editBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    editBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
    },
    avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
    camBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "rgba(15,35,64,0.86)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.4)",
    },
    heroName: { color: "#fff", fontSize: 20, fontWeight: "700" },
    heroMeta: { marginTop: 3, color: "rgba(255,255,255,0.72)", fontSize: 13 },
    chips: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
    chip: {
      backgroundColor: "rgba(255,255,255,0.14)",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    chipLive: { backgroundColor: "rgba(212, 160, 23, 0.28)" },
    chipText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700" },
    chipLiveText: { color: "#F6E7B2" },
    change: { marginTop: 10, color: "#fff", fontWeight: "700", fontSize: 13 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    infoRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    infoLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 },
    infoValue: { fontSize: 16, color: colors.text },
    label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 16 },
    save: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", minHeight: 48 },
    saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    settingsBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    settingsText: { color: colors.primary, fontWeight: "700", fontSize: 16 },
    logout: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    logoutText: { color: colors.danger, fontWeight: "700", fontSize: 16 },
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

export default ProfileScreen;
