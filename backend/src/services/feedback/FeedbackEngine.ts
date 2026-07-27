import { FeedbackBuilder } from "./FeedbackBuilder";
import type { ConditionMatcher, FeedbackTemplateProvider } from "./interfaces";
import type { EvaluationContext, EvaluationInput, FeedbackResult } from "./types";

const CLAUSE_PATTERN = /^\s*([a-zA-Z_]\w*)\s*(>=|<=|==|!=|>|<)\s*(-?\d+(?:\.\d+)?)\s*$/;
const ALWAYS_MATCH_TOKENS = new Set(["", "any", "default", "*"]);

/**
 * Default implementation of the condition mini-language described on
 * ConditionMatcher: comparisons like `"grammar>=7"`, optionally combined
 * with `&&`, evaluated against the skill scores supplied for this
 * evaluation. This is template selection, not IELTS scoring — the numbers
 * being compared were already computed by an evaluation module; this class
 * only decides which pre-written sentence applies to them.
 */
export class DefaultConditionMatcher implements ConditionMatcher {
  matches(condition: string | undefined | null, context: EvaluationContext): boolean {
    if (condition == null || ALWAYS_MATCH_TOKENS.has(condition.trim().toLowerCase())) {
      return true;
    }

    return condition
      .split("&&")
      .every((clause) => this.matchesClause(clause, context));
  }

  private matchesClause(clause: string, context: EvaluationContext): boolean {
    const match = CLAUSE_PATTERN.exec(clause);
    if (!match) {
      // Malformed or unrecognized clause: fail closed rather than throwing,
      // so one bad dataset row can't crash feedback generation.
      return false;
    }

    const [, skill, operator, thresholdText] = match as unknown as [string, string, string, string];
    const actual = context[skill];
    if (actual === undefined) {
      return false;
    }

    const threshold = Number(thresholdText);

    switch (operator) {
      case ">=":
        return actual >= threshold;
      case "<=":
        return actual <= threshold;
      case ">":
        return actual > threshold;
      case "<":
        return actual < threshold;
      case "==":
        return actual === threshold;
      case "!=":
        return actual !== threshold;
      default:
        return false;
    }
  }
}

/** Replaces `{{skill}}` placeholders in a template with values from context. Unknown placeholders are left as-is. */
function interpolate(template: string, context: EvaluationContext): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, key: string) =>
    key in context ? String(context[key]) : placeholder
  );
}

/** Parses a CSV score bound; returns undefined if it isn't a valid number. */
function parseBound(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isWithinRange(score: number, minText: string, maxText: string): boolean {
  const min = parseBound(minText);
  const max = parseBound(maxText);
  return min !== undefined && max !== undefined && score >= min && score <= max;
}

function isOverallSkillRow(skill: string): boolean {
  return skill.trim().toLowerCase() === "overall";
}

/**
 * Turns an already-computed evaluation (scores per skill + overallBand)
 * into user-facing feedback text, sourced entirely from the
 * feedback_templates datasets. It never scores, evaluates, or judges an
 * IELTS response itself — that happens upstream in each module's own
 * algorithm; this class only decides which pre-written template applies
 * and fills in its placeholders.
 *
 * Depends on FeedbackTemplateProvider (an interface), not the concrete
 * DatasetService, and takes its ConditionMatcher strategy via constructor
 * injection — both swappable for tests or for a future condition syntax
 * without changing this class.
 */
export class FeedbackEngine {
  constructor(
    private readonly templateProvider: FeedbackTemplateProvider,
    private readonly conditionMatcher: ConditionMatcher = new DefaultConditionMatcher()
  ) {}

  async generateFeedback(input: EvaluationInput): Promise<FeedbackResult> {
    const context: EvaluationContext = { ...input };

    const [strengthRows, weaknessRows, recommendationRows, scoreCommentRows, summaryRows] = await Promise.all([
      this.templateProvider.getStrengthTemplates(),
      this.templateProvider.getWeaknessTemplates(),
      this.templateProvider.getRecommendationTemplates(),
      this.templateProvider.getScoreComments(),
      this.templateProvider.getAIFeedbackSummaryTemplates(),
    ]);

    const builder = new FeedbackBuilder();

    for (const row of strengthRows) {
      if (this.conditionMatcher.matches(row.condition, context)) {
        builder.addStrength(interpolate(row.template, context));
      }
    }

    for (const row of weaknessRows) {
      if (this.conditionMatcher.matches(row.condition, context)) {
        builder.addWeakness(interpolate(row.template, context));
      }
    }

    for (const row of recommendationRows) {
      if (this.conditionMatcher.matches(row.condition, context)) {
        builder.addRecommendation(interpolate(row.recommendation, context));
      }
    }

    // Score comments and the summary describe the evaluation as a whole,
    // so only rows explicitly marked for the "overall" skill are eligible —
    // per-skill rows in the same file are for future use cases, not this one.
    const scoreCommentRow = scoreCommentRows.find(
      (row) => isOverallSkillRow(row.skill) && isWithinRange(input.overallBand, row.score_min, row.score_max)
    );
    if (scoreCommentRow) {
      builder.setScoreComment(interpolate(scoreCommentRow.comment, context));
    }

    const summaryRow = summaryRows.find(
      (row) => isOverallSkillRow(row.skill) && this.conditionMatcher.matches(row.condition, context)
    );
    if (summaryRow) {
      builder.setSummary(interpolate(summaryRow.template, context));
    }

    return builder.build();
  }
}
