import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { toast } from "../components/Toast";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { formatRelativeTime } from "../utils/format";
import { resolveMediaUrl } from "../utils/media";
import { useT } from "../utils/i18n";
import { isAdminRole } from "../utils/roles";
import { useCurrentUser } from "../context/UserContext";
import { buildReportHtml, createAndSharePdf } from "../utils/printPdf";

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
    if (!row?.createdAt) return;
    const stamp = new Date(row.createdAt);
    if (!Number.isNaN(stamp.getTime())) push(stamp);
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

function formatStamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatPickerDate(date) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function rangeLabelForPdf({ period, selectedMonth, appliedFrom, appliedTo, t }) {
  if (period === "today") return t("todayTab");
  if (period === "month") return t("thisMonthTab");
  if (period === "pick" && selectedMonth) return formatMonthLabel(selectedMonth);
  if (appliedFrom && appliedTo) {
    const from = startOfDay(appliedFrom);
    const to = startOfDay(appliedTo);
    if (from.getTime() === to.getTime()) return formatPickerDate(from);
    return `${formatPickerDate(from)} – ${formatPickerDate(to)}`;
  }
  return t("allDates");
}

const VisitorsLogScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile } = useCurrentUser();
  const { colors, dark } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const admin = isAdminRole(profile);
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState(() => startOfDay(new Date()));
  const [toDate, setToDate] = useState(() => startOfDay(new Date()));
  const [appliedFrom, setAppliedFrom] = useState(null);
  const [appliedTo, setAppliedTo] = useState(null);
  const [period, setPeriod] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const [pickerField, setPickerField] = useState(null);
  const [textQuery, setTextQuery] = useState("");
  const [printing, setPrinting] = useState(false);
  const [selected, setSelected] = useState(null);

  const monthOptions = useMemo(() => buildMonthOptions(rows, 12), [rows]);

  const isTab = Boolean(navigation.getState()?.routeNames?.includes("Home"));

  const load = useCallback(async () => {
    try {
      const data = await api.visitors();
      setRows(data.rows || []);
    } catch {
      setRows([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openPicker = (field) => {
    setPickerField(field);
  };

  const closePicker = () => {
    setPickerField(null);
  };

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

  const filtered = useMemo(() => {
    let list = rows;
    if (appliedFrom && appliedTo) {
      list = list.filter((row) => {
        const created = row.createdAt ? new Date(row.createdAt) : null;
        return (
          created &&
          !Number.isNaN(created.getTime()) &&
          created.getTime() >= appliedFrom.getTime() &&
          created.getTime() <= appliedTo.getTime()
        );
      });
    }
    const q = textQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) =>
      [row.visitorName, row.icNumber, row.plateNumber, row.unit, row.phone, row.guardName, row.documentLabel]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, appliedFrom, appliedTo, textQuery]);

  const printPdf = async () => {
    if (!filtered.length) {
      toast.info(t("noVisitors"));
      return;
    }
    setPrinting(true);
    try {
      const rangeLabel = rangeLabelForPdf({ period, selectedMonth, appliedFrom, appliedTo, t });
      const html = buildReportHtml({
        title: t("visitorReportTitle"),
        meta: `${rangeLabel} · ${filtered.length} ${t("recordsWord")} · ${formatStamp(new Date())}`,
        headers: [
          "#",
          t("visitorName"),
          t("icNumber"),
          t("numberPlate"),
          t("phone"),
          t("unit"),
          t("documentWord"),
          t("registeredBy"),
          t("registeredAt"),
        ],
        rows: filtered.map((row, index) => [
          index + 1,
          row.visitorName,
          row.icNumber,
          row.plateNumber,
          row.phone,
          row.unit,
          row.documentLabel || row.documentType || "",
          row.guardName || "",
          formatStamp(row.createdAt),
        ]),
      });
      const result = await createAndSharePdf({
        html,
        dialogTitle: t("visitorReportTitle"),
        landscape: true,
      });
      if (!result.cancelled) toast.success(t("pdfReady"));
    } catch (error) {
      toast.error(error?.message || t("pdfFailed"));
    } finally {
      setPrinting(false);
    }
  };

  const Detail = ({ label, value, last }) => (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "—"}</Text>
    </View>
  );

  const selectedIc = selected?.icPhotoUrl ? { uri: resolveMediaUrl(selected.icPhotoUrl) } : null;
  const selectedCar = selected?.carPhotoUrl ? { uri: resolveMediaUrl(selected.carPhotoUrl) } : null;
  const pickerValue = pickerField === "to" ? toDate : fromDate;

  return (
    <ScreenBackdrop>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 10, paddingBottom: isTab ? 118 : insets.bottom + 28 },
          !filtered.length && styles.listEmpty,
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <PageHeader
              kicker={t("gateLog")}
              title={t("tabVisitors")}
              onBack={isTab ? undefined : () => navigation.goBack()}
              right={
                <TouchableOpacity
                  style={[styles.printBtn, printing && styles.printBtnDisabled]}
                  onPress={printPdf}
                  disabled={printing}
                  activeOpacity={0.88}
                  accessibilityLabel={t("printPdf")}
                >
                  {printing ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Ionicons name="print-outline" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              }
            />

            <View style={styles.filterCard}>
              <Text style={styles.filterLabel}>{t("filters")}</Text>
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

              <View style={styles.dateDivider} />
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.dateField} onPress={() => openPicker("from")} activeOpacity={0.88}>
                  <Text style={styles.dateFieldLabel}>{t("fromDate")}</Text>
                  <View style={styles.dateFieldValueRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={styles.dateFieldValue}>{formatPickerDate(fromDate) || t("pickDate")}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateField} onPress={() => openPicker("to")} activeOpacity={0.88}>
                  <Text style={styles.dateFieldLabel}>{t("toDate")}</Text>
                  <View style={styles.dateFieldValueRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={styles.dateFieldValue}>{formatPickerDate(toDate) || t("pickDate")}</Text>
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

              <View style={styles.dateDivider} />
              <View style={styles.search}>
                <Ionicons name="search-outline" size={16} color={colors.placeholder} />
                <TextInput
                  style={styles.searchInput}
                  value={textQuery}
                  onChangeText={setTextQuery}
                  placeholder={t("searchVisitors")}
                  placeholderTextColor={colors.placeholder}
                  returnKeyType="search"
                />
                {textQuery ? (
                  <TouchableOpacity onPress={() => setTextQuery("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={colors.placeholder} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.resultBar}>
              <Text style={styles.count}>
                {t("visitorRecordsCount", { shown: filtered.length, total: rows.length })}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="clipboard-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t("noVisitors")}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = [item.unit ? `${t("unit")} ${item.unit}` : "", item.plateNumber].filter(Boolean).join(" · ");
          const when = item.createdAt ? formatRelativeTime(item.createdAt) : "";
          return (
            <TouchableOpacity style={styles.nameCard} onPress={() => setSelected(item)} activeOpacity={0.88}>
              <View style={styles.nameBody}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.visitorName}
                </Text>
                {meta ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {meta}
                  </Text>
                ) : null}
              </View>
              <View style={styles.cardRight}>
                {when ? <Text style={styles.when}>{when}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {pickerField && Platform.OS === "android" ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          onChange={onPickerChange}
          maximumDate={new Date()}
        />
      ) : null}

      <Modal visible={Boolean(pickerField) && Platform.OS === "ios"} transparent animationType="fade" onRequestClose={closePicker}>
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable style={[styles.calendarSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
            <View style={styles.iosPickerHead}>
              <Text style={styles.modalKicker}>{pickerField === "to" ? t("toDate") : t("fromDate")}</Text>
              <TouchableOpacity onPress={closePicker} hitSlop={10}>
                <Text style={styles.iosPickerDone}>{t("close")}</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="inline"
              onChange={onPickerChange}
              maximumDate={new Date()}
              style={styles.iosCalendar}
              themeVariant={dark ? "dark" : "light"}
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
                style={styles.monthClear}
                onPress={() => {
                  clearDateFilter();
                  setMonthOpen(false);
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.monthClearText}>{t("clearDate")}</Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={Boolean(selected)} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable
            style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={() => {}}
          >
            <View style={styles.modalHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalKicker}>{t("visitorDetails")}</Text>
                <Text style={styles.modalTitle}>{selected?.visitorName || "—"}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)} hitSlop={10} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <View style={styles.detailCard}>
                <Detail label={t("icNumber")} value={selected?.icNumber} />
                <Detail label={t("numberPlate")} value={selected?.plateNumber} />
                <Detail label={t("phone")} value={selected?.phone} />
                <Detail label={t("unit")} value={selected?.unit} />
                <Detail label={t("documentWord")} value={selected?.documentLabel || selected?.documentType} />
                {selected?.licenceClass ? <Detail label={t("licenceClass")} value={selected.licenceClass} /> : null}
                {admin ? <Detail label={t("registeredBy")} value={selected?.guardName} /> : null}
                <Detail label={t("registeredAt")} value={formatStamp(selected?.createdAt)} last />
              </View>
              <Text style={styles.photosHeading}>{t("photos")}</Text>
              <View style={styles.photos}>
                <View style={styles.photoCol}>
                  {selectedIc ? <Image source={selectedIc} style={styles.photo} /> : <View style={styles.photoFallback} />}
                  <Text style={styles.photoLabel}>{t("icLicence")}</Text>
                </View>
                <View style={styles.photoCol}>
                  {selectedCar ? <Image source={selectedCar} style={styles.photo} /> : <View style={styles.photoFallback} />}
                  <Text style={styles.photoLabel}>{t("carPlate")}</Text>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenBackdrop>
  );
};

export default VisitorsLogScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    list: { paddingHorizontal: 16, flexGrow: 1 },
    listEmpty: { flexGrow: 1 },
    headerBlock: { marginBottom: 4 },
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
    chipText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
    chipTextOn: { color: "#fff" },
    monthChip: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 140 },
    dateDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    dateRow: { flexDirection: "row", gap: 8 },
    dateField: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.muted,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
      overflow: "hidden",
    },
    dateFieldLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 0.2,
      marginBottom: 6,
    },
    dateFieldValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    dateFieldValue: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: "600", color: colors.text },
    dateActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
    },
    searchBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: 12,
      paddingVertical: 11,
      backgroundColor: colors.primary,
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
    monthClear: {
      marginTop: 8,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
    },
    monthClearText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
    printBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    printBtnDisabled: { opacity: 0.6 },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.muted,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      minHeight: 44,
      overflow: "hidden",
    },
    searchInput: { flex: 1, paddingVertical: 10, color: colors.text, fontSize: 14 },
    resultBar: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    count: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24 },
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
    nameCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...shadows.card,
    },
    nameBody: { flex: 1, minWidth: 0 },
    title: { fontWeight: "700", color: colors.text, fontSize: 15 },
    subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 16 },
    cardRight: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
    when: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
    calendarSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 12,
      paddingTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    iosPickerHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 6,
      marginBottom: 4,
    },
    iosPickerDone: { color: colors.primary, fontWeight: "800", fontSize: 15 },
    iosCalendar: { alignSelf: "center" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(8, 18, 32, 0.48)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      maxHeight: "88%",
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    modalHead: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 4 },
    modalKicker: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    modalTitle: { fontSize: 20, fontWeight: "800", color: colors.text, paddingRight: 4 },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
      overflow: "hidden",
    },
    modalBody: { paddingBottom: 8, paddingTop: 8 },
    detailCard: {
      backgroundColor: colors.muted,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 4,
      overflow: "hidden",
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    detailRowLast: { borderBottomWidth: 0 },
    detailLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "600", width: 104 },
    detailValue: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "600", textAlign: "right", lineHeight: 18 },
    photosHeading: {
      marginTop: 16,
      marginBottom: 10,
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    photos: { flexDirection: "row", gap: 10, marginBottom: 8 },
    photoCol: { flex: 1, minWidth: 0 },
    photo: { width: "100%", height: 132, borderRadius: 14, backgroundColor: colors.muted },
    photoFallback: { width: "100%", height: 132, borderRadius: 14, backgroundColor: colors.muted },
    photoLabel: { marginTop: 6, textAlign: "center", fontSize: 11, fontWeight: "600", color: colors.textSecondary },
  });
