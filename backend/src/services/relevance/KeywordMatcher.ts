import type { KeywordMatchingStrategy } from "./interfaces";
import type { KeywordEntry, KeywordMatchResult } from "./types";

/**
 * Common English function words, excluded when deciding whether a token in
 * the response counts as an "unexpected keyword". Every response contains
 * words like "the" or "is" regardless of topic, so flagging them as
 * unexpected would be noise, not signal.
 */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "so", "because",
  "of", "in", "on", "at", "to", "for", "with", "as", "by", "from",
  "is", "are", "was", "were", "be", "been", "being", "am",
  "i", "you", "he", "she", "it", "we", "they", "this", "that", "these", "those",
  "my", "your", "his", "her", "its", "our", "their",
  "do", "does", "did", "have", "has", "had", "not", "no", "what", "when", "where", "why", "how",
  "can", "could", "would", "should", "will", "shall", "may", "might", "must",
]);

/** Tokens shorter than this are almost never meaningful content words, and are ignored when reporting unexpected keywords. */
const MIN_UNEXPECTED_KEYWORD_LENGTH = 3;

/**
 * Compares the response's tokens against a topic's expected keywords. This
 * class has exactly one responsibility: given tokens and expected keyword
 * entries, decide which were matched, which were missing, which
 * unexpected content words showed up, and the resulting weighted coverage.
 * It never fetches data or normalizes text itself.
 */
export class KeywordMatcher implements KeywordMatchingStrategy {
  match(responseTokens: string[], expectedKeywords: KeywordEntry[]): KeywordMatchResult {
    const tokenSet = new Set(responseTokens);
    const expectedKeywordSet = new Set(expectedKeywords.map((entry) => entry.keyword));

    const matched: KeywordEntry[] = [];
    const missing: KeywordEntry[] = [];

    for (const entry of expectedKeywords) {
      if (tokenSet.has(entry.keyword)) {
        matched.push(entry);
      } else {
        missing.push(entry);
      }
    }

    const unexpectedKeywords = Array.from(tokenSet).filter(
      (token) =>
        token.length >= MIN_UNEXPECTED_KEYWORD_LENGTH &&
        !STOP_WORDS.has(token) &&
        !expectedKeywordSet.has(token)
    );

    return {
      matchedKeywords: matched.map((entry) => entry.keyword),
      missingKeywords: missing.map((entry) => entry.keyword),
      unexpectedKeywords,
      coverage: this.weightedCoverage(matched, expectedKeywords),
    };
  }

  private weightedCoverage(matched: KeywordEntry[], expectedKeywords: KeywordEntry[]): number {
    const totalWeight = expectedKeywords.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight === 0) {
      return 0;
    }

    const matchedWeight = matched.reduce((sum, entry) => sum + entry.weight, 0);
    return Math.round((matchedWeight / totalWeight) * 100) / 100;
  }
}
