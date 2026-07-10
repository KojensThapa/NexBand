export const ADMIN_SESSION_COOKIE_NAME = "nexband_admin_session";

export function setAdminSessionCookie() {
  document.cookie = `${ADMIN_SESSION_COOKIE_NAME}=1; path=/; max-age=604800; SameSite=Lax`;
}

export function clearAdminSessionCookie() {
  document.cookie = `${ADMIN_SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
