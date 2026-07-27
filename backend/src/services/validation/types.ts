/** Which module is asking for validation. Each target has different sensible defaults for length/sentence thresholds. */
export type ValidationTarget = "writing" | "speaking";

/**
 * Thresholds the caller can override. Any field left unset falls back to a
 * per-target default (see DEFAULT_OPTIONS in ValidationEngine.ts) — e.g. a
 * Writing Task 1 caller might pass `{ minWordCount: 150 }` while Task 2
 * passes `{ minWordCount: 250 }`, without needing to know the other
 * thresholds.
 */
export interface ValidationOptions {
  minWordCount?: number;
  maxWordCount?: number;
  minSentenceCount?: number;
}

/** Quantitative measurements of the response, independent of any pass/fail judgement. */
export interface ValidationStatistics {
  wordCount: number;
  sentenceCount: number;
  averageWordLength: number;
  repeatedWordRatio: number;
  randomTextScore: number;
}

/**
 * `valid` is true iff `errors` is empty — warnings describe quality issues
 * that are worth surfacing to the user but do not block evaluation.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  statistics: ValidationStatistics;
}
