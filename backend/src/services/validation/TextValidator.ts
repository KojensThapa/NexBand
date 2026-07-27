import type { InvalidResponseRow } from "../dataset";

import type { ResponseValidator } from "./interfaces";
import type { ValidationOptions, ValidationStatistics } from "./types";

const MIN_LETTER_RATIO_FOR_ENGLISH = 0.5;
const RANDOM_TEXT_ERROR_THRESHOLD = 0.6;
const RANDOM_TEXT_WARNING_THRESHOLD = 0.35;
const REPEATED_WORD_WARNING_THRESHOLD = 0.3;
const REPEATED_CHARACTER_RUN_PATTERN = /(.)\1{4,}/;

/**
 * Turns raw text plus already-computed statistics into a list of errors and
 * warnings. This is the one place that owns the actual quality thresholds
 * (minimum word count, how repetitive is "too repetitive", etc.) — every
 * other class in this module only measures or scores the text.
 *
 * Pure and synchronous: it never touches DatasetService itself. The caller
 * (ValidationEngine) resolves `knownInvalidResponses` ahead of time and
 * passes it in as plain data, which keeps this class trivially testable
 * with hand-written fixtures.
 */
export class TextValidator implements ResponseValidator {
  validate(
    text: string,
    statistics: ValidationStatistics,
    options: Required<ValidationOptions>,
    knownInvalidResponses: InvalidResponseRow[]
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      errors.push("Response is empty.");
      return { errors, warnings };
    }

    this.checkKnownInvalidResponse(trimmed, knownInvalidResponses, errors);
    this.checkWordCount(statistics, options, errors);
    this.checkSentenceCount(statistics, options, errors);
    this.checkEnglishLikeInput(trimmed, errors);
    this.checkRepeatedCharacters(trimmed, errors);
    this.checkRepeatedWords(statistics, warnings);
    this.checkRandomText(statistics, errors, warnings);
    this.checkFormatting(text, statistics, warnings);

    return { errors, warnings };
  }

  private checkKnownInvalidResponse(
    trimmed: string,
    knownInvalidResponses: InvalidResponseRow[],
    errors: string[]
  ): void {
    const normalized = trimmed.toLowerCase();
    const match = knownInvalidResponses.find((row) => row.response.trim().toLowerCase() === normalized);
    if (match) {
      errors.push(`Response matches a known invalid pattern: ${match.reason}.`);
    }
  }

  private checkWordCount(
    statistics: ValidationStatistics,
    options: Required<ValidationOptions>,
    errors: string[]
  ): void {
    if (statistics.wordCount < options.minWordCount) {
      errors.push(
        `Response is too short: ${statistics.wordCount} word(s), minimum is ${options.minWordCount}.`
      );
    }

    if (statistics.wordCount > options.maxWordCount) {
      errors.push(
        `Response is too long: ${statistics.wordCount} word(s), maximum is ${options.maxWordCount}.`
      );
    }
  }

  private checkSentenceCount(
    statistics: ValidationStatistics,
    options: Required<ValidationOptions>,
    errors: string[]
  ): void {
    if (statistics.sentenceCount < options.minSentenceCount) {
      errors.push(
        `Response has too few sentences: ${statistics.sentenceCount}, minimum is ${options.minSentenceCount}.`
      );
    }
  }

  private checkEnglishLikeInput(trimmed: string, errors: string[]): void {
    const nonWhitespace = trimmed.replace(/\s/g, "");
    if (nonWhitespace.length === 0) {
      return;
    }

    const letterCount = (nonWhitespace.match(/[A-Za-z]/g) ?? []).length;
    const ratio = letterCount / nonWhitespace.length;

    if (ratio < MIN_LETTER_RATIO_FOR_ENGLISH) {
      errors.push("Response does not appear to contain valid English text.");
    }
  }

  private checkRepeatedCharacters(trimmed: string, errors: string[]): void {
    if (REPEATED_CHARACTER_RUN_PATTERN.test(trimmed)) {
      errors.push("Response contains excessive repeated characters.");
    }
  }

  private checkRepeatedWords(statistics: ValidationStatistics, warnings: string[]): void {
    if (statistics.repeatedWordRatio >= REPEATED_WORD_WARNING_THRESHOLD) {
      const percentage = Math.round(statistics.repeatedWordRatio * 100);
      warnings.push(`Response repeats the same words excessively (${percentage}% of content words).`);
    }
  }

  private checkRandomText(statistics: ValidationStatistics, errors: string[], warnings: string[]): void {
    if (statistics.randomTextScore >= RANDOM_TEXT_ERROR_THRESHOLD) {
      errors.push("Response appears to be random or meaningless text.");
    } else if (statistics.randomTextScore >= RANDOM_TEXT_WARNING_THRESHOLD) {
      warnings.push("Response may contain unclear or low-quality text.");
    }
  }

  private checkFormatting(rawText: string, statistics: ValidationStatistics, warnings: string[]): void {
    if (/\n{3,}/.test(rawText)) {
      warnings.push("Response contains excessive blank lines.");
    }

    // eslint-disable-next-line no-control-regex -- deliberately scanning for stray control characters
    if (/[\x00-\x08\x0e-\x1f]/.test(rawText)) {
      warnings.push("Response contains unusual control characters.");
    }

    if (statistics.wordCount >= 5 && !/[.!?]/.test(rawText)) {
      warnings.push("Response is missing sentence-ending punctuation.");
    }
  }
}
