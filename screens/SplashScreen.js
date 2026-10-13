import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, Image } from "react-native";
import * as SplashScreenNative from "expo-splash-screen";
import { useT } from "../utils/i18n";

const SplashScreen = () => {
  const t = useT();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreenNative.hideAsync().catch(() => {});
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.center, { opacity }]}>
        <Image source={require("../assets/splash.png")} style={styles.icon} resizeMode="contain" />
        <Text style={styles.brand}>APTNexus</Text>
        <Text style={styles.subtitle}>{t("securityWord")}</Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#071E40", justifyContent: "center", alignItems: "center" },
  center: { alignItems: "center", paddingHorizontal: 24 },
  icon: { width: 96, height: 96, marginBottom: 18 },
  brand: { fontSize: 28, fontWeight: "700", color: "#F5F8FC", letterSpacing: 0.4 },
  subtitle: { marginTop: 8, fontSize: 15, color: "rgba(245, 248, 252, 0.72)" },
});
