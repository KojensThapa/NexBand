import type {
  AIFeedbackSummaryTemplateRow,
  RecommendationTemplateRow,
  ScoreCommentRow,
  StrengthTemplateRow,
  WeaknessTemplateRow,
} from "../dataset";

import type { EvaluationContext } from "./types";

/**
 * The only slice of DatasetService the Feedback Engine is allowed to see.
 * DatasetService exposes ~30 methods across Reading/Listening/Speaking/
 * Writing/Vocabulary; FeedbackEngine only ever needs these five feedback
 * template getters. Depending on this narrow interface instead of the
 * concrete DatasetService class is what keeps the engine decoupled
 * (Interface Segregation + Dependency Inversion): any object that
 * structurally provides these five methods can be injected, and the real
 * DatasetService already does so with no adapter needed.
 */
export interface FeedbackTemplateProvider {
  getStrengthTemplates(): Promise<StrengthTemplateRow[]>;
  getWeaknessTemplates(): Promise<WeaknessTemplateRow[]>;
  getRecommendationTemplates(): Promise<RecommendationTemplateRow[]>;
  getScoreComments(): Promise<ScoreCommentRow[]>;
  getAIFeedbackSummaryTemplates(): Promise<AIFeedbackSummaryTemplateRow[]>;
}

/**
 * Strategy for deciding whether a template row's `condition` column applies
 * to a given evaluation. Pulled out as an interface (rather than a private
 * method on FeedbackEngine) so the condition mini-language can be swapped
 * or extended later without touching the engine itself.
 *
 * Condition strings are simple comparisons against a skill score, e.g.
 * `"grammar>=7"`, `"overallBand<6"`, or an empty string / `"any"` to always
 * match. Multiple comparisons can be combined with `&&`, e.g.
 * `"grammar>=7&&vocabulary>=7"`. Unknown skill names or malformed
 * conditions simply fail to match rather than throwing, since dataset rows
 * may reference skills that a particular module's input does not include.
 */
export interface ConditionMatcher {
  matches(condition: string | undefined | null, context: EvaluationContext): boolean;
}
