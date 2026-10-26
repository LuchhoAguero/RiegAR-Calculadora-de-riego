export const SESSION_INVALIDATED = "riegar:session-invalidated";

// Comprobación de UX: la firma y los permisos siempre los valida el backend.
export function tokenExpiresAt(token) {
  try {
    if (typeof token !== "string" || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return null;
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" && Number.isFinite(exp) && Number.isFinite(exp * 1000) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenCurrent(token, now = Date.now()) {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt !== null && expiresAt > now;
}

export function invalidateSession(requestToken) {
  // Una respuesta vieja no invalida un login posterior.
  if (requestToken && localStorage.getItem("token") === requestToken) {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event(SESSION_INVALIDATED));
  }
}
