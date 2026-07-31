import { RandomTextPredictor } from "../ml";

import { RandomTextDetector } from "./RandomTextDetector";
import { StatisticsCalculator } from "./StatisticsCalculator";
import { TextValidator } from "./TextValidator";
import type {
  InvalidResponseProvider,
  RandomTextScorer,
  ResponseValidator,
  TextStatisticsCalculator,
} from "./interfaces";
import type { ValidationOptions, ValidationResult, ValidationStatistics, ValidationTarget } from "./types";

/**
 * Fallback thresholds per module when the caller doesn't override them.
 * These are intentionally generic floors, not task-specific IELTS numbers —
 * e.g. Writing Task 1 needs 150+ words and Task 2 needs 250+, so callers
 * that know their task should pass explicit `options` rather than rely on
 * these defaults.
 */
const DEFAULT_OPTIONS: Record<ValidationTarget, Required<ValidationOptions>> = {
  writing: { minWordCount: 50, maxWordCount: 1000, minSentenceCount: 3 },
  speaking: { minWordCount: 10, maxWordCount: 500, minSentenceCount: 1 },
};

/**
 * Entry point for the Validation Engine. Checks the *quality* of a user's
 * raw response before any IELTS evaluation runs — never scores it, never
 * judges relevance to the prompt, never calls an external model. Shared by
 * both the Speaking and Writing modules via the `target` parameter, which
 * only selects default thresholds and which invalid_responses dataset to
 * consult.
 *
 * Every collaborator is injected through the constructor (defaulting to the
 * concrete implementations) so tests — or a future alternate
 * implementation of any single piece — can substitute their own without
 * touching this class.
 *
 * Random-text scoring prefers the ML-based `RandomTextPredictor`
 * (predict_random_text.py, spawned via the Python integration layer). If
 * that predictor throws for *any* reason — Python missing, a timed-out
 * process, invalid JSON, a missing model/vectorizer, or any other error —
 * the failure is swallowed here and scoring falls back to the rule-based
 * `RandomTextDetector`. Callers never see the ML failure; they only ever
 * see a `ValidationResult` with a populated `randomTextScore`.
 */
export class ValidationEngine {
  constructor(
    private readonly invalidResponseProvider: InvalidResponseProvider,
    private readonly statisticsCalculator: TextStatisticsCalculator = new StatisticsCalculator(),
    private readonly randomTextDetector: RandomTextScorer = new RandomTextDetector(),
    private readonly textValidator: ResponseValidator = new TextValidator(),
    private readonly randomTextPredictor: RandomTextPredictor = new RandomTextPredictor()
  ) {}

  async validate(text: string, target: ValidationTarget, options?: ValidationOptions): Promise<ValidationResult> {
    const resolvedOptions: Required<ValidationOptions> = {
      ...DEFAULT_OPTIONS[target],
      ...options,
    };

    const baseStatistics = this.statisticsCalculator.calculate(text);
    const randomTextScore = await this.resolveRandomTextScore(text);
    const statistics: ValidationStatistics = { ...baseStatistics, randomTextScore };

    const knownInvalidResponses = await this.getKnownInvalidResponses(target);

    const { errors, warnings } = this.textValidator.validate(text, statistics, resolvedOptions, knownInvalidResponses);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      statistics,
    };
  }

  /**
   * Tries the ML predictor first and converts its output into the same
   * 0 (ordinary language) .. 1 (gibberish) scale RandomTextDetector uses:
   * the model reports confidence in whichever label it picked, so a
   * confident "normal" verdict (random=false) has its confidence inverted
   * into a low random-text score, while a confident "random" verdict is
   * used directly. Any failure — of any kind — falls back to the
   * rule-based detector so validation never breaks because Python did.
   */
  private async resolveRandomTextScore(text: string): Promise<number> {
    try {
      const prediction = await this.randomTextPredictor.predict(text);
      return prediction.random ? prediction.confidence : 1 - prediction.confidence;
    } catch {
      return this.randomTextDetector.detect(text);
    }
  }

  private getKnownInvalidResponses(target: ValidationTarget) {
    return target === "writing"
      ? this.invalidResponseProvider.getWritingInvalidResponses()
      : this.invalidResponseProvider.getSpeakingInvalidResponses();
  }
}
