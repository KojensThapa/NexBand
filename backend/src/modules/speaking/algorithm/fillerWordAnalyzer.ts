import type { FillerWordAnalysis } from "./types";

const FILLER_PHRASES = ["you know", "actually", "um", "uh", "like"] as const;

function countPhrase(transcript: string, phrase: string): number {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (transcript.match(new RegExp(`\\b${escaped}\\b`, "gi")) ?? []).length;
}

/** Counts fillers without mutating the transcript or relying on an AI model. */
export function analyzeFillerWords(transcript: string, totalWords?: number): FillerWordAnalysis {
  const fillerWords = FILLER_PHRASES.map((word) => ({ word, count: countPhrase(transcript, word) }))
    .filter((item) => item.count > 0);
  const count = fillerWords.reduce((total, item) => total + item.count, 0);
  const wordCount = totalWords ?? (transcript.match(/[a-z]+(?:'[a-z]+)?/gi) ?? []).length;
  // Frequent fillers reduce the fluency criterion by at most two IELTS bands.
  const penalty = wordCount === 0 ? 0 : Math.min(2, Number(((count / wordCount) * 8).toFixed(2)));

  return { fillerWords, count, penalty };
}

