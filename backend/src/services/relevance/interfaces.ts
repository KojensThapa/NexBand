import type {
  SpeakingKeywordRow,
  SpeakingQuestionRow,
  SpeakingSampleRow,
  WritingKeywordRow,
  WritingSampleRow,
  WritingTopicRow,
} from "../dataset";

import type { KeywordEntry, RelevanceTarget, SampleEntry, KeywordMatchResult, TopicProfile } from "./types";

/**
 * The only slice of DatasetService the Relevance Engine is allowed to see:
 * the six question/keyword/sample getters for Speaking and Writing.
 * Depending on this narrow interface rather than the concrete
 * DatasetService (Interface Segregation + Dependency Inversion) means the
 * real DatasetService satisfies it structurally with no adapter needed.
 */
export interface RelevanceDatasetProvider {
  getSpeakingQuestions(): Promise<SpeakingQuestionRow[]>;
  getSpeakingKeywords(): Promise<SpeakingKeywordRow[]>;
  getSpeakingSamples(): Promise<SpeakingSampleRow[]>;
  getWritingTopics(): Promise<WritingTopicRow[]>;
  getWritingKeywords(): Promise<WritingKeywordRow[]>;
  getWritingSamples(): Promise<WritingSampleRow[]>;
}

/** Lowercases, strips punctuation, trims/collapses whitespace, and splits text into word tokens. Pure, no I/O. */
export interface TextNormalizer {
  normalize(text: string): string;
  tokenize(text: string): string[];
}

/** Resolves a question/topic id into its expected keywords and sample answers, using DatasetService (via RelevanceDatasetProvider) under the hood. */
export interface TopicProfileProvider {
  getProfile(target: RelevanceTarget, id: string): Promise<TopicProfile>;
}

/** Compares a response's tokens against the expected keywords for the topic. Pure, synchronous, no I/O. */
export interface KeywordMatchingStrategy {
  match(responseTokens: string[], expectedKeywords: KeywordEntry[]): KeywordMatchResult;
}

/**
 * Scores how similar a response is to known sample answers, from 0 (no
 * overlap) to 1 (near-identical). This is the one collaborator explicitly
 * designed to be replaced later: today `RuleBasedSimilarityCalculator`
 * (in SimilarityCalculator.ts) implements this with token-overlap
 * similarity; a future `MLSimilarityCalculator` could implement the same
 * interface with an embedding- or model-based comparison, and nothing
 * else in the Relevance Engine — or any calling code — would change.
 */
export interface SimilarityCalculator {
  calculate(responseTokens: string[], samples: SampleEntry[]): number;
}
