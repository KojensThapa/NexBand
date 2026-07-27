import type { TextStatisticsCalculator } from "./interfaces";
import type { ValidationStatistics } from "./types";

/** Matches word-like tokens, allowing internal apostrophes/hyphens (e.g. "don't", "well-known") without splitting them. */
const WORD_PATTERN = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g;

/** Sentence boundary: one or more terminal punctuation marks followed by whitespace or end of string. */
const SENTENCE_SPLIT_PATTERN = /[.!?]+(?:\s+|$)/;

/**
 * Very common English function words are excluded from the repeated-word
 * count. Natural writing legitimately reuses "the", "a", "is", etc. dozens
 * of times; counting that as "repetition" would flag every normal response.
 * What we actually want to catch is a user repeating the same *content*
 * word far more than natural writing would (e.g. "good good good nice
 * topic topic topic").
 */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "so", "because",
  "of", "in", "on", "at", "to", "for", "with", "as", "by", "from",
  "is", "are", "was", "were", "be", "been", "being", "am",
  "i", "you", "he", "she", "it", "we", "they", "this", "that", "these", "those",
  "my", "your", "his", "her", "its", "our", "their",
  "do", "does", "did", "have", "has", "had", "not", "no",
]);

/**
 * Computes descriptive statistics about a piece of text: how many words and
 * sentences it has, how long its words are on average, and how repetitive
 * its vocabulary is. Has exactly one responsibility — measuring text — and
 * makes no judgement about whether those measurements are good or bad;
 * TextValidator turns them into errors/warnings against configured
 * thresholds.
 */
export class StatisticsCalculator implements TextStatisticsCalculator {
  calculate(text: string): Omit<ValidationStatistics, "randomTextScore"> {
    const words = this.extractWords(text);

    return {
      wordCount: words.length,
      sentenceCount: this.countSentences(text),
      averageWordLength: this.averageWordLength(words),
      repeatedWordRatio: this.repeatedWordRatio(words),
    };
  }

  private extractWords(text: string): string[] {
    return text.match(WORD_PATTERN) ?? [];
  }

  private averageWordLength(words: string[]): number {
    if (words.length === 0) {
      return 0;
    }

    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return this.round(totalLength / words.length);
  }

  private repeatedWordRatio(words: string[]): number {
    if (words.length === 0) {
      return 0;
    }

    const frequency = new Map<string, number>();
    for (const word of words) {
      const normalized = word.toLowerCase();
      if (STOP_WORDS.has(normalized)) {
        continue;
      }
      frequency.set(normalized, (frequency.get(normalized) ?? 0) + 1);
    }

    let extraOccurrences = 0;
    for (const count of frequency.values()) {
      if (count > 1) {
        extraOccurrences += count - 1;
      }
    }

    return this.round(extraOccurrences / words.length);
  }

  private countSentences(text: string): number {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return 0;
    }

    const segments = trimmed
      .split(SENTENCE_SPLIT_PATTERN)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    // A response with no terminal punctuation at all is still one sentence
    // worth of content; TextValidator flags the missing punctuation
    // separately as a formatting issue.
    return segments.length > 0 ? segments.length : 1;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
