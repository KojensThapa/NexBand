import { RelevancePredictor } from "../ml";

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
 *
 * `relevant` and `relevanceScore` prefer the ML-based `RelevancePredictor`
 * (predict_relevance.py, spawned via the Python integration layer), using
 * the topic's source text as the question and `input.response` as the
 * response. Every other field — keywordCoverage, sampleSimilarity,
 * matchedKeywords, missingKeywords, unexpectedKeywords, warnings — always
 * comes from the rule-based pipeline (TopicAnalyzer / KeywordMatcher /
 * SimilarityCalculator) regardless of whether ML succeeded, since the ML
 * model has no equivalent for that richer, explainable detail. If the
 * predictor throws for *any* reason — Python missing, a timed-out process,
 * invalid JSON, a missing model/vectorizer, or any other error — the
 * failure is swallowed here and `relevant`/`relevanceScore` fall back to
 * the existing rule-based weighted score. Callers never see the ML
 * failure; they only ever see a fully-populated `RelevanceResult`.
 */
export class RelevanceEngine {
  private readonly options: Required<RelevanceEngineOptions>;

  constructor(
    private readonly topicProfileProvider: TopicProfileProvider,
    private readonly normalizer: TextNormalizer = new ResponseNormalizer(),
    private readonly keywordMatcher: KeywordMatchingStrategy = new KeywordMatcher(),
    private readonly similarityCalculator: SimilarityCalculator = new RuleBasedSimilarityCalculator(),
    options: RelevanceEngineOptions = {},
    private readonly relevancePredictor: RelevancePredictor = new RelevancePredictor()
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

    const ruleBasedScore = this.round(
      keywordResult.coverage * this.options.keywordCoverageWeight +
        sampleSimilarity * this.options.sampleSimilarityWeight
    );

    const { relevant, relevanceScore } = await this.resolveRelevance(
      profile.sourceText,
      input.response,
      ruleBasedScore
    );

    return {
      relevant,
      relevanceScore,
      keywordCoverage: keywordResult.coverage,
      sampleSimilarity,
      matchedKeywords: keywordResult.matchedKeywords,
      missingKeywords: keywordResult.missingKeywords,
      unexpectedKeywords: keywordResult.unexpectedKeywords,
      warnings,
    };
  }

  /**
   * Tries the ML predictor first, using the topic/question's source text
   * and the raw response exactly as predict_relevance.py expects them.
   * `relevanceScore` becomes the model's confidence in whichever verdict it
   * gave, rounded to match the rule-based score's precision. Any failure —
   * of any kind — falls back to the existing keyword/similarity-weighted
   * score so relevance judging never breaks because Python did.
   */
  private async resolveRelevance(
    questionText: string,
    response: string,
    ruleBasedScore: number
  ): Promise<{ relevant: boolean; relevanceScore: number }> {
    try {
      const prediction = await this.relevancePredictor.predict(questionText, response);
      return { relevant: prediction.relevant, relevanceScore: this.round(prediction.confidence) };
    } catch {
      return { relevant: ruleBasedScore >= this.options.relevanceThreshold, relevanceScore: ruleBasedScore };
    }
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
