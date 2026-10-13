import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

const TOKEN_KEY = "aptnexus:token";
const authListeners = new Set();

export function onAuthFailure(fn) {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

function notifyAuthFailure(error) {
  authListeners.forEach((fn) => {
    try {
      fn(error);
    } catch {
      // ignore listener errors
    }
  });
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

function filePart(item) {
  return {
    uri: String(item.uri),
    name: item.name || "photo.jpg",
    type: item.type || "image/jpeg",
  };
}

function parseResponse(status, text) {
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (status === 502 || status === 503 || status === 530) {
    throw new Error("APTNexus API is not running on the server (bad gateway).");
  }
  if (typeof text === "string" && (/cannot post|cannot get|cannot put|cannot patch|cannot delete/i.test(text) || text.trim().startsWith("<"))) {
    if (text.trim().startsWith("<")) {
      throw new Error("Could not reach the APTNexus API. Check that the admin API is running.");
    }
  }
  if (status < 200 || status >= 300) {
    const message = data.error || `Request failed (${status}).`;
    const error = new Error(message);
    error.status = status;
    error.code = data.code || "";
    if (error.code === "SESSION_REPLACED" || error.code === "SESSION_EXPIRED") {
      notifyAuthFailure(error);
    }
    throw error;
  }
  return data;
}

function sendMultipart(path, { method = "POST", body, file, files } = {}) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    if (body && typeof body === "object") {
      Object.entries(body).forEach(([key, value]) => {
        if (value != null) form.append(key, String(value));
      });
    }
    if (file?.uri) form.append(file.field || "photo", filePart(file));
    (files || []).forEach((item) => {
      if (item?.uri) form.append(item.field, filePart(item));
    });

    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_URL}${path}`);
    getToken()
      .then((token) => {
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.onload = () => {
          try {
            resolve(parseResponse(xhr.status, xhr.responseText));
          } catch (error) {
            reject(error);
          }
        };
        xhr.onerror = () => reject(new Error("Could not upload. Check your connection and try again."));
        xhr.ontimeout = () => reject(new Error("Upload timed out. Try a smaller photo."));
        xhr.timeout = 60000;
        xhr.send(form);
      })
      .catch(reject);
  });
}

const REQUEST_TIMEOUT_MS = 10000;

export async function request(path, { method = "GET", body, file, files } = {}) {
  if (files || file) return sendMultipart(path, { method, body, file, files });

  const token = await getToken();
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload = undefined;
  if (body != null) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload, signal: controller.signal });
    const text = await res.text();
    return parseResponse(res.status, text);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Cannot reach APTNexus. The API did not respond in time.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  login: (identifier, password, replaceSession = false) =>
    request("/api/auth/login", { method: "POST", body: { identifier, password, replaceSession: Boolean(replaceSession) } }),
  logout: () => request("/api/auth/logout", { method: "POST", body: {} }),
  me: () => request("/api/me"),
  updateMe: (body, file) => request("/api/me", { method: "PATCH", body, file }),
  dutyStatus: () => request("/api/duty/status"),
  clock: (body) => request("/api/duty/clock", { method: "POST", body }),
  patrols: () => request("/api/patrols"),
  scanPatrol: (body) => request("/api/patrols", { method: "POST", body }),
  checkpoints: () => request("/api/checkpoints"),
  createCheckpoint: (body) => request("/api/checkpoints", { method: "POST", body }),
  updateCheckpoint: (id, body) => request(`/api/checkpoints/${encodeURIComponent(id)}`, { method: "PATCH", body }),
  deleteCheckpoint: (id) => request(`/api/checkpoints/${encodeURIComponent(id)}`, { method: "DELETE" }),
  patrolAreas: () => request("/api/patrol-areas"),
  updatePatrolAreas: (body) => request("/api/patrol-areas", { method: "PATCH", body }),
  sites: () => request("/api/sites"),
  createSite: (body, file) =>
    request("/api/sites", { method: "POST", body, file: file ? { field: "photo", ...file } : undefined }),
  updateSite: (id, body, file) =>
    request(`/api/sites/${encodeURIComponent(id)}`, { method: "PATCH", body, file: file ? { field: "photo", ...file } : undefined }),
  deleteSite: (id) => request(`/api/sites/${encodeURIComponent(id)}`, { method: "DELETE" }),
  visitors: () => request("/api/visitors"),
  registerVisitor: (body, files) => request("/api/visitors", { method: "POST", body, files }),
  ping: (body) => request("/api/track/ping", { method: "POST", body }),
  schedules: () => request("/api/schedules"),
  sendFeedback: (body) => request("/api/support", { method: "POST", body }),
  overview: () => request("/api/overview"),
  dutyLogs: () => request("/api/duty"),
  users: () => request("/api/users"),
  user: (id) => request(`/api/users/${encodeURIComponent(id)}`),
  createUser: (body) => request("/api/users", { method: "POST", body }),
  updateUser: (id, body) => request(`/api/users/${encodeURIComponent(id)}`, { method: "PATCH", body }),
  deleteUser: (id) => request(`/api/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
  trails: () => request("/api/trails"),
  notifications: () => request("/api/notifications"),
  readNotification: (id, read = true) => request(`/api/notifications/${encodeURIComponent(id)}`, { method: "PATCH", body: { read } }),
  readAllNotifications: () => request("/api/notifications/read-all", { method: "POST", body: {} }),
  clearAllNotifications: () => request("/api/notifications/clear-all", { method: "POST", body: {} }),
  deleteNotification: (id) => request(`/api/notifications/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
