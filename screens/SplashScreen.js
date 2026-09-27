import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import * as SplashScreenNative from "expo-splash-screen";
import { useThemedStyles } from "../context/SettingsContext";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useT } from "../utils/i18n";

const SplashScreen = () => {
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreenNative.hideAsync().catch(() => {});
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <ScreenBackdrop>
      <View style={styles.container}>
        <Animated.View style={{ opacity, alignItems: "center" }}>
          <Text style={styles.brand}>APTNexus</Text>
          <Text style={styles.subtitle}>{t("securityWord")}</Text>
        </Animated.View>
      </View>
    </ScreenBackdrop>
  );
};

export default SplashScreen;

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    brand: { fontSize: 28, fontWeight: "700", color: colors.text, letterSpacing: 0.4 },
    subtitle: { marginTop: 8, fontSize: 15, color: colors.textSecondary },
  });
