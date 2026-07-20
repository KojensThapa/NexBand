export const ADMIN_SESSION_COOKIE_NAME = "nexband_admin_session";

export function setAdminSessionCookie(token: string) {
  document.cookie = `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  document.cookie = "nexband_session=; path=/; max-age=0; SameSite=Lax";
}

export function clearAdminSessionCookie() {
  document.cookie = `${ADMIN_SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
