import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { api, getToken, onAuthFailure, setToken } from "../utils/api";
import { withMediaUrls } from "../utils/media";
import { useSettings } from "./SettingsContext";
import { useT } from "../utils/i18n";
import { toast } from "../components/Toast";
import { isAdminRole } from "../utils/roles";

function sameUser(a, b) {
  if (a === b) return true;
  if (!a || !b) return !a && !b;
  return (
    a.id === b.id &&
    a.role === b.role &&
    a.photoURL === b.photoURL &&
    a.displayName === b.displayName &&
    a.address === b.address &&
    a.phone === b.phone &&
    a.email === b.email &&
    a.username === b.username &&
    a.site === b.site
  );
}

function sameDuty(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return Boolean(a.clockedIn) === Boolean(b.clockedIn) && a.at === b.at && a.site === b.site;
}

const UserContext = createContext({
  user: null,
  profile: null,
  loading: true,
  duty: { clockedIn: false, at: null, site: "APTNexus" },
  refresh: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  setDuty: () => {},
});

export function UserProvider({ children }) {
  const { setSetting } = useSettings();
  const t = useT();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [duty, setDuty] = useState({ clockedIn: false, at: null, site: "APTNexus" });
  const [loading, setLoading] = useState(true);
  const clearingRef = useRef(false);

  const clearSession = useCallback(async () => {
    await setToken("");
    setUser(null);
    setProfile(null);
    setDuty({ clockedIn: false, at: null, site: "APTNexus" });
  }, []);

  const hydrate = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      const nextUser = withMediaUrls(data.user);
      setUser(nextUser);
      setProfile(nextUser);
      if (!isAdminRole(nextUser)) setSetting("highAccuracyGps", false);
      if (data.duty) setDuty(data.duty);
    } catch {
      await setToken("");
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [setSetting]);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await api.me();
      const nextUser = withMediaUrls(data.user);
      setUser((prev) => (sameUser(prev, nextUser) ? prev : nextUser));
      setProfile((prev) => (sameUser(prev, nextUser) ? prev : nextUser));
      if (!isAdminRole(nextUser)) setSetting("highAccuracyGps", false);
      if (data.duty) setDuty((prev) => (sameDuty(prev, data.duty) ? prev : data.duty));
    } catch (error) {
      if (error?.code === "SESSION_REPLACED" || error?.code === "SESSION_EXPIRED") {
        await clearSession();
      }
    }
  }, [setSetting, clearSession]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    return onAuthFailure((error) => {
      if (clearingRef.current) return;
      clearingRef.current = true;
      if (error?.code === "SESSION_REPLACED") toast.error(t("sessionReplaced"));
      clearSession().finally(() => {
        clearingRef.current = false;
      });
    });
  }, [clearSession, t]);

  useEffect(() => {
    if (!user) return undefined;
    const onChange = (state) => {
      if (state === "active") refresh();
    };
    const sub = AppState.addEventListener("change", onChange);
    const timer = setInterval(() => {
      if (AppState.currentState === "active") refresh();
    }, 45000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [user, refresh]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      duty,
      setDuty,
      refresh,
      signIn: async (identifier, password, { replaceSession = false } = {}) => {
        const data = await api.login(identifier, password, replaceSession);
        await setToken(data.token);
        const nextUser = withMediaUrls(data.user);
        setUser(nextUser);
        setProfile(nextUser);
        if (!isAdminRole(nextUser)) setSetting("highAccuracyGps", false);
        const status = await api.dutyStatus().catch(() => null);
        if (status) setDuty({ clockedIn: status.clockedIn, at: status.at, site: status.site });
        return data.user;
      },
      signOut: async () => {
        await api.logout().catch(() => null);
        await clearSession();
      },
    }),
    [user, profile, loading, duty, hydrate, refresh, setSetting, clearSession],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(UserContext);
}
