import type {
  CategoryMistakeRow,
  QuestionAnswerMetadataRow,
  QuestionTypeExplanationRow,
  QuestionTypeMistakeRow,
  ScoreRangeFeedbackRow,
} from "../dataset";
import type { SimilarityCalculator, TextNormalizer } from "../relevance";

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

/** Lowercases, trims, and strips trailing sentence punctuation, so a submitted question/prompt can be compared against a catalogued one despite minor formatting differences. */
export function normalizeSentence(value: string): string {
  return value.trim().toLowerCase().replace(/[?.!,;:]+$/g, "").trim();
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

function formatMistakeRow(row: { mistake_name: string; description: string; recommendation: string }): string {
  return `${row.mistake_name}: ${row.description} (Fix: ${row.recommendation})`;
}

/**
 * Generic version of the mistake-matching logic: given any row shape that
 * has mistake_name/description/recommendation plus some "key" column
 * (question_type for Reading/Listening, category for Speaking), returns the
 * rows whose normalized key is in `weakLabels`. `resolveCommonMistakes`
 * below is just this with `getKey` fixed to `row.question_type`.
 */
export function resolveMistakesByKey<T extends { mistake_name: string; description: string; recommendation: string }>(
  rows: readonly T[],
  weakLabels: ReadonlySet<string>,
  getKey: (row: T) => string
): string[] {
  return rows.filter((row) => weakLabels.has(normalizeLabel(getKey(row)))).map(formatMistakeRow);
}

/** Common mistakes for whichever question types the learner performed poorly on, matched by normalized question_type. */
export function resolveCommonMistakes(
  rows: readonly QuestionTypeMistakeRow[],
  weakPerformances: readonly WeakPerformanceLike[]
): string[] {
  const weakLabels = new Set(
    weakPerformances.flatMap((performance) => [normalizeLabel(performance.type), normalizeLabel(performance.label)])
  );

  return resolveMistakesByKey(rows, weakLabels, (row) => row.question_type);
}

/** Common mistakes for whichever score categories (Grammar, Vocabulary, Coherence, Task Response, ...) came out low, matched by normalized category. Used by Speaking and Writing, which key their mistakes by category rather than by question_type. */
export function resolveCategoryMistakes(
  rows: readonly CategoryMistakeRow[],
  weakCategories: ReadonlySet<string>
): string[] {
  return resolveMistakesByKey(rows, weakCategories, (row) => row.category);
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

const NOT_ASSESSED_PERFORMANCE_LEVEL = "Not Assessed";

export interface ScoreRangeFeedback {
  overallFeedback: string;
  performanceLevel: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

/**
 * Resolves the "overall band" feedback for a score, from a
 * ScoreRangeFeedbackRow dataset (listening_feedback.csv,
 * speaking_feedback.csv, and writing_feedback.csv all share this exact
 * column layout). Every field gracefully defaults to empty when no row's
 * range contains the score.
 */
export function resolveScoreRangeFeedback(rows: readonly ScoreRangeFeedbackRow[], score: number): ScoreRangeFeedback {
  const row = findRowInScoreRange(rows, score, (item) => item.score_min, (item) => item.score_max);

  return {
    overallFeedback: row?.overall_feedback ?? "",
    performanceLevel: row?.performance_level ?? NOT_ASSESSED_PERFORMANCE_LEVEL,
    strengths: splitList(row?.strengths ?? ""),
    weaknesses: splitList(row?.weaknesses ?? ""),
    recommendations: splitList(row?.recommendations ?? ""),
  };
}

export interface TextCandidate {
  id: string;
  text: string;
  label?: string;
  reason?: string;
}

export interface ClosestTextMatch {
  id: string;
  text: string;
  label?: string;
  reason?: string;
  similarity: number;
}

/**
 * Finds whichever candidate's text is most similar (by rule-based token
 * overlap, via RelevanceEngine's own SimilarityCalculator strategy) to the
 * target tokens. Used to find the closest sample answer, or the closest
 * labeled training example, for a response — reusing RelevanceEngine's
 * comparison logic rather than re-implementing it.
 */
export function findClosestTextMatch(
  targetTokens: readonly string[],
  candidates: readonly TextCandidate[],
  normalizer: TextNormalizer,
  similarityCalculator: SimilarityCalculator
): ClosestTextMatch | undefined {
  let best: ClosestTextMatch | undefined;

  for (const candidate of candidates) {
    const candidateTokens = normalizer.tokenize(candidate.text);
    const similarity = similarityCalculator.calculate([...targetTokens], [{ tokens: candidateTokens }]);
    if (!best || similarity > best.similarity) {
      best = { id: candidate.id, text: candidate.text, label: candidate.label, reason: candidate.reason, similarity };
    }
  }

  return best && best.similarity > 0 ? best : undefined;
}
