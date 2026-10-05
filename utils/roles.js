export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function isSecurityRole(profile) {
  return ["security", "guard", "guardpost"].includes(normalizeRole(profile?.role));
}

export function isSuperAdmin(profile) {
  return normalizeRole(profile?.role) === "superadmin";
}

export function isAdminRole(profile) {
  const role = normalizeRole(profile?.role);
  return role === "admin" || role === "superadmin" || Boolean(profile?.dashboardAccess);
}

export function roleLabel(profile) {
  if (isSuperAdmin(profile)) return "Super Admin";
  if (normalizeRole(profile?.role) === "admin" || profile?.dashboardAccess) return "Admin";
  return "Security";
}
