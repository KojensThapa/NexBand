import { datasetService } from "../dataset";

import { KeywordMatcher } from "./KeywordMatcher";
import { RelevanceEngine } from "./RelevanceEngine";
import { ResponseNormalizer } from "./ResponseNormalizer";
import { RuleBasedSimilarityCalculator } from "./SimilarityCalculator";
import { TopicAnalyzer } from "./TopicAnalyzer";

export { RelevanceEngine } from "./RelevanceEngine";
export { KeywordMatcher } from "./KeywordMatcher";
export { ResponseNormalizer } from "./ResponseNormalizer";
export { RuleBasedSimilarityCalculator } from "./SimilarityCalculator";
export { TopicAnalyzer } from "./TopicAnalyzer";
export type {
  RelevanceDatasetProvider,
  TextNormalizer,
  TopicProfileProvider,
  KeywordMatchingStrategy,
  SimilarityCalculator,
} from "./interfaces";
export type {
  RelevanceTarget,
  RelevanceInput,
  RelevanceResult,
  RelevanceEngineOptions,
  KeywordEntry,
  SampleEntry,
  TopicProfile,
  KeywordMatchResult,
} from "./types";

const sharedNormalizer = new ResponseNormalizer();

/**
 * Shared singleton wired to the shared DatasetService instance, for modules
 * that just need "the" relevance engine. Modules that want a different
 * dataset source, or a swapped-in collaborator (e.g. in tests, or a future
 * MLSimilarityCalculator), can still construct
 * `new RelevanceEngine(customProfileProvider, ...)` directly.
 */
export const relevanceEngine = new RelevanceEngine(
  new TopicAnalyzer(datasetService, sharedNormalizer),
  sharedNormalizer,
  new KeywordMatcher(),
  new RuleBasedSimilarityCalculator()
);
