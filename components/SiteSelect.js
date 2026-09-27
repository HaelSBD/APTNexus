import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../utils/api";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import SiteMark from "./SiteMark";
import { useT } from "../utils/i18n";

const SiteSelect = ({ value = "", onChange, placeholder, compact = false }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const sitePlaceholder = placeholder || t("selectSite");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    api
      .sites()
      .then((data) => {
        setRows(data.rows || []);
        setError("");
      })
      .catch((err) => {
        setRows([]);
        setError(err?.message || t("loadSitesShort"));
      });
  };

  useEffect(() => {
    load();
  }, []);

  const options = useMemo(() => {
    const active = (rows || [])
      .filter((row) => row.active !== false)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }));
    if (value && !active.some((row) => row.name === value)) {
      return [{ id: "current", name: value, address: t("savedOnAccount") }, ...active];
    }
    return active;
  }, [rows, value]);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, compact && styles.triggerCompact]}
        onPress={() => {
          load();
          setOpen(true);
        }}
        activeOpacity={0.88}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {value || sitePlaceholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.placeholder} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
            <Text style={styles.kicker}>{t("deskSites")}</Text>
            <Text style={styles.title}>{t("chooseSite")}</Text>
            <Text style={styles.hint}>{t("siteSelectHint")}</Text>
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {value ? (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange?.("");
                    setOpen(false);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.optionName}>{t("noSite")}</Text>
                  <Text style={styles.optionMeta}>{t("leaveUnassigned")}</Text>
                </TouchableOpacity>
              ) : null}
              {options.map((row) => {
                const on = row.name === value;
                return (
                  <TouchableOpacity
                    key={row.id || row.name}
                    style={[styles.option, on && styles.optionOn]}
                    onPress={() => {
                      onChange?.(row.name);
                      setOpen(false);
                    }}
                    activeOpacity={0.88}
                  >
                    <SiteMark
                      name={row.name}
                      photoURL={row.photoURL}
                      size={40}
                      colors={on ? { ...colors, muted: "rgba(255,255,255,0.18)", border: "transparent", primary: "#fff" } : colors}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionName, on && styles.optionNameOn]}>{row.name}</Text>
                      <Text style={[styles.optionMeta, on && styles.optionMetaOn]}>
                        {row.address || (row.isDefault ? t("defaultSiteBadge") : t("site"))}
                      </Text>
                    </View>
                    {on ? <Ionicons name="checkmark-circle" size={20} color="#fff" /> : null}
                  </TouchableOpacity>
                );
              })}
              {!options.length ? (
                <Text style={styles.empty}>
                  {error || t("noSitesAssign")}
                </Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default SiteSelect;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    trigger: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingVertical: 12,
    },
    triggerCompact: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    triggerText: { flex: 1, color: colors.text, fontSize: 16, fontWeight: "600" },
    triggerPlaceholder: { color: colors.placeholder, fontWeight: "500" },
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end", padding: 16 },
    sheet: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, maxHeight: "78%", ...shadows.card },
    kicker: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 1.1, textTransform: "uppercase" },
    title: { marginTop: 4, fontSize: 20, fontWeight: "800", color: colors.text },
    hint: { color: colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 12 },
    list: { maxHeight: 360 },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.muted,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
    },
    optionOn: { backgroundColor: colors.primary },
    optionName: { fontSize: 15, fontWeight: "700", color: colors.text },
    optionNameOn: { color: "#fff" },
    optionMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    optionMetaOn: { color: "rgba(255,255,255,0.78)" },
    empty: { color: colors.textSecondary, lineHeight: 20, paddingVertical: 8 },
  });
