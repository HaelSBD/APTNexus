import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageHeader from "../components/PageHeader";
import { api } from "../utils/api";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { toast } from "../components/Toast";
import { useT } from "../utils/i18n";
import { isAdminRole, isSuperAdmin } from "../utils/roles";
import { useCurrentUser } from "../context/UserContext";
import { buildReportHtml, createAndSharePdf } from "../utils/printPdf";
import {
  DEFAULT_AREA_KEYS,
  checkpointArea,
  areaLabel,
  DEFAULT_AREA_LABELS,
} from "../utils/patrolArea";

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfMonth(date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfMonth(date) {
  const next = startOfMonth(date);
  next.setMonth(next.getMonth() + 1);
  next.setMilliseconds(-1);
  return next;
}

function monthKey(date) {
  const d = startOfMonth(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function buildMonthOptions(rows = [], count = 12) {
  const now = startOfMonth(new Date());
  const seen = new Set();
  const options = [];
  const push = (date) => {
    const key = monthKey(date);
    if (seen.has(key)) return;
    seen.add(key);
    options.push(startOfMonth(date));
  };
  push(now);
  (rows || []).forEach((row) => {
    const stamp = scanTime(row);
    if (stamp) push(stamp);
  });
  for (let i = 1; options.length < count; i += 1) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    push(d);
  }
  return options
    .sort((a, b) => b.getTime() - a.getTime())
    .slice(0, count);
}

function scanTime(row) {
  const value = row?.createdAt || row?.at;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPickerDate(date) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatStamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const SecurityPatrolScreen = () => {
  const insets = useSafeAreaInsets();
  const { profile } = useCurrentUser();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const admin = isAdminRole(profile);
  const superAdmin = isSuperAdmin(profile);
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState(() => startOfDay(new Date()));
  const [toDate, setToDate] = useState(() => startOfDay(new Date()));
  const [appliedFrom, setAppliedFrom] = useState(null);
  const [appliedTo, setAppliedTo] = useState(null);
  const [period, setPeriod] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const [pickerField, setPickerField] = useState(null);
  const [area, setArea] = useState("All");
  const [areaKeys, setAreaKeys] = useState(DEFAULT_AREA_KEYS);
  const [labels, setLabels] = useState(DEFAULT_AREA_LABELS);
  const [editKey, setEditKey] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingLabel, setSavingLabel] = useState(false);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(() => {
    const tasks = [api.patrols()];
    if (admin) {
      tasks.push(
        api.patrolAreas().catch(() => ({ labels: DEFAULT_AREA_LABELS, keys: DEFAULT_AREA_KEYS })),
      );
    }
    Promise.all(tasks)
      .then(([patrols, areas]) => {
        setRows(patrols.rows || []);
        if (areas?.labels) setLabels({ ...DEFAULT_AREA_LABELS, ...areas.labels });
        if (Array.isArray(areas?.keys) && areas.keys.length) {
          setAreaKeys(areas.keys);
          setArea((current) => (current === "All" || areas.keys.includes(current) ? current : "All"));
        } else if (areas?.labels) {
          const keys = Object.keys(areas.labels);
          if (keys.length) setAreaKeys(keys);
        }
      })
      .catch(() => {});
  }, [admin]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const monthOptions = useMemo(() => buildMonthOptions(rows, 12), [rows]);

  const periodRows = useMemo(() => {
    if (!appliedFrom || !appliedTo) return rows;
    return rows.filter((row) => {
      const stamp = scanTime(row);
      return stamp && stamp >= appliedFrom && stamp <= appliedTo;
    });
  }, [rows, appliedFrom, appliedTo]);

  const filteredRows = useMemo(() => {
    if (area === "All") return periodRows;
    return periodRows.filter((row) => checkpointArea(row) === area);
  }, [periodRows, area]);

  const areaCounts = useMemo(() => {
    const counts = { All: periodRows.length };
    areaKeys.forEach((key) => {
      counts[key] = 0;
    });
    periodRows.forEach((row) => {
      const key = checkpointArea(row);
      if (counts[key] != null) counts[key] += 1;
    });
    return counts;
  }, [periodRows, areaKeys]);

  const openPicker = (field) => setPickerField(field);
  const closePicker = () => setPickerField(null);

  const onPickerChange = (event, date) => {
    if (Platform.OS === "android") {
      closePicker();
      if (event?.type === "dismissed") return;
    }
    if (!date) return;
    const day = startOfDay(date);
    setPeriod(null);
    setSelectedMonth(null);
    if (pickerField === "from") {
      setFromDate(day);
      if (day.getTime() > startOfDay(toDate).getTime()) setToDate(day);
    } else if (pickerField === "to") {
      setToDate(day);
      if (day.getTime() < startOfDay(fromDate).getTime()) setFromDate(day);
    }
  };

  const applyDateSearch = () => {
    const from = startOfDay(fromDate);
    if (from.getTime() > startOfDay(toDate).getTime()) {
      toast.error(t("dateRangeInvalid"));
      return;
    }
    setPeriod(null);
    setSelectedMonth(null);
    setAppliedFrom(from);
    setAppliedTo(endOfDay(toDate));
  };

  const applyPeriod = (next) => {
    setPeriod((current) => {
      if (current === next) {
        setAppliedFrom(null);
        setAppliedTo(null);
        setSelectedMonth(null);
        return null;
      }
      const stamp = new Date();
      if (next === "today") {
        setSelectedMonth(null);
        setFromDate(startOfDay(stamp));
        setToDate(startOfDay(stamp));
        setAppliedFrom(startOfDay(stamp));
        setAppliedTo(endOfDay(stamp));
      } else if (next === "month") {
        setSelectedMonth(null);
        setFromDate(startOfMonth(stamp));
        setToDate(startOfDay(stamp));
        setAppliedFrom(startOfMonth(stamp));
        setAppliedTo(endOfDay(stamp));
      }
      return next;
    });
  };

  const pickMonth = (date) => {
    const month = startOfMonth(date);
    setSelectedMonth(month);
    setPeriod("pick");
    setFromDate(month);
    setToDate(startOfDay(endOfMonth(month)));
    setAppliedFrom(month);
    setAppliedTo(endOfMonth(month));
    setMonthOpen(false);
  };

  const clearDateFilter = () => {
    setAppliedFrom(null);
    setAppliedTo(null);
    setPeriod(null);
    setSelectedMonth(null);
    const stamp = new Date();
    setFromDate(startOfDay(stamp));
    setToDate(startOfDay(stamp));
  };

  const pickerValue =
    pickerField === "from" ? fromDate || toDate || new Date() : toDate || fromDate || new Date();

  const openRename = (key) => {
    setEditKey(key);
    setEditValue(areaLabel(key, labels));
  };

  const saveRename = async () => {
    if (!editKey) return;
    const nextLabel = String(editValue || "").trim().slice(0, 40);
    if (!nextLabel) {
      toast.error(t("areaNameRequired"));
      return;
    }
    setSavingLabel(true);
    try {
      const data = await api.updatePatrolAreas({ [editKey]: nextLabel });
      setLabels({ ...DEFAULT_AREA_LABELS, ...(data.labels || {}), [editKey]: nextLabel });
      if (Array.isArray(data?.keys) && data.keys.length) setAreaKeys(data.keys);
      setEditKey(null);
      toast.success(t("areaRenamed"));
    } catch (error) {
      toast.error(error?.message || t("areaRenameFailed"));
    } finally {
      setSavingLabel(false);
    }
  };

  const downloadPdf = async () => {
    if (!filteredRows.length) {
      toast.info(t("noPatrolScans"));
      return;
    }
    setPrinting(true);
    try {
      const areaName = area === "All" ? t("allAreas") : areaLabel(area, labels);
      const periodName =
        period === "today"
          ? t("todayTab")
          : period === "month"
            ? t("thisMonthTab")
            : period === "pick" && selectedMonth
              ? formatMonthLabel(selectedMonth)
              : appliedFrom && appliedTo
                ? startOfDay(appliedFrom).getTime() === startOfDay(appliedTo).getTime()
                  ? formatPickerDate(appliedFrom)
                  : `${formatPickerDate(appliedFrom)} – ${formatPickerDate(appliedTo)}`
                : t("allDates");
      const html = buildReportHtml({
        title: admin ? t("patrolReportTitle") : t("myPatrolHistory"),
        meta: `${periodName} · ${areaName} · ${filteredRows.length} ${t("recordsWord")} · ${formatStamp(new Date())}`,
        headers: ["#", t("checkpointWord"), t("areaWord"), t("scannedOn")],
        rows: filteredRows.map((row, index) => {
          const stamp = formatStamp(row.createdAt || row.at);
          const areaKey = checkpointArea(row);
          const zone = areaKey ? areaLabel(areaKey, labels) : "—";
          return [index + 1, row.checkpointName || row.label || "", zone, stamp];
        }),
      });
      const result = await createAndSharePdf({
        html,
        dialogTitle: admin ? t("patrolReportTitle") : t("myPatrolHistory"),
        landscape: true,
      });
      if (!result.cancelled) toast.success(t("pdfReady"));
    } catch (error) {
      toast.error(error?.message || t("pdfFailed"));
    } finally {
      setPrinting(false);
    }
  };

  const renderScan = ({ item, index }) => {
    const stamp = item.createdAt || item.at;
    return (
      <View style={[styles.scanRow, index === filteredRows.length - 1 && styles.scanRowLast]}>
        <View style={styles.scanIcon}>
          <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
        </View>
        <View style={styles.scanBody}>
          <Text style={styles.scanTitle} numberOfLines={2}>
            {item.checkpointName || item.label || t("checkpointWord")}
          </Text>
        </View>
        <View style={styles.scanTime}>
          <Text style={styles.scanDay}>{formatDay(stamp)}</Text>
          <Text style={styles.scanClock}>{formatTime(stamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenBackdrop>
      <FlatList
        data={filteredRows}
        keyExtractor={(item, index) => item.id || `${item.checkpointName}-${item.createdAt}-${index}`}
        renderItem={renderScan}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 10, paddingBottom: 118 },
          !filteredRows.length && styles.listGrow,
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <PageHeader
              kicker={t("patrolKicker")}
              title={admin ? t("patrolLogTitle") : t("myPatrolHistory")}
            />

            <View style={styles.filterCard}>
              <Text style={styles.filterLabel}>{t("filterByDate")}</Text>
              <View style={styles.chips}>
                <TouchableOpacity
                  style={[styles.chip, period === "today" && styles.chipOn]}
                  onPress={() => applyPeriod("today")}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.chipText, period === "today" && styles.chipTextOn]}>{t("todayTab")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, period === "month" && styles.chipOn]}
                  onPress={() => applyPeriod("month")}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.chipText, period === "month" && styles.chipTextOn]}>{t("thisMonthTab")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, styles.monthChip, period === "pick" && styles.chipOn]}
                  onPress={() => setMonthOpen(true)}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.chipText, period === "pick" && styles.chipTextOn]} numberOfLines={1}>
                    {period === "pick" && selectedMonth ? formatMonthLabel(selectedMonth) : t("selectMonth")}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={period === "pick" ? "#fff" : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {admin ? (
                <>
                  <View style={styles.dateDivider} />
                  <View style={styles.dateRow}>
                    <TouchableOpacity style={styles.dateInput} onPress={() => openPicker("from")} activeOpacity={0.88}>
                      <Text style={styles.dateLabel}>{t("fromDate")}</Text>
                      <View style={styles.dateValueRow}>
                        <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                        <Text style={styles.dateInputText} numberOfLines={1}>
                          {formatPickerDate(fromDate)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dateInput} onPress={() => openPicker("to")} activeOpacity={0.88}>
                      <Text style={styles.dateLabel}>{t("toDate")}</Text>
                      <View style={styles.dateValueRow}>
                        <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                        <Text style={styles.dateInputText} numberOfLines={1}>
                          {formatPickerDate(toDate)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateActions}>
                    <TouchableOpacity style={styles.searchBtn} onPress={applyDateSearch} activeOpacity={0.88}>
                      <Ionicons name="search-outline" size={17} color="#fff" />
                      <Text style={styles.searchBtnText}>{t("search")}</Text>
                    </TouchableOpacity>
                    {appliedFrom ? (
                      <TouchableOpacity style={styles.clearBtn} onPress={clearDateFilter} activeOpacity={0.88}>
                        <Text style={styles.clearBtnText}>{t("clearDate")}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>

            {admin ? (
              <View style={styles.filterCard}>
                <Text style={styles.filterLabel}>{t("filterByArea")}</Text>
                <View style={styles.chips}>
                  <TouchableOpacity
                    style={[styles.chip, area === "All" && styles.chipOn]}
                    onPress={() => setArea("All")}
                    activeOpacity={0.88}
                  >
                    <Text style={[styles.chipText, area === "All" && styles.chipTextOn]}>
                      {t("allAreas")} · {areaCounts.All}
                    </Text>
                  </TouchableOpacity>
                  {areaKeys.map((id) => {
                    const on = area === id;
                    return (
                      <View key={id} style={[styles.chipWrap, on && styles.chipWrapOn]}>
                        <TouchableOpacity style={styles.chipMain} onPress={() => setArea(id)} activeOpacity={0.88}>
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>
                            {areaLabel(id, labels)} · {areaCounts[id] || 0}
                          </Text>
                        </TouchableOpacity>
                        {superAdmin ? (
                          <TouchableOpacity
                            style={styles.chipEdit}
                            onPress={() => openRename(id)}
                            hitSlop={8}
                            accessibilityLabel={t("renameArea")}
                          >
                            <Ionicons name="pencil" size={13} color={on ? "#fff" : colors.primary} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {admin ? (
              <TouchableOpacity
                style={[styles.downloadBtn, printing && styles.downloadBtnDisabled]}
                onPress={downloadPdf}
                disabled={printing}
                activeOpacity={0.88}
              >
                {printing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color="#fff" />
                    <Text style={styles.downloadBtnText}>{t("downloadPdf")}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            <View style={styles.listHead}>
              <Text style={styles.listHeadTitle}>{t("checkpointScans")}</Text>
              <Text style={styles.listHeadCount}>{t("scanCount", { n: filteredRows.length })}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t("noPatrolScans")}</Text>
          </View>
        }
      />

      <Modal visible={Boolean(editKey)} transparent animationType="fade" onRequestClose={() => setEditKey(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditKey(null)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
            <Text style={styles.modalKicker}>{t("renameArea")}</Text>
            <Text style={styles.modalTitle}>{editKey ? `Area ${editKey}` : ""}</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={t("areaNamePlaceholder")}
              placeholderTextColor={colors.placeholder}
              autoFocus
              maxLength={40}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditKey(null)} activeOpacity={0.88}>
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveRename} disabled={savingLabel} activeOpacity={0.88}>
                {savingLabel ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveText}>{t("save")}</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {Platform.OS === "android" && pickerField ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="calendar"
          onChange={onPickerChange}
          maximumDate={new Date()}
        />
      ) : null}

      <Modal
        visible={Platform.OS === "ios" && Boolean(pickerField)}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable style={[styles.calendarSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
            <View style={styles.calendarHead}>
              <Text style={styles.modalTitle}>{pickerField === "to" ? t("toDate") : t("fromDate")}</Text>
              <TouchableOpacity onPress={closePicker} hitSlop={10} style={styles.calendarDone}>
                <Ionicons name="checkmark" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="inline"
              onChange={onPickerChange}
              maximumDate={new Date()}
              style={styles.iosCalendar}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={monthOpen} transparent animationType="fade" onRequestClose={() => setMonthOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMonthOpen(false)}>
          <Pressable style={[styles.monthSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
            <Text style={styles.modalKicker}>{t("filterByDate")}</Text>
            <Text style={styles.modalTitle}>{t("selectMonth")}</Text>
            <FlatList
              data={monthOptions}
              keyExtractor={(item) => monthKey(item)}
              style={styles.monthList}
              renderItem={({ item }) => {
                const on = period === "pick" && selectedMonth && monthKey(selectedMonth) === monthKey(item);
                return (
                  <TouchableOpacity
                    style={[styles.monthOption, on && styles.monthOptionOn]}
                    onPress={() => pickMonth(item)}
                    activeOpacity={0.88}
                  >
                    <Text style={[styles.monthOptionText, on && styles.monthOptionTextOn]}>
                      {formatMonthLabel(item)}
                    </Text>
                    {on ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              }}
            />
            {period === "pick" ? (
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  clearDateFilter();
                  setMonthOpen(false);
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.modalCancelText}>{t("clearDate")}</Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenBackdrop>
  );
};

export default SecurityPatrolScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    list: { paddingHorizontal: 16 },
    listGrow: { flexGrow: 1 },
    headerBlock: { marginBottom: 6 },
    filterCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 12,
      overflow: "hidden",
      ...shadows.card,
    },
    filterLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 0.4,
      marginBottom: 10,
      textTransform: "uppercase",
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    dateDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    dateRow: { flexDirection: "row", gap: 8 },
    dateLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.2 },
    dateInput: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.muted,
      overflow: "hidden",
    },
    dateValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    dateInputText: { flex: 1, minWidth: 0, color: colors.text, fontSize: 13, fontWeight: "600" },
    dateActions: { flexDirection: "row", gap: 8, marginTop: 10 },
    searchBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 11,
      overflow: "hidden",
    },
    searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    clearBtn: {
      paddingHorizontal: 14,
      borderRadius: 12,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    clearBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
      overflow: "hidden",
    },
    chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
      overflow: "hidden",
    },
    chipWrapOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipMain: { paddingLeft: 12, paddingVertical: 8, paddingRight: 6 },
    chipEdit: { paddingHorizontal: 10, paddingVertical: 8 },
    chipText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
    chipTextOn: { color: "#fff" },
    monthChip: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 140 },
    monthSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 18,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: "70%",
      overflow: "hidden",
    },
    monthList: { maxHeight: 360 },
    monthOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    monthOptionOn: {},
    monthOptionText: { fontSize: 15, fontWeight: "700", color: colors.text },
    monthOptionTextOn: { color: colors.primary },
    calendarSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    calendarHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    calendarDone: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    iosCalendar: { alignSelf: "center" },
    downloadBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 14,
      paddingVertical: 13,
      marginBottom: 16,
      backgroundColor: colors.primary,
      overflow: "hidden",
      ...shadows.card,
    },
    downloadBtnDisabled: { opacity: 0.65 },
    downloadBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    listHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    listHeadTitle: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
    listHeadCount: { fontSize: 12, fontWeight: "700", color: colors.primary },
    scanRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 8,
      overflow: "hidden",
      ...shadows.card,
    },
    scanRowLast: { marginBottom: 4 },
    scanIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
      overflow: "hidden",
    },
    scanBody: { flex: 1, minWidth: 0, paddingRight: 8 },
    scanTitle: { fontSize: 15, fontWeight: "700", color: colors.text, lineHeight: 20 },
    scanTime: { alignItems: "flex-end", flexShrink: 0 },
    scanDay: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },
    scanClock: { marginTop: 2, fontSize: 13, fontWeight: "800", color: colors.text },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 24 },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    emptyTitle: { color: colors.textSecondary, textAlign: "center", fontSize: 14, lineHeight: 20, fontWeight: "600" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(8, 18, 32, 0.48)", justifyContent: "flex-end" },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 18,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    modalKicker: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.1,
      textTransform: "uppercase",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 12 },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: colors.text,
      backgroundColor: colors.muted,
      fontSize: 15,
    },
    modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
    modalCancel: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 12,
    },
    modalCancelText: { fontWeight: "700", color: colors.textSecondary },
    modalSave: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      alignItems: "center",
    },
    modalSaveText: { fontWeight: "700", color: "#fff" },
  });
