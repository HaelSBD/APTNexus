import React, { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ScreenBackdrop from "../components/ScreenBackdrop";
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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <ScreenBackdrop>
      <StatusBar style={dark ? "light" : "dark"} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>APTNexus</Text>
          <Text style={styles.title}>{t("signIn")}</Text>
          <Text style={styles.subtitle}>{t("signInSubtitle")}</Text>

          <Text style={styles.label}>{t("username")}</Text>
          <TextInput
            placeholder={t("username")}
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoComplete="username"
            editable={!loading}
            returnKeyType="next"
          />

          <Text style={styles.label}>{t("password")}</Text>
          <View>
            <TextInput
              placeholder={t("password")}
              placeholderTextColor={colors.placeholder}
              style={[styles.input, { paddingRight: 44 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t("continueBtn")}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackdrop>
  );
};

export default LoginScreen;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center" },
    brand: { fontSize: 13, fontWeight: "700", color: colors.primary, letterSpacing: 1.2, marginBottom: 8 },
    title: { fontSize: 28, fontWeight: "700", color: colors.text },
    subtitle: { marginTop: 6, marginBottom: 28, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
    input: {
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: 14,
      borderColor: colors.border,
      borderWidth: 1,
      fontSize: 16,
      color: colors.text,
    },
    eyeIcon: { position: "absolute", right: 12, top: 14 },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 12,
      marginTop: 8,
      alignItems: "center",
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  });
