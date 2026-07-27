/** Which module is asking — determines whether `id` is a speaking question_id or a writing topic_id. */
export type RelevanceTarget = "speaking" | "writing";

/**
 * What the engine is asked to judge: a raw response against the question or
 * topic identified by `id`. The engine never scores the response — it only
 * decides whether it addresses what was asked.
 */
export interface RelevanceInput {
  target: RelevanceTarget;
  /** speaking_questions.question_id or writing_topics.topic_id */
  id: string;
  response: string;
}

/** A single expected keyword, normalized to lowercase, with its importance weight (from the CSV, or a fallback default). */
export interface KeywordEntry {
  keyword: string;
  weight: number;
}

/** A sample answer reduced to the tokens needed for similarity comparison. */
export interface SampleEntry {
  tokens: string[];
  bandScore?: number;
}

/**
 * Everything TopicAnalyzer resolves about the target question/topic before
 * any matching happens: whether it was actually found in the dataset, the
 * raw question/prompt text (used to derive fallback keywords when the
 * curated keyword dataset has nothing for this id), the expected keywords,
 * and the sample answers to compare against.
 */
export interface TopicProfile {
  found: boolean;
  sourceText: string;
  expectedKeywords: KeywordEntry[];
  samples: SampleEntry[];
}

export interface KeywordMatchResult {
  matchedKeywords: string[];
  missingKeywords: string[];
  unexpectedKeywords: string[];
  coverage: number;
}

/** Weights used to blend keyword coverage and sample similarity into a single relevanceScore, and the pass/fail cutoff. */
export interface RelevanceEngineOptions {
  relevanceThreshold?: number;
  keywordCoverageWeight?: number;
  sampleSimilarityWeight?: number;
}

export interface RelevanceResult {
  relevant: boolean;
  relevanceScore: number;
  keywordCoverage: number;
  sampleSimilarity: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  unexpectedKeywords: string[];
  warnings: string[];
}
