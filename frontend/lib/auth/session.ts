export const SESSION_COOKIE_NAME = "nexband_session";

export function setSessionCookie(token: string) {
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  document.cookie = "nexband_admin_session=; path=/; max-age=0; SameSite=Lax";
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
