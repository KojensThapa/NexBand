import { datasetService as defaultDatasetService } from "../dataset";
import type {
  ReadingAnswerRow,
  ReadingCommonMistakeRow,
  ReadingExplanationRow,
  ReadingFeedbackRow,
  ReadingQuestionRow,
} from "../dataset";
import { feedbackEngine as defaultFeedbackEngine } from "../feedback";
import type { EvaluationInput, FeedbackResult } from "../feedback";

import type {
  QuestionTypePerformance,
  ReadingEvaluationResult,
  ReadingQuestionType,
} from "../../modules/reading/algorithm/readingAlgorithm";

/**
 * A question type is treated as "low-performing" at the same 60% accuracy
 * cutoff the Reading algorithm itself uses for `weakAreas`/`recommendations`
 * (see `generateWeakAreas` in readingAlgorithm.ts). Defined independently
 * here — not imported — because this service must not depend on the
 * algorithm's internals; it only reads the already-computed
 * `questionTypePerformance` the algorithm returns.
 */
const LOW_PERFORMANCE_ACCURACY_THRESHOLD = 60;

const NOT_ASSESSED_PERFORMANCE_LEVEL = "Not Assessed";

/**
 * The only slice of DatasetService this service is allowed to see: the five
 * Reading-specific datasets. Depending on this narrow interface rather than
 * the concrete DatasetService (Interface Segregation + Dependency
 * Inversion) means the real DatasetService satisfies it structurally, no
 * adapter needed.
 */
export interface ReadingDatasetProvider {
  getReadingFeedback(): Promise<ReadingFeedbackRow[]>;
  getReadingCommonMistakes(): Promise<ReadingCommonMistakeRow[]>;
  getReadingExplanations(): Promise<ReadingExplanationRow[]>;
  getReadingQuestions(): Promise<ReadingQuestionRow[]>;
  getReadingAnswers(): Promise<ReadingAnswerRow[]>;
}

/** The one FeedbackEngine method this service needs — matches the real FeedbackEngine's public API structurally. */
export interface ReadingFeedbackGenerator {
  generateFeedback(input: EvaluationInput): Promise<FeedbackResult>;
}

export interface QuestionTypeExplanation {
  type: ReadingQuestionType;
  label: string;
  explanations: string[];
  acceptedAnswers?: string[];
}

/**
 * `ReadingEvaluationResult` (the algorithm's output) with its generated
 * strengths/weakAreas/recommendations replaced by dataset-driven values,
 * plus new dataset-driven fields appended. Every existing property is kept,
 * so anything already consuming `ReadingEvaluationResult` keeps working
 * unchanged against this superset.
 */
export interface EnhancedReadingEvaluationResult extends ReadingEvaluationResult {
  overallFeedback: string;
  performanceLevel: string;
  commonMistakes: string[];
  questionTypeExplanations: QuestionTypeExplanation[];
  feedbackSummary: string;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[\s/_-]+/g, " ");
}

function parseScoreBound(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isWithinRange(score: number, minText: string, maxText: string): boolean {
  const min = parseScoreBound(minText);
  const max = parseScoreBound(maxText);
  return min !== undefined && max !== undefined && score >= min && score <= max;
}

/** reading_feedback.csv's strengths/weaknesses/recommendations columns are semicolon-separated lists in a single cell. */
function splitList(value: string): string[] {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function splitAcceptableAnswers(value: string): string[] {
  return value
    .split(/[;,|]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Bridges the existing (untouched) Reading evaluation algorithm to this
 * project's reusable dataset-driven infrastructure. It receives the
 * `ReadingEvaluationResult` the algorithm already computed — scores, bands,
 * section/question-type performance — and turns it into an
 * `EnhancedReadingEvaluationResult` by:
 *
 *  - replacing the algorithm's hardcoded strengths/weakAreas/recommendations
 *    with values combining the shared FeedbackEngine's per-question-type
 *    output (from the generic feedback_templates datasets) with the
 *    overall-band-level lists authored directly in reading_feedback.csv;
 *  - adding an overall feedback sentence and a performance-level label, both
 *    looked up from reading_feedback.csv by the learner's raw score;
 *  - listing common mistakes for whichever question types the learner
 *    performed poorly on, from reading_common_mistakes.csv;
 *  - listing explanations for those same weak question types, from
 *    reading_explanations.csv, plus accepted answers for their questions
 *    (bridged via reading_questions.csv's question_id -> question_type map)
 *    from reading_answers.csv, when available.
 *
 * This class never scores anything and never re-evaluates an answer — it
 * only reads the algorithm's already-computed result and dataset content.
 * Both collaborators are constructor-injected (defaulting to the shared
 * singletons), so a caller can substitute fakes in tests without touching
 * this class.
 */
export class ReadingFeedbackService {
  constructor(
    private readonly datasetProvider: ReadingDatasetProvider = defaultDatasetService,
    private readonly feedbackGenerator: ReadingFeedbackGenerator = defaultFeedbackEngine
  ) {}

  async enrich(result: ReadingEvaluationResult): Promise<EnhancedReadingEvaluationResult> {
    const [feedbackRows, commonMistakeRows, explanationRows, questionRows, answerRows] = await Promise.all([
      this.datasetProvider.getReadingFeedback(),
      this.datasetProvider.getReadingCommonMistakes(),
      this.datasetProvider.getReadingExplanations(),
      this.datasetProvider.getReadingQuestions(),
      this.datasetProvider.getReadingAnswers(),
    ]);

    const weakPerformances = result.questionTypePerformance.filter(
      (performance) =>
        performance.accuracy !== null && performance.accuracy < LOW_PERFORMANCE_ACCURACY_THRESHOLD
    );

    const feedback = await this.feedbackGenerator.generateFeedback(this.buildEvaluationInput(result));
    const overallFeedbackRow = this.findOverallFeedbackRow(feedbackRows, result.correctAnswers);

    return {
      ...result,
      strengths: [...feedback.strengths, ...splitList(overallFeedbackRow?.strengths ?? "")],
      weakAreas: [...feedback.weaknesses, ...splitList(overallFeedbackRow?.weaknesses ?? "")],
      recommendations: [...feedback.recommendations, ...splitList(overallFeedbackRow?.recommendations ?? "")],
      overallFeedback: overallFeedbackRow?.feedback ?? "",
      performanceLevel: overallFeedbackRow?.performance_level ?? NOT_ASSESSED_PERFORMANCE_LEVEL,
      commonMistakes: this.resolveCommonMistakes(commonMistakeRows, weakPerformances),
      questionTypeExplanations: this.resolveQuestionTypeExplanations(
        weakPerformances,
        questionRows,
        explanationRows,
        answerRows
      ),
      feedbackSummary: feedback.summary,
    };
  }

  /** Reading's per-question-type accuracies (0-100) and overall band become the "skill scores" FeedbackEngine matches its templates against. */
  private buildEvaluationInput(result: ReadingEvaluationResult): EvaluationInput {
    const input: EvaluationInput = {
      overallBand: result.overallBand ?? result.estimatedBand ?? 0,
    };

    for (const performance of result.questionTypePerformance) {
      if (performance.accuracy !== null) {
        input[performance.type] = performance.accuracy;
      }
    }

    if (result.attemptAccuracy !== null) {
      input.attemptAccuracy = result.attemptAccuracy;
    }

    return input;
  }

  /** reading_feedback.csv is keyed by the learner's raw correct-answer count out of 40, mirroring the algorithm's own band tables. */
  private findOverallFeedbackRow(rows: ReadingFeedbackRow[], correctAnswers: number): ReadingFeedbackRow | undefined {
    return rows.find((row) => isWithinRange(correctAnswers, row.min_score, row.max_score));
  }

  private resolveCommonMistakes(
    rows: ReadingCommonMistakeRow[],
    weakPerformances: readonly QuestionTypePerformance[]
  ): string[] {
    const weakLabels = new Set(
      weakPerformances.flatMap((performance) => [normalizeLabel(performance.type), normalizeLabel(performance.label)])
    );

    return rows
      .filter((row) => weakLabels.has(normalizeLabel(row.question_type)))
      .map((row) => `${row.mistake_name}: ${row.description} (Fix: ${row.recommendation})`);
  }

  private resolveQuestionTypeExplanations(
    weakPerformances: readonly QuestionTypePerformance[],
    questionRows: ReadingQuestionRow[],
    explanationRows: ReadingExplanationRow[],
    answerRows: ReadingAnswerRow[]
  ): QuestionTypeExplanation[] {
    const weakLabelsByType = new Map(
      weakPerformances.map((performance) => [performance.type, normalizeLabel(performance.label)] as const)
    );

    return weakPerformances.map((performance) => {
      const normalizedType = normalizeLabel(performance.type);
      const normalizedLabel = weakLabelsByType.get(performance.type) ?? normalizedType;

      const explanations = explanationRows
        .filter((row) => {
          const normalizedRowType = normalizeLabel(row.question_type);
          return normalizedRowType === normalizedType || normalizedRowType === normalizedLabel;
        })
        .map((row) => `${row.title}: ${row.description} Tip: ${row.common_tip}`);

      const questionIds = new Set(
        questionRows
          .filter((row) => normalizeLabel(row.question_type) === normalizedType)
          .map((row) => row.question_id)
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
}
