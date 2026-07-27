import type { SimilarityCalculator as ISimilarityCalculator } from "./interfaces";
import type { SampleEntry } from "./types";

/**
 * Rule-based, no-AI implementation of the SimilarityCalculator interface:
 * plain token-set (Jaccard) overlap between the response and each sample
 * answer, reporting the best match found. No embeddings, no vector search,
 * no model of any kind — just set intersection over union.
 *
 * This is the piece of the Relevance Engine designed to be replaced later.
 * A future `MLSimilarityCalculator` implementing the same
 * `SimilarityCalculator` interface (same one method, same signature) could
 * swap in wherever this class is constructed — e.g. in this module's
 * `index.ts` or in RelevanceEngine's constructor call — with zero changes
 * to RelevanceEngine, KeywordMatcher, TopicAnalyzer, or any calling code
 * in the Speaking/Writing modules.
 */
export class RuleBasedSimilarityCalculator implements ISimilarityCalculator {
  calculate(responseTokens: string[], samples: SampleEntry[]): number {
    if (responseTokens.length === 0 || samples.length === 0) {
      return 0;
    }

    const responseSet = new Set(responseTokens);
    let best = 0;

    for (const sample of samples) {
      const similarity = this.jaccardSimilarity(responseSet, new Set(sample.tokens));
      if (similarity > best) {
        best = similarity;
      }
    }

    return Math.round(best * 100) / 100;
  }

  private jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) {
      return 0;
    }

    let intersectionSize = 0;
    for (const token of a) {
      if (b.has(token)) {
        intersectionSize += 1;
      }
    }

    const unionSize = a.size + b.size - intersectionSize;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
  }
}
