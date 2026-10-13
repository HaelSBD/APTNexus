import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "../components/Toast";
import { formatAuthError } from "../utils/format";
import { useCurrentUser } from "../context/UserContext";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { useT } from "../utils/i18n";

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { signIn } = useCurrentUser();
  const { colors, dark } = useSettings();
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const passwordRef = useRef(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      toast.error(t("credentialsRequired"));
      return;
    }
    try {
      setLoading(true);
      await signIn(identifier, password);
    } catch (error) {
      if (error?.code === "SESSION_ACTIVE") {
        Alert.alert(t("sessionElsewhereTitle"), t("sessionElsewhereBody"), [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("sessionElsewhereContinue"),
            onPress: async () => {
              try {
                setLoading(true);
                await signIn(identifier, password, { replaceSession: true });
              } catch (err) {
                toast.error(formatAuthError(err));
              } finally {
                setLoading(false);
              }
            },
          },
        ]);
        return;
      }
      toast.error(formatAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const sky = Array.isArray(colors.page) && colors.page.length >= 2 ? colors.page : [colors.background, colors.background];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={dark ? "light" : "dark"} />

      <LinearGradient colors={sky} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <LinearGradient
        colors={
          dark
            ? ["rgba(11, 18, 32, 0.72)", "transparent", "rgba(10, 18, 28, 0.5)"]
            : ["rgba(15, 35, 64, 0.16)", "transparent", "rgba(230, 238, 246, 0.85)"]
        }
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image source={require("../assets/icon.png")} style={styles.markImage} resizeMode="cover" />
            <Text style={styles.brand}>APTNEXUS</Text>
            <View style={styles.brandRule} />
            <Text style={styles.title}>{t("signIn")}</Text>
            <Text style={styles.subtitle}>{t("signInSubtitle")}</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.label}>{t("username")}</Text>
            <View style={[styles.field, focused === "user" && styles.fieldOn]}>
              <Ionicons name="person-outline" size={18} color={focused === "user" ? colors.primary : colors.placeholder} />
              <TextInput
                placeholder={t("username")}
                placeholderTextColor={colors.placeholder}
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                editable={!loading}
                returnKeyType="next"
                onFocus={() => setFocused("user")}
                onBlur={() => setFocused(null)}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <Text style={styles.label}>{t("password")}</Text>
            <View style={[styles.field, focused === "pass" && styles.fieldOn]}>
              <Ionicons name="lock-closed-outline" size={18} color={focused === "pass" ? colors.primary : colors.placeholder} />
              <TextInput
                ref={passwordRef}
                placeholder={t("password")}
                placeholderTextColor={colors.placeholder}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                returnKeyType="done"
                autoComplete="password"
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused(null)}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10} accessibilityLabel={t("password")}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>{t("continueBtn")}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>{t("signInFooter")}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    root: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center" },
    hero: { marginBottom: 28, alignItems: "center" },
    markImage: {
      width: 76,
      height: 76,
      borderRadius: 20,
      marginBottom: 18,
      overflow: "hidden",
    },
    brand: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 4,
      textAlign: "center",
    },
    brandRule: {
      width: 36,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.primary,
      marginTop: 14,
      marginBottom: 14,
      opacity: 0.9,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.primary,
      textAlign: "center",
      letterSpacing: 0.2,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 21,
      textAlign: "center",
      paddingHorizontal: 16,
      maxWidth: 320,
    },
    panel: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 20,
      overflow: "hidden",
      ...shadows.card,
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      marginBottom: 8,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.muted,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      minHeight: 52,
      marginBottom: 16,
      overflow: "hidden",
    },
    fieldOn: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      paddingVertical: Platform.OS === "ios" ? 14 : 10,
      fontSize: 16,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      minHeight: 52,
      borderRadius: 14,
      marginTop: 4,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      overflow: "hidden",
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
    footer: {
      marginTop: 22,
      textAlign: "center",
      fontSize: 12,
      color: colors.textSecondary,
      letterSpacing: 0.2,
    },
  });
