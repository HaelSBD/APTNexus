import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import Avatar from "../components/Avatar";
import { toast } from "../components/Toast";
import { useCurrentUser } from "../context/UserContext";
import { useChat } from "../context/ChatContext";
import { useSettings, useThemedStyles } from "../context/SettingsContext";
import { api, dmChannel, groupChannel } from "../utils/api";
import { formatRelativeTime } from "../utils/format";
import { isAdminRole, isSuperAdmin, normalizeRole } from "../utils/roles";
import { useE2e } from "../context/E2eContext";
import { prepareJpeg, resolveMediaUrl, withMediaUrls } from "../utils/media";
import { askPermission, openAppSettings } from "../utils/permissions";
import { translateRole, useT } from "../utils/i18n";

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

const mapContact = (row, fallbackRole) => ({
  id: String(row.id || row._id || ""),
  displayName: row.displayName || row.username || "Staff",
  username: row.username || "",
  photoURL: row.photoURL || "",
  role: row.role || fallbackRole,
});

const isUnknownChatError = (error) =>
  /unknown chat|chat api is outdated/i.test(String(error?.message || ""));

const deskChannelFor = (peer, desk) =>
  normalizeRole(peer?.role || desk) === "admin" ? "admin" : "security";

const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { user, profile } = useCurrentUser();
  const { markSeen } = useChat();
  const { openRow } = useE2e();
  const { colors } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  const me = profile || user;
  const admin = isAdminRole(me);
  const superAdmin = isSuperAdmin(me);
  const canCreateGroups = admin || superAdmin;
  const uid = user?.id || profile?.id;

  const [activeTab, setActiveTab] = useState("Chat");
  const [desk, setDesk] = useState(null);
  const [peer, setPeer] = useState(null);
  const [channelOverride, setChannelOverride] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [invitePool, setInvitePool] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
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

  const openRowRef = useRef(openRow);
  const markSeenRef = useRef(markSeen);
  const tRef = useRef(t);
  const adminRef = useRef(admin);
  const uidRef = useRef(uid);
  const snapshotRef = useRef({});
  const appliedRouteRef = useRef("");

  openRowRef.current = openRow;
  markSeenRef.current = markSeen;
  tRef.current = t;
  adminRef.current = admin;
  uidRef.current = uid;

  const activeChannel = useMemo(() => {
    if (channelOverride) return channelOverride;
    if (activeTab === "Chat" && peer && uid) return dmChannel(uid, peer.id);
    if (activeTab === "Groups" && activeGroup) return groupChannel(activeGroup.id);
    return "";
  }, [activeTab, peer, activeGroup, uid, channelOverride]);

  useEffect(() => {
    setChannelOverride(null);
  }, [peer?.id, activeGroup?.id, desk, activeTab]);

  snapshotRef.current = {
    activeTab,
    desk,
    peer,
    activeGroup,
    activeChannel,
    creatingGroup,
    channelOverride,
  };

  const reveal = useCallback((row) => {
    if (!row?.encrypted) {
      return { ...row, message: String(row?.message || ""), encrypted: false, decryptFailed: false };
    }
    const opened = openRowRef.current(row);
    return {
      ...row,
      message: opened.failed ? "" : opened.text,
      encrypted: true,
      decryptFailed: Boolean(opened.failed),
    };
  }, []);

  const resetThread = () => {
    setMessages([]);
    setEditingItem(null);
    setMenuItem(null);
    setMessage("");
  };

  const loadContacts = useCallback(async (nextDesk, { silent = false } = {}) => {
    if (!nextDesk) return;
    try {
      if (!silent) setContactsLoading(true);
      if (adminRef.current) {
        try {
          const data = await api.users();
          const want = nextDesk === "admin" ? "admin" : "security";
          const meId = String(uidRef.current || "");
          const rows = (data.rows || [])
            .filter(
              (row) =>
                normalizeRole(row.role) === want &&
                row.active !== false &&
                String(row.id) !== meId,
            )
            .map((row) => mapContact(row, want))
            .sort((a, b) =>
              String(a.displayName).localeCompare(String(b.displayName), undefined, { sensitivity: "base" }),
            );
          setContacts(rows);
          return;
        } catch {
          // fall through
        }
      }
      const data = await api.chatContacts(nextDesk);
      setContacts((data.rows || []).map((row) => mapContact(row, nextDesk)));
    } catch (error) {
      if (!silent) toast.error(error?.message || tRef.current("loadContactsFailed"));
      if (!silent) setContacts([]);
    } finally {
      if (!silent) setContactsLoading(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const data = await api.chatGroups();
      setGroups(data.rows || []);
    } catch {
      setGroups([]);
    }
  }, []);

  const loadInvitePool = useCallback(async () => {
    try {
      if (adminRef.current) {
        const data = await api.users();
        const meId = String(uidRef.current || "");
        setInvitePool(
          (data.rows || [])
            .filter(
              (row) =>
                row.active !== false &&
                String(row.id) !== meId &&
                normalizeRole(row.role) !== "superadmin",
            )
            .map((row) => mapContact(row, row.role))
            .sort((a, b) =>
              String(a.displayName).localeCompare(String(b.displayName), undefined, { sensitivity: "base" }),
            ),
        );
        return;
      }
      const [admins, security] = await Promise.all([api.chatContacts("admin"), api.chatContacts("security")]);
      setInvitePool([
        ...(admins.rows || []).map((row) => mapContact(row, "admin")),
        ...(security.rows || []).map((row) => mapContact(row, "security")),
      ]);
    } catch {
      setInvitePool([]);
    }
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    const snap = snapshotRef.current;
    try {
      if (snap.activeTab === "Chat") {
        if (snap.peer && snap.activeChannel) {
          try {
            const data = await api.chat(snap.activeChannel);
            setMessages((data.rows || []).map((row) => reveal(row)));
          } catch (error) {
            if (
              String(snap.activeChannel).startsWith("dm:") &&
              !snap.channelOverride &&
              isUnknownChatError(error)
            ) {
              setChannelOverride(deskChannelFor(snap.peer, snap.desk));
              return;
            }
            throw error;
          }
        } else if (snap.desk) {
          await loadContacts(snap.desk, { silent });
        }
      }
      if (snap.activeTab === "Groups") {
        if (snap.activeGroup && snap.activeChannel) {
          const data = await api.chat(snap.activeChannel);
          setMessages((data.rows || []).map((row) => reveal(row)));
        } else if (!snap.creatingGroup) {
          await loadGroups();
        }
      }
      if (snap.activeTab === "Updates") {
        const data = await api.announcements();
        setAnnouncements((data.rows || []).map(withMediaUrls));
      }
      markSeenRef.current();
    } catch {
      // keep last snapshot
    }
  }, [reveal, loadContacts, loadGroups]);

  const loadRef = useRef(load);
  loadRef.current = load;

  // Reload when the user actually changes tab / desk / thread.
  useEffect(() => {
    if (creatingGroup) return;
    const openingDesk = activeTab === "Chat" && desk && !peer;
    loadRef.current({ silent: !openingDesk });
  }, [activeTab, desk, peer?.id, activeGroup?.id, creatingGroup, activeChannel]);

  const routeTab = route.params?.tab;
  const routeChannel = route.params?.channel;
  const routeGroupId = route.params?.groupId;
  const routeGroupName = route.params?.groupName;
  const routePeerId = route.params?.peerId;
  const routePeerName = route.params?.peerName;
  const routeDesk = route.params?.desk;

  useFocusEffect(
    useCallback(() => {
      const routeKey = [routeTab, routeChannel, routeGroupId, routePeerId, routeDesk].join("|");
      if (routeKey !== appliedRouteRef.current && routeKey !== "||||") {
        appliedRouteRef.current = routeKey;
        if (routeTab === "Updates") {
          setActiveTab("Updates");
          setDesk(null);
          setPeer(null);
          setActiveGroup(null);
          setCreatingGroup(false);
        } else if (routeTab === "Groups" || routeGroupId) {
          setActiveTab("Groups");
          setDesk(null);
          setPeer(null);
          setCreatingGroup(false);
          if (routeGroupId) {
            setActiveGroup({ id: routeGroupId, name: routeGroupName || tRef.current("groupChat") });
          }
        } else if (routeChannel || routePeerId) {
          setActiveTab("Chat");
          setActiveGroup(null);
          setCreatingGroup(false);
          const channel = String(routeChannel || "");
          if (channel.startsWith("dm:") && routePeerId) {
            setPeer({
              id: routePeerId,
              displayName: routePeerName || tRef.current("directMessage"),
              username: "",
              role: "security",
            });
            setDesk(normalizeRole(routeDesk) === "admin" ? "admin" : "security");
          } else if (channel.startsWith("g:")) {
            setActiveTab("Groups");
            setActiveGroup({ id: channel.slice(2), name: routeGroupName || tRef.current("groupChat") });
          } else if (routePeerId) {
            setPeer({
              id: routePeerId,
              displayName: routePeerName || tRef.current("directMessage"),
              username: "",
              role: routeDesk === "admin" ? "admin" : "security",
            });
            setDesk(routeDesk === "admin" ? "admin" : "security");
          }
        }
      }

      loadRef.current({ silent: true });
      const tick = setInterval(() => loadRef.current({ silent: true }), 45000);
      return () => clearInterval(tick);
    }, [routeTab, routeChannel, routeGroupId, routeGroupName, routePeerId, routePeerName, routeDesk]),
  );

  const canManage = (item) =>
    Boolean(uid && String(item?.userId || item?.actorId) === String(uid)) || superAdmin;
  const canRemove = (item) => canManage(item) || admin;

  const handleSend = async () => {
    if (sending || !activeChannel) return;
    if (!message.trim()) {
      toast.info(t("typeMessageFirst"));
      return;
    }
    try {
      setSending(true);
      const text = message.trim();
      if (editingItem) {
        await api.editChat(editingItem.id, text);
        setEditingItem(null);
      } else {
        try {
          await api.sendChat(activeChannel, { message: text });
        } catch (error) {
          if (
            String(activeChannel).startsWith("dm:") &&
            !channelOverride &&
            isUnknownChatError(error)
          ) {
            const fallback = deskChannelFor(peer, desk);
            setChannelOverride(fallback);
            await api.sendChat(fallback, { message: text });
          } else {
            throw error;
          }
        }
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

  const openDesk = (nextDesk) => {
    resetThread();
    setPeer(null);
    setContacts([]);
    setContactsLoading(true);
    setDesk(nextDesk);
  };

  const openPeer = (contact) => {
    resetThread();
    setPeer(contact);
  };

  const openGroup = (group) => {
    resetThread();
    setCreatingGroup(false);
    setActiveGroup(group);
  };

  const startCreateGroup = async () => {
    resetThread();
    setActiveGroup(null);
    setGroupName("");
    setSelectedMembers([]);
    setCreatingGroup(true);
    await loadInvitePool();
  };

  const toggleMember = (id) => {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const createGroup = async () => {
    if (sending) return;
    if (!groupName.trim()) {
      toast.info(t("groupNameRequired"));
      return;
    }
    try {
      setSending(true);
      const data = await api.createChatGroup({
        name: groupName.trim(),
        memberIds: selectedMembers,
      });
      toast.success(t("groupCreated"));
      setCreatingGroup(false);
      setGroupName("");
      setSelectedMembers([]);
      setActiveGroup(data.row);
      await loadGroups();
    } catch (error) {
      const raw = String(error?.message || "");
      const missingRoute = /cannot post|not found|failed \(404\)|did not respond|check that the admin api/i.test(raw);
      toast.error(missingRoute ? t("groupApiMissing") : raw || t("groupCreateFailed"));
    } finally {
      setSending(false);
    }
  };

  const canEditActiveGroup =
    Boolean(activeGroup) &&
    (canCreateGroups || String(activeGroup?.createdBy || "") === String(uid || ""));

  const pickGroupPhoto = async (fromCamera) => {
    if (!activeGroup?.id || !canEditActiveGroup || sending) return;
    const permission = await askPermission(fromCamera ? "camera" : "photos");
    if (!permission.granted) {
      Alert.alert(t("appSettings"), fromCamera ? t("allowGroupCamera") : t("allowGroupPhotos"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("openPhoneSettings"), onPress: openAppSettings },
      ]);
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
    const uri = result.assets?.[0]?.uri;
    if (result.canceled || !uri) return;
    try {
      setSending(true);
      const prepared = await prepareJpeg(uri, 1200);
      const data = await api.updateChatGroup(
        activeGroup.id,
        {},
        { uri: prepared.uri, name: "group.jpg", type: "image/jpeg" },
      );
      setActiveGroup(data.row);
      setGroups((prev) => prev.map((row) => (String(row.id) === String(data.row.id) ? { ...row, ...data.row } : row)));
      toast.success(t("groupImageUpdated"));
    } catch (error) {
      toast.error(error?.message || t("groupImageFailed"));
    } finally {
      setSending(false);
    }
  };

  const openGroupPhotoPicker = () => {
    if (!canEditActiveGroup) return;
    Alert.alert(t("changeGroupImage"), t("changeGroupImageHint"), [
      { text: t("takePhoto"), onPress: () => pickGroupPhoto(true) },
      { text: t("choosePhoto"), onPress: () => pickGroupPhoto(false) },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  const renderMessageItem = ({ item }) => {
    const mine = String(item.userId) === String(uid);
    const anonymous = Boolean(item.anonymous);
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
              {item.username && !anonymous ? <Text style={styles.username}>@{item.username}</Text> : null}
            </>
          ) : null}
          <Text style={[styles.text, mine && styles.myMessageText, item.decryptFailed && styles.lockedText]}>
            {item.decryptFailed ? t("encryptedUnread") : item.message}
          </Text>
          <View style={[styles.metaRow, mine && styles.myMetaRow]}>
            {anonymous ? <Ionicons name="eye-off-outline" size={11} color={mine ? "rgba(255,255,255,0.72)" : colors.textSecondary} /> : null}
            <Text style={[styles.time, mine && styles.myTime, { marginTop: 0 }]}>
              {item.edited ? `${t("edited")} · ` : ""}
              {anonymous ? `${t("anonymousModerator")} · ` : ""}
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
      {superAdmin && activeTab === "Groups" && activeGroup ? (
        <Text style={styles.anonHint}>{t("superAdminAnonymousHint")}</Text>
      ) : null}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={editingItem ? t("updateYourMessage") : placeholder}
          placeholderTextColor={colors.placeholder}
          value={message}
          onChangeText={setMessage}
          editable={!sending}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={sending}>
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

  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.personCard} onPress={() => openPeer(item)} activeOpacity={0.88}>
      <Avatar photoURL={item.photoURL} style={styles.personAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.personName} numberOfLines={1}>
          {item.displayName || item.username}
        </Text>
        <Text style={styles.personMeta} numberOfLines={1}>
          @{item.username} · {translateRole(t, item.role)}
        </Text>
      </View>
      <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
    </TouchableOpacity>
  );

  const renderGroup = ({ item }) => (
    <TouchableOpacity style={styles.personCard} onPress={() => openGroup(item)} activeOpacity={0.88}>
      {item.photoURL ? (
        <Avatar photoURL={item.photoURL} style={styles.personAvatar} />
      ) : (
        <View style={styles.groupIcon}>
          <Ionicons name="people" size={20} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.personName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.personMeta}>
          {t("groupMembersCount", { n: item.memberCount || (item.memberIds || []).length || 0 })}
          {superAdmin && !(item.memberIds || []).map(String).includes(String(uid)) ? ` · ${t("monitoringGroup")}` : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
    </TouchableOpacity>
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
                  setDesk(null);
                  setPeer(null);
                  setActiveGroup(null);
                  setCreatingGroup(false);
                  setEditingItem(null);
                  setMenuItem(null);
                  setMessage("");
                  setMessages([]);
                }}
                style={[styles.tabButton, active && styles.activeTab]}
              >
                <Ionicons name={tab.icon} size={16} color={active ? "#fff" : colors.textSecondary} />
                <Text style={[styles.tabText, active && styles.activeTabText]}>{t(tab.labelKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === "Chat" && !desk && (
          <View style={styles.chatChooser}>
            <Text style={styles.chooserKicker}>{t("directLine")}</Text>
            <Text style={styles.chooserTitle}>{t("whoDoYouNeed")}</Text>
            <Text style={styles.chooserHint}>{t("chooserHint")}</Text>

            <TouchableOpacity onPress={() => openDesk("admin")} style={styles.chooserCard} activeOpacity={0.9}>
              <View style={styles.chooserIcon}>
                <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chooserName}>{t("adminDesk")}</Text>
                <Text style={styles.chooserSub}>{t("adminDeskPickHint")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => openDesk("security")} style={styles.chooserCard} activeOpacity={0.9}>
              <View style={styles.chooserIcon}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chooserName}>{t("securityDesk")}</Text>
                <Text style={styles.chooserSub}>{t("securityDeskPickHint")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "Chat" && desk && !peer && (
          <View style={styles.flex}>
            <View style={styles.chatBar}>
              <TouchableOpacity
                onPress={() => {
                  setDesk(null);
                  setContacts([]);
                  resetThread();
                }}
                style={styles.backChip}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatBarTitle}>{desk === "admin" ? t("adminDesk") : t("securityDesk")}</Text>
                <Text style={styles.chatBarSub}>{desk === "admin" ? t("selectAdminToChat") : t("selectSecurityToChat")}</Text>
              </View>
            </View>
            {contactsLoading ? (
              <ActivityIndicator style={{ marginTop: 28 }} color={colors.primary} />
            ) : (
              <FlatList
                data={contacts}
                keyExtractor={(item) => item.id}
                renderItem={renderContact}
                contentContainerStyle={styles.listPad}
                {...LIST_PERF}
                ListEmptyComponent={empty(
                  "people-outline",
                  desk === "admin" ? t("noAdmins") : t("noSecurityStaff"),
                  desk === "admin" ? t("noAdminsHint") : t("noSecurityStaffHint"),
                )}
              />
            )}
          </View>
        )}

        {activeTab === "Chat" && peer && (
          <View style={styles.flex}>
            <View style={styles.chatBar}>
              <TouchableOpacity
                onPress={() => {
                  setPeer(null);
                  resetThread();
                }}
                style={styles.backChip}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Avatar photoURL={peer.photoURL} style={styles.barAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.chatBarTitle}>{peer.displayName || peer.username}</Text>
                <Text style={styles.chatBarSub}>{translateRole(t, peer.role)} · {t("directMessage")}</Text>
              </View>
            </View>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.listPad}
              inverted={messages.length > 0}
              {...LIST_PERF}
              ListEmptyComponent={empty("chatbubbles-outline", t("noMessages"), t("noDirectHint"))}
            />
            {composer(t("messagePerson", { name: peer.displayName || peer.username || "" }))}
          </View>
        )}

        {activeTab === "Groups" && !activeGroup && !creatingGroup && (
          <View style={styles.flex}>
            <View style={styles.chatBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatBarTitle}>{t("yourGroups")}</Text>
                <Text style={styles.chatBarSub}>{t("groupsInviteOnlyHint")}</Text>
              </View>
              {canCreateGroups ? (
                <TouchableOpacity onPress={startCreateGroup} style={styles.lockChip} accessibilityLabel={t("createGroup")}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              ) : null}
            </View>
            <FlatList
              data={groups}
              keyExtractor={(item) => item.id}
              renderItem={renderGroup}
              contentContainerStyle={styles.listPad}
              {...LIST_PERF}
              ListEmptyComponent={empty(
                "people-outline",
                t("noGroups"),
                canCreateGroups ? t("noGroupsAdminHint") : t("noGroupsHint"),
              )}
            />
          </View>
        )}

        {activeTab === "Groups" && creatingGroup && (
          <View style={styles.flex}>
            <View style={styles.chatBar}>
              <TouchableOpacity
                onPress={() => {
                  setCreatingGroup(false);
                  setGroupName("");
                  setSelectedMembers([]);
                }}
                style={styles.backChip}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatBarTitle}>{t("createGroup")}</Text>
                <Text style={styles.chatBarSub}>{t("createGroupHint")}</Text>
              </View>
            </View>
            <FlatList
              data={invitePool}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listPad}
              {...LIST_PERF}
              ListHeaderComponent={
                <View style={styles.createWrap}>
                  <Text style={styles.label}>{t("groupName")}</Text>
                  <TextInput
                    style={styles.noticeTitleInput}
                    placeholder={t("groupNamePlaceholder")}
                    placeholderTextColor={colors.placeholder}
                    value={groupName}
                    onChangeText={setGroupName}
                  />
                  <Text style={[styles.label, { marginTop: 8 }]}>{t("inviteMembers")}</Text>
                  <Text style={styles.chooserHint}>{t("inviteMembersOptionalHint")}</Text>
                </View>
              }
              renderItem={({ item }) => {
                const selected = selectedMembers.includes(item.id);
                return (
                  <TouchableOpacity style={[styles.personCard, selected && styles.personCardSelected]} onPress={() => toggleMember(item.id)}>
                    <Avatar photoURL={item.photoURL} style={styles.personAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personName}>{item.displayName || item.username}</Text>
                      <Text style={styles.personMeta}>
                        @{item.username} · {translateRole(t, item.role)}
                      </Text>
                    </View>
                    <Ionicons name={selected ? "checkbox" : "square-outline"} size={22} color={colors.primary} />
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                <TouchableOpacity style={[styles.postBtn, { marginTop: 8 }]} onPress={createGroup} disabled={sending}>
                  {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>{t("createGroupBtn")}</Text>}
                </TouchableOpacity>
              }
              ListEmptyComponent={empty("people-outline", t("noInvitees"), t("noInviteesHint"))}
            />
          </View>
        )}

        {activeTab === "Groups" && activeGroup && (
          <View style={styles.flex}>
            <View style={styles.chatBar}>
              <TouchableOpacity
                onPress={() => {
                  setActiveGroup(null);
                  resetThread();
                  loadGroups();
                }}
                style={styles.backChip}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={canEditActiveGroup ? openGroupPhotoPicker : undefined}
                activeOpacity={canEditActiveGroup ? 0.85 : 1}
                disabled={!canEditActiveGroup || sending}
                accessibilityLabel={activeGroup.photoURL ? t("changeGroupImage") : t("addGroupImage")}
              >
                {activeGroup.photoURL ? (
                  <Avatar photoURL={activeGroup.photoURL} style={styles.barAvatar} />
                ) : (
                  <View style={[styles.barAvatar, styles.groupBarIcon]}>
                    <Ionicons name="people" size={16} color={colors.primary} />
                  </View>
                )}
                {canEditActiveGroup ? (
                  <View style={styles.groupPhotoBadge}>
                    <Ionicons name="camera" size={10} color="#fff" />
                  </View>
                ) : null}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatBarTitle}>{activeGroup.name || t("groupChat")}</Text>
                <Text style={styles.chatBarSub}>
                  {canEditActiveGroup
                    ? activeGroup.photoURL
                      ? t("changeGroupImage")
                      : t("addGroupImage")
                    : t("groupsInviteOnlyHint")}
                </Text>
              </View>
            </View>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.listPad}
              inverted={messages.length > 0}
              {...LIST_PERF}
              ListEmptyComponent={empty("people-outline", t("noGroupMessages"), t("noGroupThreadHint"))}
            />
            {composer(t("messageGroup"))}
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
                {item.imageUrl ? <Image source={{ uri: resolveMediaUrl(item.imageUrl) }} style={styles.noticeImage} /> : null}
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
    barAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.muted },
    groupBarIcon: { alignItems: "center", justifyContent: "center", borderRadius: 12 },
    groupPhotoBadge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.surface,
    },
    personCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    personCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    personAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.muted },
    personName: { fontSize: 15, fontWeight: "700", color: colors.text },
    personMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    groupIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    createWrap: { marginBottom: 8 },
    label: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 6 },
    anonHint: {
      marginHorizontal: 12,
      marginBottom: 4,
      fontSize: 11,
      color: colors.textSecondary,
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
    name: { fontWeight: "700", color: colors.primary },
    username: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
    postBody: { color: colors.text, lineHeight: 21 },
    text: { color: colors.text, lineHeight: 20 },
    time: { marginTop: 2, fontSize: 11, color: colors.textSecondary },
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
    postBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
      minHeight: 42,
      justifyContent: "center",
    },
    postBtnText: { color: "#fff", fontWeight: "700" },
  });
