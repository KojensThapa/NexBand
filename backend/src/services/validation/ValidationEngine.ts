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
 * implementation of any single piece, most notably RandomTextDetector —
 * can substitute their own without touching this class.
 */
export class ValidationEngine {
  constructor(
    private readonly invalidResponseProvider: InvalidResponseProvider,
    private readonly statisticsCalculator: TextStatisticsCalculator = new StatisticsCalculator(),
    private readonly randomTextDetector: RandomTextScorer = new RandomTextDetector(),
    private readonly textValidator: ResponseValidator = new TextValidator()
  ) {}

  async validate(text: string, target: ValidationTarget, options?: ValidationOptions): Promise<ValidationResult> {
    const resolvedOptions: Required<ValidationOptions> = {
      ...DEFAULT_OPTIONS[target],
      ...options,
    };

    const baseStatistics = this.statisticsCalculator.calculate(text);
    const randomTextScore = this.randomTextDetector.detect(text);
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

  private getKnownInvalidResponses(target: ValidationTarget) {
    return target === "writing"
      ? this.invalidResponseProvider.getWritingInvalidResponses()
      : this.invalidResponseProvider.getSpeakingInvalidResponses();
  }
}
