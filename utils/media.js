import { API_URL } from "../config";

export function resolveMediaUrl(url) {
  if (!url) return "";
  let next = String(url).trim();
  const apiBase = String(API_URL || "").replace(/\/$/, "");
  if (!next || !apiBase) return next;
  next = next.replace(/https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0)(:\d+)?/i, apiBase);
  for (const marker of ["/api/media/", "/uploads/"]) {
    const at = next.lastIndexOf(marker);
    if (at !== -1) return `${apiBase}${next.slice(at)}`;
  }
  if (next.startsWith("/")) return `${apiBase}${next}`;
  return next;
}

export function withMediaUrls(user) {
  if (!user || typeof user !== "object") return user;
  return {
    ...user,
    photoURL: resolveMediaUrl(user.photoURL),
    icPhotoUrl: resolveMediaUrl(user.icPhotoUrl),
    carPhotoUrl: resolveMediaUrl(user.carPhotoUrl),
    imageUrl: resolveMediaUrl(user.imageUrl),
  };
}

export async function prepareJpeg(uri, maxWidth = 900) {
  const { manipulateAsync, SaveFormat } = require("expo-image-manipulator");
  const result = await manipulateAsync(uri, [{ resize: { width: maxWidth } }], {
    compress: 0.72,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!result?.uri) throw new Error("Could not prepare that photo.");
  return result;
}
