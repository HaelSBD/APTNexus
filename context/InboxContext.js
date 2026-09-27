import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../utils/api";
import { toast } from "../components/Toast";
import { playAlertFeedback } from "../utils/alertFeedback";
import { isAdminRole } from "../utils/roles";
import { useCurrentUser } from "./UserContext";
import { useSettings } from "./SettingsContext";
import { t } from "../utils/i18n";

const READ_KEY = "aptnexus:inbox-read";
const InboxContext = createContext({
  items: [],
  unread: 0,
  loading: false,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  remove: async () => {},
});

const iconFor = (kind) =>
  ({
    gate: "enter-outline",
    patrol: "qr-code-outline",
    duty: "shield-outline",
    support: "chatbubble-ellipses-outline",
    team: "people-outline",
    chat: "chatbubbles-outline",
    update: "megaphone-outline",
  }[kind] || "notifications-outline");

function mapServerRow(row, lang) {
  return {
    id: String(row.id),
    kind: row.kind || "ops",
    icon: iconFor(row.kind),
    title: row.title || t(lang, "updateWord"),
    meta: [row.actorName, row.meta?.title, row.meta?.channel, row.meta?.unit, row.meta?.site, row.meta?.plateNumber, row.meta?.checkpointName]
      .filter(Boolean)
      .join(" · "),
    body: row.message || row.meta?.message || "",
    at: row.createdAt,
    read: Boolean(row.read),
    entity: row.entity,
    entityId: row.entityId,
    actorId: row.actorId,
    server: true,
  };
}

async function loadReadSet() {
  try {
    const raw = await AsyncStorage.getItem(READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

async function saveReadSet(set) {
  const ids = [...set].slice(0, 400);
  await AsyncStorage.setItem(READ_KEY, JSON.stringify(ids)).catch(() => {});
}

async function synthesize(readSet, admin = false, lang = "en") {
  const [visitors, patrols, duty, trails, notices] = await Promise.allSettled([
    api.visitors(),
    api.patrols(),
    api.dutyLogs(),
    api.trails(),
    api.announcements(),
  ]);
  const visitorRows = visitors.status === "fulfilled" ? visitors.value.rows || [] : [];
  const patrolRows = patrols.status === "fulfilled" ? patrols.value.rows || [] : [];
  const dutyRows = duty.status === "fulfilled" ? duty.value.rows || [] : [];
  const trailRows = trails.status === "fulfilled" ? trails.value.rows || [] : [];
  const noticeRows = notices.status === "fulfilled" ? notices.value.rows || [] : [];
  return [
    ...visitorRows.map((row) => ({
      id: `gate-${row.id}`,
      kind: "gate",
      icon: iconFor("gate"),
      title: row.visitorName || t(lang, "visitorWord"),
      meta: [row.unit, row.plateNumber, row.guardName].filter(Boolean).join(" · "),
      body: t(lang, "registeredVisitor", { name: row.guardName || t(lang, "securityWord"), unit: row.unit || "—" }),
      at: row.createdAt,
      entity: "visitor",
      entityId: row.id,
      actorId: row.guardId,
      server: false,
    })),
    ...patrolRows.map((row) => ({
      id: `patrol-${row.id}`,
      kind: "patrol",
      icon: iconFor("patrol"),
      title: row.checkpointName || t(lang, "checkpointWord"),
      meta: row.guardName || t(lang, "securityWord"),
      body: t(lang, "scannedCheckpoint", {
        name: row.guardName || t(lang, "securityWord"),
        checkpoint: row.checkpointName || t(lang, "aCheckpoint"),
      }),
      at: row.createdAt,
      entity: "patrolScan",
      entityId: row.id,
      actorId: row.guardId,
      server: false,
    })),
    ...(admin
      ? dutyRows.map((row) => ({
          id: `duty-${row.id}`,
          kind: "duty",
          icon: iconFor("duty"),
          title: row.action === "clock_out" ? t(lang, "clockedOut") : t(lang, "clockedIn"),
          meta: [row.guardName, row.site].filter(Boolean).join(" · "),
          body: row.site
            ? t(lang, row.action === "clock_out" ? "clockedOutAt" : "clockedInAt", {
                name: row.guardName || t(lang, "securityWord"),
                site: row.site,
              })
            : t(lang, row.action === "clock_out" ? "clockedOutPlain" : "clockedInPlain", {
                name: row.guardName || t(lang, "securityWord"),
              }),
          at: row.createdAt,
          entity: "dutyLog",
          entityId: row.id,
          actorId: row.guardId,
          server: false,
        }))
      : []),
    ...(admin
      ? trailRows
          .filter((row) => row.action === "support.feedback")
          .map((row) => ({
            id: `support-${row.id}`,
            kind: "support",
            icon: iconFor("support"),
            title: row.summary || t(lang, "feedbackWord"),
            meta: row.actorName || t(lang, "securityWord"),
            body: row.meta?.message || row.summary || "",
            at: row.createdAt,
            entity: "support",
            entityId: row.id,
            actorId: row.actorId,
            server: false,
          }))
      : []),
    ...noticeRows.map((row) => ({
      id: `update-${row.id}`,
      kind: "update",
      icon: iconFor("update"),
      title: row.title || t(lang, "dutyBriefing"),
      meta: row.actorName || t(lang, "roleAdmin"),
      body: row.message || "",
      at: row.createdAt,
      entity: "announcement",
      entityId: row.id,
      actorId: row.actorId,
      server: false,
    })),
  ]
    .map((row) => ({ ...row, read: readSet.has(String(row.id)) }))
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
}

function sameInbox(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id || Boolean(a[i].read) !== Boolean(b[i].read) || a[i].title !== b[i].title || a[i].body !== b[i].body) return false;
  }
  return true;
}

export function InboxProvider({ children }) {
  const { user, profile } = useCurrentUser();
  const { settings } = useSettings();
  const lang = settings?.language || "en";
  const admin = isAdminRole(profile || user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ready = useRef(false);
  const seen = useRef(new Set());
  const uid = user?.id;

  const alertNew = (rows) => {
    if (!ready.current) {
      rows.forEach((row) => seen.current.add(String(row.id)));
      ready.current = true;
      return;
    }
    const fresh = rows.filter((row) => !seen.current.has(String(row.id)) && !row.read && String(row.actorId || "") !== String(uid || ""));
    rows.forEach((row) => seen.current.add(String(row.id)));
    if (!fresh.length) return;
    playAlertFeedback();
    const first = fresh[0];
    toast.info(fresh.length === 1 ? first.title : t(lang, "newUpdates", { n: fresh.length }));
  };

  const refresh = useCallback(async () => {
    if (!uid) {
      setItems([]);
      ready.current = false;
      seen.current = new Set();
      return;
    }
    setLoading(!ready.current);
    try {
      const data = await api.notifications();
      const rows = (data.rows || []).map((row) => mapServerRow(row, lang));
      alertNew(rows);
      setItems((prev) => (sameInbox(prev, rows) ? prev : rows));
    } catch {
      const readSet = await loadReadSet();
      const rows = await synthesize(readSet, admin, lang);
      alertNew(rows);
      setItems((prev) => (sameInbox(prev, rows) ? prev : rows));
    } finally {
      setLoading(false);
    }
  }, [admin, uid, lang]);

  useEffect(() => {
    ready.current = false;
    seen.current = new Set();
  }, [uid]);

  useEffect(() => {
    refresh();
    if (!uid) return undefined;
    const tick = setInterval(() => {
      if (AppState.currentState === "active") refresh();
    }, 45000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(tick);
      sub.remove();
    };
  }, [uid, refresh]);

  const markRead = useCallback(async (item) => {
    if (!item) return;
    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
    if (item.server) {
      try {
        await api.readNotification(item.id, true);
        return;
      } catch {
        // fall through to local
      }
    }
    const set = await loadReadSet();
    set.add(String(item.id));
    await saveReadSet(set);
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((row) => ({ ...row, read: true })));
    try {
      await api.readAllNotifications();
    } catch {
      const set = await loadReadSet();
      items.forEach((row) => set.add(String(row.id)));
      await saveReadSet(set);
    }
  }, [items]);

  const remove = useCallback(async (item) => {
    setItems((current) => current.filter((row) => row.id !== item.id));
    if (item.server) {
      try {
        await api.deleteNotification(item.id);
      } catch {
        // already removed locally
      }
    }
  }, []);

  const unread = useMemo(() => items.filter((row) => !row.read).length, [items]);

  const value = useMemo(
    () => ({ items, unread, loading, refresh, markRead, markAllRead, remove }),
    [items, unread, loading, refresh, markRead, markAllRead, remove],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox() {
  return useContext(InboxContext);
}
