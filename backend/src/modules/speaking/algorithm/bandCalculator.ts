import type { BandCriteria } from "./types";

function clampBand(score: number): number {
  return Math.max(0, Math.min(9, score));
}

/** IELTS scores are reported in half bands. */
export function roundToHalfBand(score: number): number {
  return Number((Math.round(clampBand(score) * 2) / 2).toFixed(1));
}

export function calculateOverallBand(criteria: BandCriteria): number {
  const average =
    (criteria.fluencyScore +
      criteria.vocabularyScore +
      criteria.grammarScore +
      criteria.pronunciationScore) /
    4;
  return roundToHalfBand(average);
}

export function cefrFromIeltsBand(overallBand: number): "A1" | "A2" | "B1" | "B2" | "C1" | "C2" {
  if (overallBand >= 8.5) return "C2";
  if (overallBand >= 7) return "C1";
  if (overallBand >= 5.5) return "B2";
  if (overallBand >= 4) return "B1";
  if (overallBand >= 3) return "A2";
  return "A1";
}

