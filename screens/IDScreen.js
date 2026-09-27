import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentUser } from "../context/UserContext";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { isAdminRole } from "../utils/roles";
import Avatar from "../components/Avatar";
import { useT } from "../utils/i18n";

const PASS = {
  card: ["#0F2340", "#1B365D", "#2C5282"],
  frame: "rgba(197, 212, 230, 0.78)",
  chipBorder: "rgba(215, 226, 240, 0.6)",
  chipText: "#D7E2F0",
  wellBg: "#FFFFFF",
  qrColor: "#111827",
  identityBg: "rgba(255,255,255,0.08)",
  line: "rgba(197, 208, 220, 0.28)",
};

const Corner = ({ color, position }) => {
  const size = 16;
  const thick = 1.25;
  const common = { position: "absolute", width: size, height: size };
  const edge = { backgroundColor: color };
  const map = {
    tl: { top: 14, left: 14 },
    tr: { top: 14, right: 14 },
    bl: { bottom: 14, left: 14 },
    br: { bottom: 14, right: 14 },
  };
  const h =
    position === "tl" || position === "bl"
      ? { left: 0, width: size, height: thick }
      : { right: 0, width: size, height: thick };
  const v =
    position === "tl" || position === "tr"
      ? { top: 0, width: thick, height: size }
      : { bottom: 0, width: thick, height: size };
  if (position === "tl" || position === "tr") h.top = 0;
  else h.bottom = 0;
  if (position === "tl" || position === "bl") v.left = 0;
  else v.right = 0;
  return (
    <View style={[common, map[position]]} pointerEvents="none">
      <View style={[edge, { position: "absolute", ...h }]} />
      <View style={[edge, { position: "absolute", ...v }]} />
    </View>
  );
};

const IDScreen = () => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user, profile, duty } = useCurrentUser();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const [qrEnlarged, setQrEnlarged] = useState(false);

  const uid = user?.id || user?.uid || "";
  const displayName = profile?.displayName || profile?.username || t("securityWord");
  const unit = profile?.address || "";
  const phone = profile?.phone || "";
  const serial = uid ? String(uid).slice(-6).toUpperCase() : "------";
  const onDuty = Boolean(duty?.clockedIn);
  const admin = isAdminRole(profile);
  const postLine = unit ? t("postLine", { unit }) : admin ? t("management") : t("addPost");
  const qrValue = JSON.stringify({
    type: "aptnexus-id",
    id: uid,
    name: displayName,
    role: admin ? "admin" : "security",
    post: unit,
  });
  const qrSize = Math.min(width * 0.42, 168);
  const tabReserve = 118;
  const cardMaxHeight = height - insets.top - tabReserve - 108;

  return (
    <ScreenBackdrop>
    <View style={[styles.screen, { paddingTop: insets.top + 10, paddingBottom: tabReserve }]}>
      <Text style={styles.pageKicker}>{admin ? t("idKickerAdmin") : t("idKickerOps")}</Text>
      <Text style={styles.pageTitle}>{admin ? t("idTitleAdmin") : t("idTitleOps")}</Text>

      <View style={[styles.frame, { maxHeight: cardMaxHeight, borderColor: PASS.frame, backgroundColor: PASS.card[0] }]}>
        <LinearGradient colors={PASS.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={[styles.hairline, { backgroundColor: PASS.line }]} />
          <Corner color={PASS.frame} position="tl" />
          <Corner color={PASS.frame} position="tr" />
          <Corner color={PASS.frame} position="bl" />
          <Corner color={PASS.frame} position="br" />

          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { borderColor: PASS.frame }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={PASS.chipText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>APTNexus</Text>
              <Text style={[styles.brandSub, { color: PASS.chipText }]}>{admin ? t("commandDesk") : t("lobbyPatrol")}</Text>
            </View>
            <View style={[styles.roleChip, { borderColor: onDuty ? colors.live : PASS.chipBorder }]}>
              <View style={[styles.liveDot, { backgroundColor: onDuty ? colors.live : PASS.chipText }]} />
              <Text style={[styles.roleText, { color: PASS.chipText }]}>{admin ? t("roleAdmin") : onDuty ? t("onDuty") : t("roleSecurity")}</Text>
            </View>
          </View>

          <View style={styles.qrStage}>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => uid && setQrEnlarged(true)}
              style={[
                styles.qrWell,
                {
                  backgroundColor: PASS.wellBg,
                  borderColor: PASS.frame,
                  width: qrSize + 40,
                  height: qrSize + 40,
                },
              ]}
            >
              <QRCode value={qrValue} size={qrSize} backgroundColor={PASS.wellBg} color={PASS.qrColor} />
            </TouchableOpacity>
            <Text style={[styles.enlargeHint, { color: PASS.chipText }]}>{t("tapToEnlarge")}</Text>
          </View>

          <View style={[styles.identity, { backgroundColor: PASS.identityBg, borderColor: PASS.line }]}>
            <Avatar photoURL={profile?.photoURL} style={[styles.avatar, { borderColor: PASS.frame }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={[styles.meta, { color: PASS.chipText }]} numberOfLines={1}>
                {postLine}
              </Text>
              {phone ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={11} color={PASS.chipText} />
                  <Text style={[styles.phone, { color: PASS.chipText }]}>{phone}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: PASS.chipText }]}>
              {admin ? t("authorisedMgmt") : onDuty ? t("authorisedDuty") : t("offDuty")}
            </Text>
            <Text style={[styles.footerText, { color: PASS.chipText }]}>ID {serial}</Text>
          </View>
        </LinearGradient>
      </View>

      <Modal visible={qrEnlarged} transparent animationType="fade" onRequestClose={() => setQrEnlarged(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setQrEnlarged(false)}>
          <View style={[styles.modalCard, { borderColor: PASS.frame }]}>
            <Text style={styles.modalKicker}>{t("securityScan")}</Text>
            <View style={[styles.modalQr, { backgroundColor: PASS.wellBg, borderColor: PASS.frame }]}>
              <QRCode
                value={qrValue}
                size={Math.min(width * 0.58, 260)}
                backgroundColor={PASS.wellBg}
                color={PASS.qrColor}
              />
            </View>
            <Text style={styles.modalName}>{displayName}</Text>
            <Text style={styles.modalMeta}>{postLine}</Text>
            <Text style={styles.tapToClose}>{t("tapAnywhereClose")}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
    </ScreenBackdrop>
  );
};

export default IDScreen;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, paddingHorizontal: 22 },
    pageKicker: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 3,
      textTransform: "uppercase",
      color: colors.textSecondary,
    },
    pageTitle: {
      marginTop: 6,
      marginBottom: 18,
      fontSize: 30,
      fontWeight: "300",
      letterSpacing: 0.6,
      color: colors.text,
    },
    frame: {
      flex: 1,
      borderRadius: 26,
      borderWidth: 1,
      overflow: "hidden",
      shadowColor: "#0F2340",
      shadowOpacity: 0.32,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
    card: {
      flex: 1,
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 16,
    },
    hairline: {
      position: "absolute",
      right: 22,
      top: 78,
      bottom: 72,
      width: 1,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    qrStage: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    brandMark: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.04)",
    },
    brandName: {
      color: "#fff",
      fontWeight: "300",
      fontSize: 18,
      letterSpacing: 3,
      textTransform: "uppercase",
    },
    brandSub: { fontSize: 11, marginTop: 2, letterSpacing: 1.2, textTransform: "uppercase" },
    roleChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 2,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    roleText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
    qrWell: {
      alignSelf: "center",
      borderRadius: 6,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    enlargeHint: {
      textAlign: "center",
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 2,
      textTransform: "uppercase",
      marginTop: 14,
    },
    identity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 4,
      borderWidth: 1,
      padding: 12,
      marginRight: 12,
    },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: 4,
      backgroundColor: "#fff",
      borderWidth: 1,
    },
    name: { color: "#fff", fontSize: 18, fontWeight: "300", letterSpacing: 0.4 },
    meta: { marginTop: 4, fontSize: 12, letterSpacing: 0.6 },
    phoneRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
    phone: { fontSize: 12, letterSpacing: 0.4 },
    footer: {
      marginTop: 12,
      marginRight: 12,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerText: {
      fontSize: 9,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      fontWeight: "600",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      padding: 24,
      alignItems: "center",
    },
    modalKicker: {
      fontWeight: "700",
      letterSpacing: 2.4,
      textTransform: "uppercase",
      fontSize: 11,
      marginBottom: 18,
      color: colors.textSecondary,
    },
    modalQr: { padding: 14, borderRadius: 6, borderWidth: 1 },
    modalName: { marginTop: 18, fontSize: 20, fontWeight: "300", letterSpacing: 0.5, color: colors.text },
    modalMeta: { marginTop: 6, fontSize: 13, letterSpacing: 0.4, color: colors.textSecondary },
    tapToClose: {
      marginTop: 16,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.textSecondary,
    },
  });
