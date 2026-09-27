import { getSettingsSnapshot } from "../context/SettingsContext";
import { t } from "./i18n";

const tr = (key, vars) => t(getSettingsSnapshot()?.language || "en", key, vars);

export function toDate(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativeTime(timestamp) {
  const date = toDate(timestamp);
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return tr("justNow");
  if (mins < 60) return tr(mins === 1 ? "minsAgo" : "minsAgoPlural", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return tr(hours === 1 ? "hoursAgo" : "hoursAgoPlural", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return tr(days === 1 ? "daysAgo" : "daysAgoPlural", { n: days });
  return date.toLocaleDateString();
}

export function formatAuthError(error) {
  const message = String(error?.message || "");
  if (/invalid username or password|security staff only/i.test(message)) {
    return tr("invalidCredentials");
  }
  if (/bad gateway|api is not running/i.test(message)) {
    return tr("cannotReach");
  }
  if (/did not respond in time|network|failed to fetch|timeout|abort/i.test(message)) {
    return tr("cannotReach");
  }
  return message || tr("tryAgainGeneric");
}

export function toLoginEmail(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  if (input.includes("@")) return input;
  return `${input.toLowerCase()}@aptnexus.my`;
}
