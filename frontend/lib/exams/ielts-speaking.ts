import type { SpeakingBoardMode } from "@/types/speaking";

export const SPEAKING_PART1_SECONDS = 5 * 60;
export const SPEAKING_PART3_SECONDS = 5 * 60;

export function getSpeakingTaskHref(
  mode: SpeakingBoardMode,
  id: string,
  backHref?: string
): string {
  const base = `/test/ielts/speaking/${mode}/${id}`;
  if (!backHref) return base;
  return `${base}?back=${encodeURIComponent(backHref)}`;
}
