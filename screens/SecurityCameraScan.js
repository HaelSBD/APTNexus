import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "../components/Toast";
import MyKadFrame, { myKadFrameSize } from "../components/MyKadFrame";
import ScanGuide, { scanGuideSize } from "../components/ScanGuide";
import { patchVisitorDraft } from "../utils/visitorDraft";
import { useCurrentUser } from "../context/UserContext";
import { useSettings } from "../context/SettingsContext";
import { api } from "../utils/api";
import { getGps } from "../utils/gps";
import ScreenBackdrop from "../components/ScreenBackdrop";
import { useT } from "../utils/i18n";

const barcodeData = (event) =>
  String(event?.data || event?.raw || event?.nativeEvent?.data || event?.nativeEvent?.raw || "").trim();

const SecurityCameraScan = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { width, height } = useWindowDimensions();
  const { profile } = useCurrentUser();
  const { colors } = useSettings();
  const t = useT();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [torch, setTorch] = useState(false);
  const scannedRef = useRef(false);
  const mode = route.params?.mode || "ic";
  const qrMode = mode === "qr";
  const copy = {
    ic: { title: t("scanMyKad"), hint: t("scanMyKadHint") },
    plate: { title: t("scanPlate"), hint: t("scanPlateHint") },
    qr: { title: t("scanQr"), hint: t("scanQrHint") },
  }[mode] || { title: t("scanMyKad"), hint: t("scanMyKadHint") };
  const landscape = width > height;
  const card = myKadFrameSize(width, height);
  const guide = scanGuideSize(mode, width, height);

  useFocusEffect(
    useCallback(() => {
      scannedRef.current = false;
      setBusy(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL_BUT_UPSIDE_DOWN).catch(() => {
        ScreenOrientation.unlockAsync().catch(() => {});
      });
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      };
    }, []),
  );

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission, requestPermission]);

  const capture = async () => {
    if (busy || qrMode) return;
    try {
      setBusy(true);
      const plate = mode === "plate";
      const photo = await cameraRef.current?.takePictureAsync({
        quality: plate ? 0.55 : 0.5,
        skipProcessing: false,
        shutterSound: false,
      });
      if (!photo?.uri) throw new Error(t("captureFailed"));
      const captureId = Date.now();
      if (plate) {
        patchVisitorDraft({
          carPhotoUri: photo.uri,
          ocrJob: { id: captureId, mode: "plate", uri: photo.uri },
        });
      } else {
        patchVisitorDraft({
          icPhotoUri: photo.uri,
          ocrJob: { id: captureId, mode: "ic", uri: photo.uri },
        });
      }
      navigation.goBack();
    } catch (error) {
      toast.error(error?.message || t("captureFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onQr = useCallback(
    async (event) => {
      if (scannedRef.current || !qrMode) return;
      const data = barcodeData(event);
      if (!data) return;
      scannedRef.current = true;
      setBusy(true);
      try {
        const gps = await getGps();
        const logged = await api.scanPatrol({
          raw: data,
          ...gps,
          guardName: profile?.displayName || profile?.username || t("securityWord"),
        });
        toast.success(t("checkpointScanned", { name: logged.row?.checkpointName || t("checkpointWord") }));
        navigation.goBack();
      } catch (error) {
        scannedRef.current = false;
        setBusy(false);
        toast.error(error?.message || t("checkpointSaveFailed"));
      }
    },
    [navigation, profile, qrMode],
  );

  if (!permission) {
    return <ScreenBackdrop />;
  }
  if (!permission.granted) {
    return (
      <ScreenBackdrop>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <Text style={[styles.permTitle, { color: colors.text }]}>{t("cameraAccessNeeded")}</Text>
          <Text style={[styles.permBody, { color: colors.textSecondary }]}>{t("cameraAccessHint")}</Text>
          <TouchableOpacity style={styles.shutter} onPress={requestPermission}>
            <Text style={styles.shutterText}>{t("askPermission")}</Text>
          </TouchableOpacity>
        </View>
      </ScreenBackdrop>
    );
  }

  const frame = mode === "ic" ? card : guide;

  return (
    <View style={styles.screen}>
      {focused ? (
        <CameraView
          key={mode}
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          responsiveOrientationWhenOrientationLocked={!qrMode}
          barcodeScannerSettings={qrMode ? { barcodeTypes: ["qr"] } : undefined}
          onBarcodeScanned={qrMode && !busy ? onQr : undefined}
          onMountError={() => toast.error(t("cameraStartFailed"))}
        />
      ) : null}
      <View style={styles.maskLayer} pointerEvents="none">
        <View style={[styles.mask, { height: frame.top }]} />
        <View style={[styles.maskRow, { height: frame.height }]}>
          <View style={[styles.mask, { width: frame.left }]} />
          {mode === "ic" ? <MyKadFrame width={card.width} height={card.height} /> : <ScanGuide mode={mode} width={guide.width} height={guide.height} />}
          <View style={[styles.mask, { flex: 1 }]} />
        </View>
        <View style={[styles.mask, { flex: 1 }]} />
      </View>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, paddingLeft: 12 + insets.left, paddingRight: 12 + insets.right }]} pointerEvents="box-none">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.title, landscape && styles.titleLandscape]}>{copy.title}</Text>
        <TouchableOpacity onPress={() => setTorch((on) => !on)} style={styles.back}>
          <Ionicons name={torch ? "flash" : "flash-outline"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.hint, { bottom: insets.bottom + (qrMode ? 28 : landscape ? 88 : 108), paddingHorizontal: 24 + Math.max(insets.left, insets.right) }]}>
        {busy && qrMode ? t("qrSaving") : copy.hint}
      </Text>
      {busy && qrMode ? (
        <View style={styles.saving} pointerEvents="none">
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
      {!qrMode ? (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + (landscape ? 12 : 24) }]}>
          <TouchableOpacity style={mode === "ic" ? styles.roundShutter : styles.shutter} onPress={capture} disabled={busy} activeOpacity={0.9}>
            {busy ? <ActivityIndicator color="#1b2430" /> : mode === "ic" ? <View style={styles.roundInner} /> : <Text style={styles.shutterText}>{t("capture")}</Text>}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export default SecurityCameraScan;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  permTitle: { fontSize: 20, fontWeight: "800", color: "#1b2430", marginBottom: 8 },
  permBody: { textAlign: "center", color: "#5f6b73", marginBottom: 18, lineHeight: 20 },
  mask: { backgroundColor: "rgba(0,0,0,0.58)" },
  maskLayer: { ...StyleSheet.absoluteFillObject },
  maskRow: { flexDirection: "row" },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 4,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontWeight: "800", fontSize: 18 },
  titleLandscape: { fontSize: 16 },
  hint: { position: "absolute", left: 24, right: 24, color: "#fff", textAlign: "center", fontWeight: "600", zIndex: 3 },
  saving: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    zIndex: 5,
  },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", zIndex: 4 },
  shutter: {
    backgroundColor: "#f5b400",
    minWidth: 160,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  shutterText: { color: "#1b2430", fontWeight: "800", fontSize: 16 },
  roundShutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  roundInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
});
