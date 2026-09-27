import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { useT } from "../utils/i18n";

const ChatActionsSheet = ({
  visible,
  preview,
  onClose,
  onEdit,
  onDelete,
  kicker,
  editHint,
  deleteTitle,
  deleteHint,
}) => {
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const sheetKicker = kicker || t("yourMessage");
  const sheetEditHint = editHint || t("changeMessageEveryone");
  const sheetDeleteTitle = deleteTitle || t("delete");
  const sheetDeleteHint = deleteHint || t("removeFromHistory");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.kicker}>{sheetKicker}</Text>
          <Text style={styles.preview} numberOfLines={3}>
            {preview}
          </Text>
          {onEdit ? (
            <TouchableOpacity style={styles.row} onPress={onEdit} activeOpacity={0.8}>
              <View style={styles.iconWrap}>
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{t("edit")}</Text>
                <Text style={styles.rowHint}>{sheetEditHint}</Text>
              </View>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.row} onPress={onDelete} activeOpacity={0.8}>
            <View style={[styles.iconWrap, styles.iconDanger]}>
              <Ionicons name="trash" size={18} color={colors.danger} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, styles.danger]}>{sheetDeleteTitle}</Text>
              <Text style={styles.rowHint}>{sheetDeleteHint}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>{t("cancel")}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ChatActionsSheet;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 28,
      ...shadows.card,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 14,
    },
    kicker: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    preview: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 16,
      backgroundColor: colors.muted,
      borderRadius: 14,
      padding: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    iconDanger: {
      backgroundColor: "rgba(180, 35, 24, 0.1)",
    },
    rowCopy: { flex: 1 },
    rowTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    rowHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    danger: { color: colors.danger },
    cancel: {
      marginTop: 8,
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    cancelText: { fontWeight: "700", color: colors.textSecondary },
  });
