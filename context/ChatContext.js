import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../utils/api";
import { useCurrentUser } from "./UserContext";

const SEEN_KEY = "aptnexus:chat-seen";
const ChatContext = createContext({
  unread: 0,
  refreshUnread: async () => {},
  markSeen: async () => {},
});

export function ChatProvider({ children }) {
  const { user } = useCurrentUser();
  const uid = user?.id;
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!uid) {
      setUnread(0);
      return;
    }
    try {
      const since = await AsyncStorage.getItem(SEEN_KEY);
      if (!since) {
        setUnread(0);
        return;
      }
      const data = await api.chatUnread(since);
      const next = Number(data.unread) || 0;
      setUnread((prev) => (prev === next ? prev : next));
    } catch {
      // keep last count
    }
  }, [uid]);

  const markSeen = useCallback(async () => {
    await AsyncStorage.setItem(SEEN_KEY, new Date().toISOString()).catch(() => {});
    setUnread(0);
  }, []);

  useEffect(() => {
    refreshUnread();
    if (!uid) return undefined;
    const tick = setInterval(() => {
      if (AppState.currentState === "active") refreshUnread();
    }, 45000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshUnread();
    });
    return () => {
      clearInterval(tick);
      sub.remove();
    };
  }, [uid, refreshUnread]);

  const value = useMemo(() => ({ unread, refreshUnread, markSeen }), [unread, refreshUnread, markSeen]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
