import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useThemedStyles } from "../context/SettingsContext";
import ScreenBackdrop from "./ScreenBackdrop";
import { useT } from "../utils/i18n";

class ErrorBoundary extends React.Component {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch(error) {
    console.warn("APTNexus screen error:", error?.message || error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorFallback onRetry={() => this.setState({ error: false })} />;
  }
}

function ErrorFallback({ onRetry }) {
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  return (
    <ScreenBackdrop>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t("somethingWrong")}</Text>
        <Text style={styles.body}>{t("screenError")}</Text>
        <TouchableOpacity style={styles.btn} onPress={onRetry}>
          <Text style={styles.btnText}>{t("tryAgain")}</Text>
        </TouchableOpacity>
      </View>
    </ScreenBackdrop>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    title: { fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center" },
    body: { marginTop: 8, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
    btn: {
      marginTop: 18,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    btnText: { color: "#fff", fontWeight: "800" },
  });

export default ErrorBoundary;
