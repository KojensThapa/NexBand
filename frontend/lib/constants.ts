export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const EXAM_TYPES = ["ielts", "toefl", "gre", "german", "french"] as const;

export const IELTS_SKILLS = [
  "speaking",
  "writing",
  "reading",
  "listening",
] as const;
