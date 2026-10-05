import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import * as SecureStore from "expo-secure-store";

const { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } = naclUtil;

function keyName(userId) {
  return `aptnexus.e2e.${String(userId || "device").replace(/[^a-zA-Z0-9._-]/g, "")}`;
}

export async function loadOrCreateIdentity(userId) {
  const name = keyName(userId);
  let secretB64 = await SecureStore.getItemAsync(name);
  let secretKey;
  if (secretB64) {
    secretKey = decodeBase64(secretB64);
  } else {
    const pair = nacl.box.keyPair();
    secretKey = pair.secretKey;
    await SecureStore.setItemAsync(name, encodeBase64(secretKey));
  }
  const publicKey = nacl.box.keyPair.fromSecretKey(secretKey).publicKey;
  return {
    secretKey,
    publicKey,
    publicKeyB64: encodeBase64(publicKey),
  };
}

/** Load existing chat keys only — never create new ones (used for reading old sealed messages). */
export async function loadIdentityIfPresent(userId) {
  const name = keyName(userId);
  const secretB64 = await SecureStore.getItemAsync(name);
  if (!secretB64) return null;
  const secretKey = decodeBase64(secretB64);
  const publicKey = nacl.box.keyPair.fromSecretKey(secretKey).publicKey;
  return {
    secretKey,
    publicKey,
    publicKeyB64: encodeBase64(publicKey),
  };
}

export function encryptPlaintext(plaintext, recipients, identity) {
  const list = [];
  const seen = new Set();
  (recipients || []).forEach((row) => {
    const userId = String(row?.userId || "");
    const publicKey = String(row?.publicKey || "").trim();
    if (!userId || !publicKey || seen.has(userId)) return;
    seen.add(userId);
    list.push({ userId, publicKey });
  });
  if (identity?.publicKeyB64 && !seen.has(String(identity.userId))) {
    list.push({ userId: String(identity.userId), publicKey: identity.publicKeyB64 });
  }
  if (!list.length) throw new Error("No device keys available to encrypt this chat.");

  const msgKey = nacl.randomBytes(nacl.secretbox.keyLength);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const ciphertext = nacl.secretbox(decodeUTF8(String(plaintext || "")), nonce, msgKey);
  const wraps = list.map((row) => {
    const wrapNonce = nacl.randomBytes(nacl.box.nonceLength);
    const box = nacl.box(msgKey, wrapNonce, decodeBase64(row.publicKey), identity.secretKey);
    return { userId: row.userId, nonce: encodeBase64(wrapNonce), box: encodeBase64(box) };
  });

  return {
    encrypted: true,
    ciphertext: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce),
    senderPublicKey: identity.publicKeyB64,
    wraps,
  };
}

export function decryptRow(row, identity) {
  if (!row?.encrypted) return { text: String(row?.message || ""), encrypted: false };
  if (!identity?.secretKey) return { text: "", encrypted: true, failed: true };
  const wrap = (row.wraps || []).find((item) => String(item.userId) === String(identity.userId));
  if (!wrap || !row.ciphertext || !row.nonce || !row.senderPublicKey) {
    return { text: "", encrypted: true, failed: true };
  }
  try {
    const msgKey = nacl.box.open(
      decodeBase64(wrap.box),
      decodeBase64(wrap.nonce),
      decodeBase64(row.senderPublicKey),
      identity.secretKey,
    );
    if (!msgKey) return { text: "", encrypted: true, failed: true };
    const plain = nacl.secretbox.open(decodeBase64(row.ciphertext), decodeBase64(row.nonce), msgKey);
    if (!plain) return { text: "", encrypted: true, failed: true };
    return { text: encodeUTF8(plain), encrypted: true };
  } catch {
    return { text: "", encrypted: true, failed: true };
  }
}

export function safetyNumber(keys) {
  const material = (keys || [])
    .map((key) => String(key || "").trim())
    .filter(Boolean)
    .sort()
    .join("|");
  if (!material) return "";
  const digest = nacl.hash(decodeUTF8(material));
  const digits = Array.from(digest)
    .map((byte) => String(byte % 10))
    .join("")
    .slice(0, 60);
  return digits.replace(/(\d{5})/g, "$1 ").trim();
}
