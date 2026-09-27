import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../utils/api";
import { decryptRow, encryptPlaintext, loadOrCreateIdentity, safetyNumber } from "../utils/e2e";
import { useCurrentUser } from "./UserContext";

const E2eContext = createContext({
  ready: false,
  safetyCode: "",
  seal: async () => ({}),
  openRow: () => ({ text: "", encrypted: false }),
});

export function E2eProvider({ children }) {
  const { user } = useCurrentUser();
  const uid = user?.id;
  const identityRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [peers, setPeers] = useState([]);
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    if (!uid) {
      identityRef.current = null;
      setReady(false);
      setPeers([]);
      setPublicKey("");
      return undefined;
    }
    let alive = true;
    (async () => {
      const identity = await loadOrCreateIdentity(uid);
      identity.userId = String(uid);
      if (!alive) return;
      identityRef.current = identity;
      setPublicKey(identity.publicKeyB64);
      await api.registerDeviceKey(identity.publicKeyB64);
      const data = await api.cryptoPeers();
      if (!alive) return;
      setPeers(data.rows || []);
      setReady(true);
    })().catch(() => {
      if (alive) setReady(false);
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  const refreshPeers = useCallback(async () => {
    const data = await api.cryptoPeers();
    setPeers(data.rows || []);
    return data.rows || [];
  }, []);

  const seal = useCallback(
    async (plaintext) => {
      const identity = identityRef.current;
      if (!identity) throw new Error("Chat keys are not ready yet.");
      const latest = await refreshPeers().catch(() => peers);
      return encryptPlaintext(plaintext, latest, identity);
    },
    [peers, refreshPeers],
  );

  const openRow = useCallback((row) => decryptRow(row, identityRef.current), []);

  const safetyCode = useMemo(
    () => safetyNumber([publicKey, ...peers.map((row) => row.publicKey)]),
    [peers, publicKey],
  );

  const value = useMemo(
    () => ({ ready, safetyCode, seal, openRow }),
    [ready, safetyCode, seal, openRow],
  );

  return <E2eContext.Provider value={value}>{children}</E2eContext.Provider>;
}

export function useE2e() {
  return useContext(E2eContext);
}
