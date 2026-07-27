import type { QuestionAnswerMetadataRow, QuestionTypeExplanationRow, QuestionTypeMistakeRow } from "../dataset";

/**
 * Small, generic pieces genuinely duplicated between ReadingFeedbackService
 * and ListeningFeedbackService, extracted here because both modules'
 * question-type mistake/explanation/answer datasets turned out to share the
 * exact same column layout (see QuestionTypeMistakeRow,
 * QuestionTypeExplanationRow, and QuestionAnswerMetadataRow in the dataset
 * module). Nothing algorithm-specific lives here — no scoring, no band
 * calculation, no evaluation logic of any kind.
 */

/** The minimal shape of a `QuestionTypePerformance`-like entry this module needs, common to both Reading's and Listening's evaluation results. */
export interface WeakPerformanceLike {
  type: string;
  label: string;
  accuracy: number | null;
}

/** The minimal shape needed to bridge a question id to its question type, common to ReadingQuestionRow and ListeningQuestionRow. */
export interface QuestionIdTypeRow {
  question_id: string;
  question_type: string;
}

export interface QuestionTypeExplanationResult<TType extends string> {
  type: TType;
  label: string;
  explanations: string[];
  acceptedAnswers?: string[];
}

/** Collapses case/spacing/punctuation differences so "TRUE_FALSE_NOT_GIVEN", "True / False / Not Given", and "True/False/Not Given" all compare equal. */
export function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[\s/_-]+/g, " ");
}

function parseScoreBound(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function isWithinRange(score: number, minText: string, maxText: string): boolean {
  const min = parseScoreBound(minText);
  const max = parseScoreBound(maxText);
  return min !== undefined && max !== undefined && score >= min && score <= max;
}

/** Finds the first row whose min/max score-range columns contain `score`, given accessors for the (differently-named) range columns. */
export function findRowInScoreRange<T>(
  rows: readonly T[],
  score: number,
  getMin: (row: T) => string,
  getMax: (row: T) => string
): T | undefined {
  return rows.find((row) => isWithinRange(score, getMin(row), getMax(row)));
}

/** Splits a semicolon-separated cell (e.g. a feedback row's strengths/weaknesses/recommendations list) into trimmed, non-empty items. */
export function splitList(value: string): string[] {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Splits an accepted-answers cell, tolerating semicolon, comma, or pipe separators, into trimmed, non-empty items. */
export function splitAcceptableAnswers(value: string): string[] {
  return value
    .split(/[;,|]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Common mistakes for whichever question types the learner performed poorly on, matched by normalized question_type. */
export function resolveCommonMistakes(
  rows: readonly QuestionTypeMistakeRow[],
  weakPerformances: readonly WeakPerformanceLike[]
): string[] {
  const weakLabels = new Set(
    weakPerformances.flatMap((performance) => [normalizeLabel(performance.type), normalizeLabel(performance.label)])
  );

  return rows
    .filter((row) => weakLabels.has(normalizeLabel(row.question_type)))
    .map((row) => `${row.mistake_name}: ${row.description} (Fix: ${row.recommendation})`);
}

/**
 * Explanations for each weak question type, matched by normalized
 * question_type, plus accepted answers for that type's questions —
 * resolved by bridging `questionRows` (question_id -> question_type) into
 * `answerRows` (question_id -> acceptable_answers).
 */
export function resolveQuestionTypeExplanations<TType extends string>(
  weakPerformances: readonly { type: TType; label: string }[],
  questionRows: readonly QuestionIdTypeRow[],
  explanationRows: readonly QuestionTypeExplanationRow[],
  answerRows: readonly QuestionAnswerMetadataRow[]
): QuestionTypeExplanationResult<TType>[] {
  return weakPerformances.map((performance) => {
    const normalizedType = normalizeLabel(performance.type);
    const normalizedLabel = normalizeLabel(performance.label);

    const explanations = explanationRows
      .filter((row) => {
        const normalizedRowType = normalizeLabel(row.question_type);
        return normalizedRowType === normalizedType || normalizedRowType === normalizedLabel;
      })
      .map((row) => `${row.title}: ${row.description} Tip: ${row.common_tip}`);

    const questionIds = new Set(
      questionRows.filter((row) => normalizeLabel(row.question_type) === normalizedType).map((row) => row.question_id)
    );

    const acceptedAnswers = answerRows
      .filter((row) => questionIds.has(row.question_id))
      .flatMap((row) => splitAcceptableAnswers(row.acceptable_answers));

    return {
      type: performance.type,
      label: performance.label,
      explanations,
      ...(acceptedAnswers.length > 0 ? { acceptedAnswers } : {}),
    };
  });
}
