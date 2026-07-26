export const API_BASE_URL =
  // A same-origin rewrite works from another device on the local network and
  // avoids browser CORS failures. Set NEXT_PUBLIC_API_URL for a separate API.
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "/backend-api";

/** Turns an API-relative uploaded-file path into a browser-playable URL. */
export function resolveApiUrl(url: string): string {
  if (/^(?:blob:|data:|https?:\/\/)/i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export const EXAM_TYPES = ["ielts", "toefl", "gre", "german", "french"] as const;

export const IELTS_SKILLS = [
  "speaking",
  "writing",
  "reading",
  "listening",
] as const;
