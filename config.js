const PROD_URL = "https://aptnexus.sbd-one.com";

function resolvePublicUrl(value) {
  const raw = String(value || "").trim() || PROD_URL;
  // Release/APK builds must never ship a LAN/localhost API URL.
  if (
    typeof __DEV__ !== "undefined" &&
    !__DEV__ &&
    /^(https?:\/\/)?(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(raw)
  ) {
    return PROD_URL;
  }
  return raw;
}

export const APP_URL = resolvePublicUrl(process.env.EXPO_PUBLIC_APP_URL);
export const API_URL = resolvePublicUrl(process.env.EXPO_PUBLIC_API_URL);
