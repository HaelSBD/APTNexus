import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { decryptRow, loadIdentityIfPresent } from "../utils/e2e";
import { useCurrentUser } from "./UserContext";

const E2eContext = createContext({
  ready: true,
  safetyCode: "",
  seal: async (plaintext) => ({ message: String(plaintext || "") }),
  openRow: (row) => ({ text: String(row?.message || ""), encrypted: false }),
});

/**
 * Decrypt-only helper for older encrypted chat history.
 * New messages are sent as plain text — no peer fetch, key wrap, or seal on send.
 */
export function E2eProvider({ children }) {
  const { user } = useCurrentUser();
  const uid = user?.id;
  const [identity, setIdentity] = useState(null);

  useEffect(() => {
    if (!uid) {
      setIdentity(null);
      return undefined;
    }
    let alive = true;
    // Optional: open older sealed rows if this device already has keys.
    // Never register peers or create keys — that was the heavy path.
    (async () => {
      try {
        const next = await loadIdentityIfPresent(uid);
        if (!alive) return;
        if (next) {
          next.userId = String(uid);
          setIdentity(next);
        } else {
          setIdentity(null);
        }
      } catch {
        if (alive) setIdentity(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [uid]);

  const seal = useCallback(async (plaintext) => ({ message: String(plaintext || "") }), []);

  const openRow = useCallback(
    (row) => {
      if (!row?.encrypted) return { text: String(row?.message || ""), encrypted: false };
      return decryptRow(row, identity);
    },
    [identity],
  );

  const value = useMemo(() => ({ ready: true, safetyCode: "", seal, openRow }), [seal, openRow]);

  return <E2eContext.Provider value={value}>{children}</E2eContext.Provider>;
}

export function useE2e() {
  return useContext(E2eContext);
}
