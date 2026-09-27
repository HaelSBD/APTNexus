import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getSettingsSnapshot, useSettings } from "../context/SettingsContext";
import { playAlertFeedback } from "../utils/alertFeedback";

let activeToastRef = null;

const ToastInner = forwardRef((_props, ref) => {
  const { colors } = useSettings();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const translateY = useRef(new Animated.Value(-120)).current;
  const hideTimer = useRef(null);

  const hide = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  useImperativeHandle(ref, () => ({
    show: (msg, msgType = "info", duration = 2800) => {
      if ((msgType === "success" || msgType === "info") && getSettingsSnapshot().notifications === false) return;
      playAlertFeedback();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMessage(msg);
      setType(msgType);
      setVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 60,
      }).start();
      hideTimer.current = setTimeout(hide, duration);
    },
  }));

  if (!visible) return null;
  const icon = {
    success: { name: "checkmark-circle", color: colors.primary },
    error: { name: "close-circle", color: colors.danger },
    info: { name: "information-circle", color: colors.primaryLight },
  }[type] || { name: "information-circle", color: colors.primaryLight };

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={[styles.toast, { backgroundColor: colors.surface, shadowColor: colors.primaryDark }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} style={styles.icon} />
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
});

export const ToastHost = () => {
  const ref = useRef(null);
  React.useEffect(() => {
    activeToastRef = ref.current;
    return () => {
      activeToastRef = null;
    };
  }, []);
  return <ToastInner ref={ref} />;
};

export const toast = {
  show: (message, type, duration) => activeToastRef?.show(message, type, duration),
  success: (message, duration) => activeToastRef?.show(message, "success", duration),
  error: (message, duration) => activeToastRef?.show(message, "error", duration),
  info: (message, duration) => activeToastRef?.show(message, "info", duration),
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    maxWidth: "100%",
  },
  icon: { marginRight: 8 },
  text: { fontSize: 14, flexShrink: 1 },
});
