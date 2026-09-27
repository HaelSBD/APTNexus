export function makeTempPassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function sanitizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

export function latestByGuard(rows = []) {
  const map = new Map();
  [...rows]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .forEach((row) => {
      const key = String(row.guardId || "");
      if (key && !map.has(key)) map.set(key, row);
    });
  return map;
}

export function isClockIn(row) {
  return String(row?.action || "") === "clock_in";
}

export function initialOf(name) {
  return String(name || "U").trim().charAt(0).toUpperCase();
}
