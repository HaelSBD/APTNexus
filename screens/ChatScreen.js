import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Vibration,
  Image,
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageHeader from "../components/PageHeader";
import ScreenBackdrop from "../components/ScreenBackdrop";
import ChatActionsSheet from "../components/ChatActionsSheet";
import { toast } from "../components/Toast";
import { useCurrentUser } from "../context/UserContext";
import { useChat } from "../context/ChatContext";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api } from "../utils/api";
import { formatRelativeTime } from "../utils/format";
import { isAdminRole } from "../utils/roles";
import { useE2e } from "../context/E2eContext";
import { prepareJpeg, resolveMediaUrl, withMediaUrls } from "../utils/media";
import { askPermission, openAppSettings } from "../utils/permissions";
import { useT } from "../utils/i18n";

const TABS = [
  { key: "Chat", icon: "chatbubbles-outline", labelKey: "tabChatChannel" },
  { key: "Groups", icon: "people-outline", labelKey: "tabGroups" },
  { key: "Updates", icon: "megaphone-outline", labelKey: "tabUpdates" },
];
const LIST_PERF = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 8,
  windowSize: 6,
  removeClippedSubviews: true,
};

const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { user, profile } = useCurrentUser();
  const { markSeen } = useChat();
  const { ready: e2eReady, safetyCode, seal, openRow } = useE2e();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const admin = isAdminRole(profile || user);
  const uid = user?.id || profile?.id;

  const [activeTab, setActiveTab] = useState("Chat");
  const [chatTarget, setChatTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [sending, setSending] = useState(false);
  const [menuItem, setMenuItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticePhoto, setNoticePhoto] = useState(null);
  const [noticeBusy, setNoticeBusy] = useState(false);

  const channel = activeTab === "Chat" ? chatTarget : "group";

  const reveal = useCallback(
    (row) => {
      const opened = openRow(row);
      return {
        ...row,
        message: opened.failed ? "" : opened.text,
        encrypted: Boolean(opened.encrypted || row.encrypted),
        decryptFailed: Boolean(opened.failed),
      };
    },
    [openRow],
  );

  const load = useCallback(async () => {
    try {
      if (activeTab === "Chat" && chatTarget) {
        const data = await api.chat(chatTarget);
        setMessages((data.rows || []).map((row) => reveal(row)));
      }
      if (activeTab === "Groups") {
        const data = await api.chat("group");
        setMessages((data.rows || []).map((row) => reveal(row)));
      }
      if (activeTab === "Updates") {
        const data = await api.announcements();
        setAnnouncements((data.rows || []).map(withMediaUrls));
      }
      markSeen();
    } catch {
      // keep last snapshot
    }
  }, [activeTab, chatTarget, markSeen, reveal, e2eReady]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.tab === "Updates") {
        setActiveTab("Updates");
        setChatTarget(null);
      }
      load();
      const tick = setInterval(load, 20000);
      return () => clearInterval(tick);
    }, [load, route.params?.tab]),
  );

  const canManage = (item) => Boolean(uid && String(item?.userId || item?.actorId) === String(uid));
  const canRemove = (item) => canManage(item) || admin;

  const showSafety = () => {
    Alert.alert(
      t("e2eTitle"),
      e2eReady ? t("e2eBody", { code: safetyCode || t("generating") }) : t("e2ePreparing"),
    );
  };

  const handleSend = async () => {
    if (sending) return;
    if (activeTab === "Chat" && !chatTarget) {
      toast.info(t("chooseDeskFirst"));
      return;
    }
    if (!message.trim()) {
      toast.info(t("typeMessageFirst"));
      return;
    }
    try {
      setSending(true);
      const sealed = await seal(message.trim());
      if (editingItem) {
        await api.editChat(editingItem.id, sealed);
        setEditingItem(null);
      } else {
        await api.sendChat(channel, sealed);
      }
      setMessage("");
      await load();
      markSeen();
    } catch (error) {
      toast.error(error?.message || (editingItem ? t("editFailed") : t("sendFailed")));
    } finally {
      setSending(false);
    }
  };

  const openMessageActions = (item) => {
    if (!canRemove(item)) return;
    Vibration.vibrate(20);
    setMenuItem(item);
  };

  const startEdit = () => {
    if (!menuItem || !canManage(menuItem)) return;
    setEditingItem(menuItem);
    setMessage(menuItem.message || "");
    setMenuItem(null);
  };

  const confirmDelete = () => {
    const item = menuItem;
    setMenuItem(null);
    if (!item) return;
    Alert.alert(t("deleteMessage"), t("deleteMessageBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteChat(item.id);
            if (editingItem?.id === item.id) {
              setEditingItem(null);
              setMessage("");
            }
            toast.success(t("messageDeleted"));
            load();
          } catch {
            toast.error(t("deleteMessageFailed"));
          }
        },
      },
    ]);
  };

  const pickNoticePhoto = async (fromCamera) => {
    const permission = await askPermission(fromCamera ? "camera" : "photos");
    if (!permission.granted) {
      Alert.alert(t("appSettings"), fromCamera ? t("allowBriefingCamera") : t("allowBriefingPhotos"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("openPhoneSettings"), onPress: openAppSettings },
      ]);
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true });
    const uri = result.assets?.[0]?.uri;
    if (result.canceled || !uri) return;
    try {
      const prepared = await prepareJpeg(uri, 1400);
      setNoticePhoto({ uri: prepared.uri, name: "briefing.jpg", type: "image/jpeg" });
    } catch (error) {
      toast.error(error?.message || t("photoUseFailed"));
    }
  };

  const publishNotice = async () => {
    if (noticeBusy) return;
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      toast.info(t("addTitleMessage"));
      return;
    }
    try {
      setNoticeBusy(true);
      await api.createAnnouncement(
        { title: noticeTitle.trim(), message: noticeMessage.trim() },
        noticePhoto || undefined,
      );
      setNoticeTitle("");
      setNoticeMessage("");
      setNoticePhoto(null);
      toast.success(t("updatePosted"));
      load();
    } catch (error) {
      toast.error(error?.message || t("postUpdateFailed"));
    } finally {
      setNoticeBusy(false);
    }
  };

  const confirmDeleteNotice = (item) => {
    if (!admin) return;
    Alert.alert(item.title, t("removeUpdate"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("remove"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteAnnouncement(item.id);
            load();
          } catch {
            toast.error(t("removeUpdateFailed"));
          }
        },
      },
    ]);
  };

  const renderMessageItem = ({ item }) => {
    const mine = String(item.userId) === String(uid);
    return (
      <View style={[styles.messageRow, mine && styles.myMessageRow]}>
        <TouchableOpacity
          activeOpacity={0.9}
          delayLongPress={280}
          onLongPress={() => openMessageActions(item)}
          style={[styles.messageContainer, mine && styles.myMessage]}
        >
          {!mine ? (
            <>
              <Text style={styles.name}>{item.displayName || item.username || t("staff")}</Text>
              {item.username ? <Text style={styles.username}>@{item.username}</Text> : null}
            </>
          ) : null}
          <Text style={[styles.text, mine && styles.myMessageText, item.decryptFailed && styles.lockedText]}>
            {item.decryptFailed ? t("encryptedUnread") : item.message}
          </Text>
          <View style={[styles.metaRow, mine && styles.myMetaRow]}>
            {item.encrypted ? <Ionicons name="lock-closed" size={11} color={mine ? "rgba(255,255,255,0.72)" : colors.textSecondary} /> : null}
            <Text style={[styles.time, mine && styles.myTime, { marginTop: 0 }]}>
              {item.edited ? `${t("edited")} · ` : ""}
              {item.encrypted ? `${t("encrypted")} · ` : ""}
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const composer = (placeholder) => (
    <>
      {editingItem ? (
        <View style={styles.editBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.editLabel}>{t("editingMessage")}</Text>
            <Text style={styles.editPreview} numberOfLines={1}>
              {editingItem.message}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEditingItem(null);
              setMessage("");
            }}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={e2eReady ? (editingItem ? t("updateYourMessage") : placeholder) : t("preparingEncryption")}
          placeholderTextColor={colors.placeholder}
          value={message}
          onChangeText={setMessage}
          editable={e2eReady && !sending}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={sending || !e2eReady}>
          {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name={editingItem ? "checkmark" : "send"} size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </>
  );

  const empty = (icon, title, body) => (
    <View style={styles.emptyWrap}>
      <Ionicons name={icon} size={26} color={colors.primary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.empty}>{body}</Text>
    </View>
  );

  return (
    <ScreenBackdrop>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.headerPad, { paddingTop: insets.top + 12 }]}>
          <PageHeader kicker={t("tabTeam")} title={t("tabChat")} />
        </View>

        <View style={styles.tabWrap}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  setActiveTab(tab.key);
                  setChatTarget(null);
                  setEditingItem(null);
                  setMenuItem(null);
                  setMessage("");
                }}
                style={[styles.tabButton, active && styles.activeTab]}
              >
                <Ionicons name={tab.icon} size={16} color={active ? "#fff" : colors.textSecondary} />
                <Text style={[styles.tabText, active && styles.activeTabText]}>{t(tab.labelKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === "Chat" && !chatTarget && (
          <View style={styles.chatChooser}>
            <Text style={styles.chooserKicker}>{t("directLine")}</Text>
            <Text style={styles.chooserTitle}>{t("whoDoYouNeed")}</Text>
            <Text style={styles.chooserHint}>{t("chooserHint")}</Text>

            <TouchableOpacity
              onPress={() => {
                setMessages([]);
                setChatTarget("admin");
              }}
              style={styles.chooserCard}
              activeOpacity={0.9}
            >
              <View style={styles.chooserIcon}>
                <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chooserName}>{t("adminDesk")}</Text>
                <Text style={styles.chooserSub}>{t("adminDeskHint")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMessages([]);
                setChatTarget("security");
              }}
              style={styles.chooserCard}
              activeOpacity={0.9}
            >
              <View style={styles.chooserIcon}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chooserName}>{t("securityDesk")}</Text>
                <Text style={styles.chooserSub}>{t("securityDeskHint")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "Chat" && chatTarget && (
          <View style={styles.flex}>
            <View style={styles.chatBar}>
              <TouchableOpacity onPress={() => setChatTarget(null)} style={styles.backChip}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatBarTitle}>{chatTarget === "admin" ? t("adminDesk") : t("securityDesk")}</Text>
                <Text style={styles.chatBarSub}>{e2eReady ? t("e2eTitle") : t("preparingEncryption")}</Text>
              </View>
              <TouchableOpacity onPress={showSafety} style={styles.lockChip} accessibilityLabel={t("encryptionDetails")}>
                <Ionicons name={e2eReady ? "lock-closed" : "lock-open"} size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.listPad}
              inverted={messages.length > 0}
              {...LIST_PERF}
              ListEmptyComponent={empty("chatbubbles-outline", t("noMessages"), t("noMessagesHint"))}
            />
            {composer(chatTarget === "admin" ? t("messageAdmin") : t("messageSecurity"))}
          </View>
        )}

        {activeTab === "Groups" && (
          <View style={styles.flex}>
            <View style={styles.chatBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatBarTitle}>{t("onDutyTeam")}</Text>
                <Text style={styles.chatBarSub}>{e2eReady ? t("e2eTitle") : t("preparingEncryption")}</Text>
              </View>
              <TouchableOpacity onPress={showSafety} style={styles.lockChip} accessibilityLabel={t("encryptionDetails")}>
                <Ionicons name={e2eReady ? "lock-closed" : "lock-open"} size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.listPad}
              inverted={messages.length > 0}
              {...LIST_PERF}
              ListEmptyComponent={empty("people-outline", t("noGroupMessages"), t("noGroupHint"))}
            />
            {composer(t("messageOnDutyTeam"))}
          </View>
        )}

        {activeTab === "Updates" && (
          <FlatList
            data={announcements}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPad}
            {...LIST_PERF}
            ListHeaderComponent={
              admin ? (
                <View style={styles.noticeComposer}>
                  <Text style={styles.noticeComposerTitle}>{t("postBriefing")}</Text>
                  <TextInput
                    style={styles.noticeTitleInput}
                    placeholder={t("titleWord")}
                    placeholderTextColor={colors.placeholder}
                    value={noticeTitle}
                    onChangeText={setNoticeTitle}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder={t("briefingPlaceholder")}
                    placeholderTextColor={colors.placeholder}
                    multiline
                    value={noticeMessage}
                    onChangeText={setNoticeMessage}
                  />
                  {noticePhoto?.uri ? (
                    <View>
                      <Image source={{ uri: noticePhoto.uri }} style={styles.previewImage} />
                      <TouchableOpacity onPress={() => setNoticePhoto(null)} style={styles.removePhotoBtn}>
                        <Text style={styles.removePhotoText}>{t("removePhoto")}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.pickImageButton}
                      onPress={() =>
                        Alert.alert(t("attachPhotoOptional"), undefined, [
                          { text: t("takePhoto"), onPress: () => pickNoticePhoto(true) },
                          { text: t("choosePhoto"), onPress: () => pickNoticePhoto(false) },
                          { text: t("cancel"), style: "cancel" },
                        ])
                      }
                    >
                      <Ionicons name="image-outline" size={18} color={colors.primary} />
                      <Text style={styles.pickImageText}>{t("attachPhotoOptional")}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.postBtn, { marginTop: 12 }]} onPress={publishNotice} disabled={noticeBusy}>
                    {noticeBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>{t("postBriefingBtn")}</Text>}
                  </TouchableOpacity>
                </View>
              ) : null
            }
            ListEmptyComponent={empty("megaphone-outline", t("noBriefings"), t("noBriefingsHint"))}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.noticeCard} onLongPress={() => confirmDeleteNotice(item)} delayLongPress={280} activeOpacity={0.9}>
                <View style={styles.noticeRow}>
                  <View style={styles.noticeIcon}>
                    <Ionicons name="megaphone" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noticeTitle}>{item.title}</Text>
                    <Text style={styles.postBody}>{item.message}</Text>
                    <Text style={styles.time}>
                      {item.actorName ? `${item.actorName} · ` : ""}
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
                {item.imageUrl ? (
                  <Image source={{ uri: resolveMediaUrl(item.imageUrl) }} style={styles.noticeImage} />
                ) : null}
              </TouchableOpacity>
            )}
          />
        )}

        <ChatActionsSheet
          visible={!!menuItem}
          preview={menuItem?.message}
          onClose={() => setMenuItem(null)}
          onEdit={canManage(menuItem) ? startEdit : undefined}
          onDelete={confirmDelete}
        />
      </KeyboardAvoidingView>
    </ScreenBackdrop>
  );
};

export default ChatScreen;

const makeStyles = (colors, shadows) =>
  StyleSheet.create({
    flex: { flex: 1 },
    headerPad: { paddingHorizontal: 16, marginBottom: -8 },
    tabWrap: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 6,
      marginBottom: 8,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
    },
    tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
    activeTab: { backgroundColor: colors.primary },
    activeTabText: { color: "#fff", fontWeight: "700" },
    subTabWrap: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 3,
    },
    subTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
    subTabActive: { backgroundColor: colors.surface },
    subTabText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
    subTabTextActive: { color: colors.primary, fontWeight: "700" },
    chatChooser: { flex: 1, padding: 20, paddingTop: 12 },
    chooserKicker: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    chooserTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
    chooserHint: { fontSize: 14, color: colors.textSecondary, marginTop: 6, marginBottom: 20, lineHeight: 20 },
    chooserCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    chooserIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    chooserName: { fontSize: 16, fontWeight: "700", color: colors.text },
    chooserSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    chatBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    backChip: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    chatBarTitle: { fontWeight: "700", color: colors.text, fontSize: 16 },
    chatBarSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
    lockChip: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    myMetaRow: { justifyContent: "flex-end" },
    lockedText: { fontStyle: "italic" },
    inputContainer: {
      flexDirection: "row",
      padding: 10,
      paddingBottom: 12,
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
    },
    input: {
      flex: 1,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginRight: 8,
      color: colors.text,
      backgroundColor: colors.background,
    },
    sendButton: {
      backgroundColor: colors.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    composer: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    composerPlaceholder: { flex: 1, color: colors.textSecondary },
    editBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 10,
      marginBottom: 4,
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    editLabel: { fontSize: 12, fontWeight: "700", color: colors.primary },
    editPreview: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    listPad: { padding: 16, paddingBottom: 24, flexGrow: 1 },
    messageRow: { marginBottom: 10, alignItems: "flex-start" },
    myMessageRow: { alignItems: "flex-end" },
    messageContainer: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 16,
      maxWidth: "86%",
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    myMessage: { backgroundColor: colors.primary, borderColor: colors.primary },
    myMessageText: { color: "#fff" },
    myTime: { color: "rgba(255,255,255,0.72)" },
    postCard: {
      marginBottom: 14,
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: colors.primary, fontWeight: "800" },
    postImage: { width: "100%", height: 168, borderRadius: 14, marginBottom: 8, backgroundColor: colors.muted },
    name: { fontWeight: "700", color: colors.primary },
    username: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
    postBody: { color: colors.text, lineHeight: 21 },
    text: { color: colors.text, lineHeight: 20 },
    time: { marginTop: 2, fontSize: 11, color: colors.textSecondary },
    expiry: { marginTop: 8, fontSize: 11, fontWeight: "600", color: colors.primary },
    editLink: { color: colors.primary, fontWeight: "700" },
    closeLink: { color: colors.textSecondary, fontWeight: "600" },
    emptyWrap: { alignItems: "center", paddingVertical: 36, paddingHorizontal: 24 },
    emptyTitle: { fontWeight: "800", color: colors.text, marginTop: 8 },
    empty: { color: colors.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 19, fontSize: 13 },
    noticeCard: {
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    noticeRow: { flexDirection: "row", gap: 12 },
    noticeImage: { width: "100%", height: 180, borderRadius: 12, marginTop: 12, backgroundColor: colors.muted },
    pickImageText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
    removePhotoBtn: { alignSelf: "flex-start", marginTop: 8 },
    removePhotoText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
    noticeIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    noticeTitle: { fontWeight: "700", color: colors.primary, marginBottom: 4, fontSize: 15 },
    noticeComposer: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    noticeComposerTitle: { fontWeight: "800", color: colors.text, marginBottom: 10 },
    noticeTitleInput: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: 8,
    },
    modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.overlay, padding: 20 },
    modalContent: { width: "100%", backgroundColor: colors.surface, borderRadius: 20, padding: 20 },
    modalTitle: { fontWeight: "800", fontSize: 18, marginBottom: 12, color: colors.text },
    modalInput: {
      height: 110,
      textAlignVertical: "top",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      color: colors.text,
      backgroundColor: colors.background,
    },
    pickImageButton: {
      backgroundColor: colors.primaryLight,
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 12,
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    previewImage: { width: "100%", height: 180, borderRadius: 12, marginTop: 10, backgroundColor: colors.muted },
    modalActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
    cancelText: { color: colors.danger, fontWeight: "600" },
    postBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, alignItems: "center", minHeight: 42, justifyContent: "center" },
    postBtnText: { color: "#fff", fontWeight: "700" },
  });
