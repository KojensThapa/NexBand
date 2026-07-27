import { KeywordMatcher } from "./KeywordMatcher";
import { ResponseNormalizer } from "./ResponseNormalizer";
import { RuleBasedSimilarityCalculator } from "./SimilarityCalculator";
import type {
  KeywordMatchingStrategy,
  SimilarityCalculator,
  TextNormalizer,
  TopicProfileProvider,
} from "./interfaces";
import type { RelevanceEngineOptions, RelevanceInput, RelevanceResult } from "./types";

const DEFAULT_OPTIONS: Required<RelevanceEngineOptions> = {
  relevanceThreshold: 0.35,
  keywordCoverageWeight: 0.6,
  sampleSimilarityWeight: 0.4,
};

/**
 * Entry point for the Relevance Engine. Decides whether a Speaking
 * transcript or Writing essay actually addresses the question/topic it was
 * given — never IELTS scoring, never grammar/vocabulary/pronunciation
 * judgement. Shared by both modules via the `target` field on the input.
 *
 * Every collaborator is injected through the constructor, defaulting to the
 * current rule-based implementations. In particular, `similarityCalculator`
 * is typed as the `SimilarityCalculator` interface, not the concrete
 * `RuleBasedSimilarityCalculator` — swapping in a future
 * `MLSimilarityCalculator` (or a different `KeywordMatchingStrategy`, or a
 * different `TopicProfileProvider`) requires no change to this class or to
 * anything that calls it, per the ML-upgrade requirement for this engine.
 */
export class RelevanceEngine {
  private readonly options: Required<RelevanceEngineOptions>;

  constructor(
    private readonly topicProfileProvider: TopicProfileProvider,
    private readonly normalizer: TextNormalizer = new ResponseNormalizer(),
    private readonly keywordMatcher: KeywordMatchingStrategy = new KeywordMatcher(),
    private readonly similarityCalculator: SimilarityCalculator = new RuleBasedSimilarityCalculator(),
    options: RelevanceEngineOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async evaluate(input: RelevanceInput): Promise<RelevanceResult> {
    const warnings: string[] = [];

    const profile = await this.topicProfileProvider.getProfile(input.target, input.id);
    if (!profile.found) {
      warnings.push(
        `No ${input.target} question/topic was found for id "${input.id}"; relevance is based on limited data.`
      );
    }
    if (profile.expectedKeywords.length === 0) {
      warnings.push("No expected keywords are available for this question/topic.");
    }
    if (profile.samples.length === 0) {
      warnings.push("No sample answers are available for similarity comparison.");
    }

    const tokens = this.normalizer.tokenize(input.response);
    if (tokens.length === 0) {
      warnings.push("Response contains no recognizable words.");
    }

    const keywordResult = this.keywordMatcher.match(tokens, profile.expectedKeywords);
    const sampleSimilarity = this.similarityCalculator.calculate(tokens, profile.samples);

    const relevanceScore = this.round(
      keywordResult.coverage * this.options.keywordCoverageWeight +
        sampleSimilarity * this.options.sampleSimilarityWeight
    );

    return {
      relevant: relevanceScore >= this.options.relevanceThreshold,
      relevanceScore,
      keywordCoverage: keywordResult.coverage,
      sampleSimilarity,
      matchedKeywords: keywordResult.matchedKeywords,
      missingKeywords: keywordResult.missingKeywords,
      unexpectedKeywords: keywordResult.unexpectedKeywords,
      warnings,
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
