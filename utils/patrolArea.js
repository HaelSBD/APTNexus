export const DEFAULT_AREA_KEYS = ["A", "B", "C", "D"];
export const PATROL_AREAS = DEFAULT_AREA_KEYS;

const DEFAULT_LABELS = { A: "Area A", B: "Area B", C: "Area C", D: "Area D" };

/** Every site uses fixed A–D zones. Labels are not customizable. */
export function fixedSiteAreas() {
  return DEFAULT_AREA_KEYS.map((key) => ({ key, label: DEFAULT_LABELS[key] }));
}

/**
 * Infer patrol area letter from a checkpoint name (A–D only).
 */
export function inferAreaFromName(name) {
  const n = String(name || "").trim().toUpperCase();
  if (!n) return "";
  const explicit = n.match(/\bAREA\s*([A-D])\b/);
  if (explicit) return explicit[1];
  const labeled = n.match(/\b(?:CHECKPOINT|ZONE|BLOCK|WING)\s*([A-D])\b/);
  if (labeled) return labeled[1];
  const leading = n.match(/^([A-D])(?:[\s\-_:./]|$)/);
  if (leading) return leading[1];
  const trailing = n.match(/(?:[\s\-_:./])([A-D])$/);
  if (trailing) return trailing[1];
  return "";
}

export function normalizeAreaKey(value) {
  const key = String(value || "").trim().toUpperCase();
  return DEFAULT_AREA_KEYS.includes(key) ? key : "";
}

/** Prefer stored area on the scan/checkpoint, else infer from name. */
export function checkpointArea(rowOrName) {
  if (rowOrName && typeof rowOrName === "object") {
    return (
      normalizeAreaKey(rowOrName.area) ||
      inferAreaFromName(rowOrName.checkpointName || rowOrName.name || rowOrName.label)
    );
  }
  return inferAreaFromName(rowOrName);
}

export function areaLabel(key, labels) {
  const k = normalizeAreaKey(key);
  if (!k) return "";
  const custom = labels && labels[k];
  return String(custom || DEFAULT_LABELS[k] || `Area ${k}`);
}

export function nextAreaKey(_existing = []) {
  return "";
}

export function normalizeSiteAreas(_list) {
  return fixedSiteAreas();
}

/** Build area keys + labels — always fixed A–D. */
export function catalogFromSites(_sites = []) {
  return { keys: [...DEFAULT_AREA_KEYS], labels: { ...DEFAULT_LABELS }, fromSites: true };
}

export { DEFAULT_LABELS as DEFAULT_AREA_LABELS };
