import type { TextNormalizer } from "./interfaces";

/** Any character that isn't a Unicode letter, digit, or whitespace is treated as punctuation and stripped. */
const PUNCTUATION_PATTERN = /[^\p{L}\p{N}\s]/gu;
const WHITESPACE_PATTERN = /\s+/g;

/**
 * Normalizes and tokenizes raw response text. This class has exactly one
 * responsibility — turning arbitrary user text into a clean, comparable
 * form — and makes no judgement about relevance, keywords, or similarity.
 * Every other class in this module receives already-normalized tokens
 * rather than doing this work itself.
 */
export class ResponseNormalizer implements TextNormalizer {
  normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(PUNCTUATION_PATTERN, " ")
      .replace(WHITESPACE_PATTERN, " ")
      .trim();
  }

  tokenize(text: string): string[] {
    const normalized = this.normalize(text);
    return normalized.length === 0 ? [] : normalized.split(" ");
  }
}
