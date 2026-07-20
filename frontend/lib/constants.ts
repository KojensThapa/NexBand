export const API_BASE_URL =
  // Keep the browser client aligned with backend/.env and src/server.ts.
  // Set NEXT_PUBLIC_API_URL when the API is deployed elsewhere.
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const EXAM_TYPES = ["ielts", "toefl", "gre", "german", "french"] as const;

export const IELTS_SKILLS = [
  "speaking",
  "writing",
  "reading",
  "listening",
] as const;
