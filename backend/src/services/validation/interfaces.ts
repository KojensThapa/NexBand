import type { InvalidResponseRow } from "../dataset";

import type { ValidationOptions, ValidationStatistics } from "./types";

/**
 * The only slice of DatasetService the Validation Engine is allowed to see:
 * the curated lists of known-bad sample responses for each module. Depending
 * on this narrow interface rather than the concrete DatasetService keeps the
 * engine decoupled (Interface Segregation + Dependency Inversion) — the real
 * DatasetService already satisfies it structurally, no adapter needed.
 */
export interface InvalidResponseProvider {
  getWritingInvalidResponses(): Promise<InvalidResponseRow[]>;
  getSpeakingInvalidResponses(): Promise<InvalidResponseRow[]>;
}

/** Computes descriptive text statistics. Pure and synchronous: same input always produces the same output, no I/O. */
export interface TextStatisticsCalculator {
  calculate(text: string): Omit<ValidationStatistics, "randomTextScore">;
}

/**
 * Scores how likely a piece of text is to be random/meaningless input,
 * from 0 (reads like ordinary language) to 1 (looks like gibberish).
 * Deliberately a single pure method with no dependencies, so a future
 * machine-learning-based implementation can be swapped in without changing
 * ValidationEngine or any of its other collaborators.
 */
export interface RandomTextScorer {
  detect(text: string): number;
}

/**
 * Applies the business rules (length, formatting, repetition, known-bad
 * matches, etc.) to a response's raw text and already-computed statistics,
 * producing the error/warning messages. Pure and synchronous — any
 * dataset lookups the caller needs are resolved beforehand and passed in
 * as plain data via `knownInvalidResponses`.
 */
export interface ResponseValidator {
  validate(
    text: string,
    statistics: ValidationStatistics,
    options: Required<ValidationOptions>,
    knownInvalidResponses: InvalidResponseRow[]
  ): { errors: string[]; warnings: string[] };
}
