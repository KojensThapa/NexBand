import type { GrammarResult } from "./types";

/** The grammar score comes exclusively from the Grammar Provider. */
export function calculateGrammarScore(grammarResult: GrammarResult): number {
  if (!Number.isFinite(grammarResult.score)) return 0;
  const score = grammarResult.score > 9 ? (grammarResult.score / 100) * 9 : grammarResult.score;
  return Number(Math.max(0, Math.min(9, score)).toFixed(2));
}

