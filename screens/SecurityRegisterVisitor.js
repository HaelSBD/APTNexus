import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "../components/ScreenHeader";
import OcrEngine from "../components/OcrEngine";
import { toast } from "../components/Toast";
import { parseCarPlate, parseIcDocument } from "../utils/documentOcr";
import { patchVisitorDraft, resetVisitorDraft, useVisitorDraft } from "../utils/visitorDraft";
import { api } from "../utils/api";
import { getGps } from "../utils/gps";
import { prepareJpeg } from "../utils/media";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useT } from "../utils/i18n";

const SecurityRegisterVisitor = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const draft = useVisitorDraft();
  const [sending, setSending] = useState(false);
  const [readingIc, setReadingIc] = useState(false);
  const [readingPlate, setReadingPlate] = useState(false);
  const [ocrBase64, setOcrBase64] = useState(null);
  const [ocrMode, setOcrMode] = useState("ic");
  const [ocrJobId, setOcrJobId] = useState("");
  const [preview, setPreview] = useState(null);
  const ocrJobRef = useRef(null);

  const {
    visitorName,
    icNumber,
    plateNumber,
    phone,
    unit,
    icPhotoUri,
    carPhotoUri,
    documentType,
    licenceClass,
    ocrJob,
  } = draft;

  useEffect(() => {
    const job = ocrJob;
    if (!job?.id || !job.uri || job.done) return;
    ocrJobRef.current = { ...job };
    const target = job.mode === "plate" ? "plate" : "ic";
    if (target === "plate") {
      setReadingPlate(true);
      setReadingIc(false);
    } else {
      setReadingIc(true);
      setReadingPlate(false);
    }
    let cancelled = false;
    (async () => {
      try {
        const compact = await prepareJpeg(job.uri, target === "plate" ? 1400 : 1200);
        if (cancelled || ocrJobRef.current?.id !== job.id) return;
        if (!compact?.base64) {
          if (target === "plate") setReadingPlate(false);
          else setReadingIc(false);
          patchVisitorDraft({ ocrJob: { ...job, done: true } });
          toast.info(t("photoSavedEnter"));
          return;
        }
        setOcrMode(target);
        setOcrJobId(String(job.id));
        setOcrBase64(compact.base64);
      } catch {
        if (cancelled) return;
        if (target === "plate") setReadingPlate(false);
        else setReadingIc(false);
        patchVisitorDraft({ ocrJob: { ...job, done: true } });
        toast.info(t("photoSavedEnter"));
      }
    })();
    const slow = setTimeout(() => {
      if (cancelled || ocrJobRef.current?.id !== job.id || ocrJobRef.current?.done) return;
      toast.info(t("stillReading"));
    }, 10000);
    const giveUp = setTimeout(() => {
      if (cancelled || ocrJobRef.current?.id !== job.id || ocrJobRef.current?.done) return;
      if (target === "plate") setReadingPlate(false);
      else setReadingIc(false);
      toast.info(t("couldNotAutoRead"));
    }, 22000);
    return () => {
      cancelled = true;
      clearTimeout(slow);
      clearTimeout(giveUp);
    };
  }, [ocrJob?.id]);

  const send = async () => {
    if (!visitorName.trim() || !icNumber.trim() || !plateNumber.trim() || !phone.trim() || !unit.trim()) {
      toast.error(t("visitorFieldsRequired"));
      return;
    }
    if (!icPhotoUri) {
      toast.error(t("captureIcFirst"));
      return;
    }
    if (!carPhotoUri) {
      toast.error(t("capturePlateFirst"));
      return;
    }
    try {
      setSending(true);
      const gps = await getGps();
      const icPhoto = await prepareJpeg(icPhotoUri, 900);
      const carPhoto = await prepareJpeg(carPhotoUri, 900);
      await api.registerVisitor(
        {
          visitorName: visitorName.trim(),
          icNumber: icNumber.trim(),
          plateNumber: plateNumber.trim(),
          phone: phone.trim(),
          unit: unit.trim(),
          documentType,
          licenceClass,
          ...gps,
        },
        [
          { field: "icPhoto", uri: icPhoto.uri, name: "ic.jpg", type: "image/jpeg" },
          { field: "carPhoto", uri: carPhoto.uri, name: "car.jpg", type: "image/jpeg" },
        ],
      );
      toast.success(t("visitorSaved"));
      resetVisitorDraft();
    } catch (error) {
      toast.error(error?.message || t("visitorSaveFailed"));
    } finally {
      setSending(false);
    }
  };

  const onOcrResult = (payload) => {
    const job = ocrJobRef.current;
    if (!job?.id || job.done) return;
    if (payload?.jobId && String(payload.jobId) !== String(job.id)) return;
    const text = payload?.ok ? payload.text || "" : "";
    const mode = job.mode || payload?.mode || ocrMode;
    job.done = true;
    if (mode === "plate") {
      const parsed = parseCarPlate(text);
      const updates = { ocrJob: { ...job, done: true } };
      if (parsed.plateNumber) updates.plateNumber = parsed.plateNumber;
      patchVisitorDraft(updates);
      if (parsed.plateNumber) toast.success(t("plateFilled", { plate: parsed.plateNumber }));
      else toast.info(t("platePhotoSaved"));
      setReadingPlate(false);
    } else {
      const parsed = parseIcDocument(text);
      const doc = parsed.documentType === "licence" ? t("drivingLicence") : "MyKad";
      const updates = { ocrJob: { ...job, done: true } };
      if (parsed.visitorName) updates.visitorName = parsed.visitorName;
      if (parsed.icNumber) updates.icNumber = parsed.icNumber;
      if (parsed.documentType) updates.documentType = parsed.documentType;
      if (parsed.licenceClass != null) updates.licenceClass = parsed.licenceClass;
      patchVisitorDraft(updates);
      if (parsed.icNumber && parsed.visitorName) {
        toast.success(t("docNameIcFilled", { doc }));
      } else if (parsed.icNumber) {
        toast.success(t("docIcFilled", { doc }));
      } else if (parsed.visitorName) {
        toast.success(t("docNameFilled", { doc }));
      } else {
        toast.info(t("photoSavedNameIc"));
      }
      setReadingIc(false);
    }
    setOcrBase64(null);
  };

  const openIc = () => {
    if (icPhotoUri) {
      setPreview("ic");
      return;
    }
    navigation.navigate("SecurityCameraScan", { mode: "ic" });
  };

  const openPlate = () => {
    if (!icPhotoUri) {
      toast.info(t("completeStep1"));
      return;
    }
    if (carPhotoUri) {
      setPreview("plate");
      return;
    }
    navigation.navigate("SecurityCameraScan", { mode: "plate" });
  };

  const retakePreview = () => {
    const mode = preview === "plate" ? "plate" : "ic";
    setPreview(null);
    navigation.navigate("SecurityCameraScan", { mode });
  };

  const previewUri = preview === "plate" ? carPhotoUri : preview === "ic" ? icPhotoUri : "";
  const previewTitle = preview === "plate" ? t("carPlate") : t("icLicence");
  const icHint = readingIc ? t("readingId") : icPhotoUri ? t("tapViewRetake") : t("step1Capture");
  const plateHint = readingPlate ? t("readingPlate") : carPhotoUri ? t("tapViewRetake") : t("step2Capture");

  return (
    <ScreenBackdrop>
    <View style={styles.screen}>
      <OcrEngine imageBase64={ocrBase64} mode={ocrMode} jobId={ocrJobId} onResult={onOcrResult} />
      <ScreenHeader title={t("registerVisitor")} compact />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>{t("gateDesk")}</Text>
          <Text style={styles.lead}>{t("gateLead")}</Text>

          <View style={styles.scanRow}>
            <TouchableOpacity style={styles.scanCard} onPress={openIc} activeOpacity={0.88}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
              {icPhotoUri ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: icPhotoUri }} style={styles.preview} />
                  {readingIc ? (
                    <View style={styles.readingOverlay}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  ) : (
                    <View style={styles.previewBadge}>
                      <Ionicons name="expand-outline" size={12} color="#fff" />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.scanIcon}>
                  {readingIc ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="id-card-outline" size={22} color={colors.primary} />}
                </View>
              )}
              <Text style={styles.scanTitle}>{t("icLicence")}</Text>
              <Text style={styles.scanHint}>{icHint}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.scanCard, !icPhotoUri && styles.scanCardWait]} onPress={openPlate} activeOpacity={0.88}>
              <View style={[styles.stepBadge, !icPhotoUri && styles.stepBadgeWait]}><Text style={styles.stepBadgeText}>2</Text></View>
              {carPhotoUri ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: carPhotoUri }} style={styles.preview} />
                  {readingPlate ? (
                    <View style={styles.readingOverlay}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  ) : (
                    <View style={styles.previewBadge}>
                      <Ionicons name="expand-outline" size={12} color="#fff" />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.scanIcon}>
                  {readingPlate ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="car-outline" size={22} color={icPhotoUri ? colors.primary : colors.placeholder} />}
                </View>
              )}
              <Text style={[styles.scanTitle, !icPhotoUri && styles.scanTitleWait]}>{t("carPlate")}</Text>
              <Text style={styles.scanHint}>{plateHint}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Field styles={styles} colors={colors} label={t("visitorName")} placeholder={t("fullName")} value={visitorName} onChangeText={(value) => patchVisitorDraft({ visitorName: value })} />
            <Field
              styles={styles}
              colors={colors}
              label={t("icNumber")}
              placeholder="YYMMDD-PB-####"
              value={icNumber}
              onChangeText={(value) => {
                const digits = String(value || "").replace(/\D/g, "").slice(0, 12);
                if (digits.length === 12) {
                  patchVisitorDraft({ icNumber: `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}` });
                  return;
                }
                patchVisitorDraft({ icNumber: value.toUpperCase() });
              }}
              autoCapitalize="characters"
              keyboardType="number-pad"
            />
            <Field styles={styles} colors={colors} label={t("numberPlate")} placeholder="ABC 1234" value={plateNumber} onChangeText={(value) => patchVisitorDraft({ plateNumber: value.toUpperCase() })} autoCapitalize="characters" />
            <Field styles={styles} colors={colors} label={t("phoneNumber")} placeholder={t("visitorContact")} value={phone} onChangeText={(value) => patchVisitorDraft({ phone: value })} keyboardType="phone-pad" />
            <Field styles={styles} colors={colors} label={t("unitVisiting")} placeholder="e.g. A-12-3" value={unit} onChangeText={(value) => patchVisitorDraft({ unit: value })} autoCapitalize="characters" />
          </View>

          <TouchableOpacity style={styles.send} onPress={send} disabled={sending} activeOpacity={0.9}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>{t("sendToManagement")}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={Boolean(preview && previewUri)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreview(null)}>
          <Pressable style={[styles.previewSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
            <View style={styles.previewHead}>
              <Text style={styles.previewKicker}>{t("capturedPhoto")}</Text>
              <Text style={styles.previewTitle}>{previewTitle}</Text>
            </View>
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.keepBtn} onPress={() => setPreview(null)} activeOpacity={0.88}>
                <Text style={styles.keepText}>{t("keep")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retakeBtn} onPress={retakePreview} activeOpacity={0.88}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.retakeText}>{t("retake")}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
    </ScreenBackdrop>
  );
};

export default SecurityRegisterVisitor;

const Field = ({ label, styles, colors, ...props }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor={colors.placeholder} style={styles.input} {...props} />
  </View>
);

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    screen: { flex: 1 },
    body: { padding: 16, paddingBottom: 118 },
    kicker: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 4 },
    lead: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 16 },
    scanRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    scanCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 12, ...shadows.card },
    scanCardWait: { opacity: 0.72 },
    stepBadge: { position: "absolute", top: 8, right: 8, zIndex: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    stepBadgeWait: { backgroundColor: colors.placeholder },
    stepBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
    scanIcon: { height: 76, borderRadius: 14, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    previewWrap: { marginBottom: 10 },
    preview: { width: "100%", height: 76, borderRadius: 14, backgroundColor: colors.muted },
    readingOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 14,
      backgroundColor: "rgba(15, 35, 64, 0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    previewBadge: {
      position: "absolute",
      right: 8,
      bottom: 8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(15,35,64,0.72)",
      alignItems: "center",
      justifyContent: "center",
    },
    previewOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: 16,
    },
    previewSheet: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 16,
    },
    previewHead: { marginBottom: 12 },
    previewKicker: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: 1.1,
      textTransform: "uppercase",
    },
    previewTitle: { marginTop: 4, fontSize: 20, fontWeight: "800", color: colors.text },
    previewImage: {
      width: "100%",
      height: 280,
      borderRadius: 16,
      backgroundColor: colors.muted,
    },
    previewActions: { flexDirection: "row", gap: 10, marginTop: 16 },
    keepBtn: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    keepText: { color: colors.text, fontWeight: "800", fontSize: 15 },
    retakeBtn: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
      backgroundColor: colors.primary,
    },
    retakeText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    scanTitle: { fontWeight: "700", color: colors.text, fontSize: 14 },
    scanTitleWait: { color: colors.textSecondary },
    scanHint: { color: colors.text, fontSize: 12, marginTop: 2, fontWeight: "600" },
    card: { backgroundColor: colors.surface, borderRadius: 20, padding: 14, ...shadows.card },
    field: { marginBottom: 12 },
    label: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
    input: { backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
    send: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 16 },
    sendText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  });
