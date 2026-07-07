export const SESSION_COOKIE_NAME = "nexband_session";

export function setSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=604800; SameSite=Lax`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
