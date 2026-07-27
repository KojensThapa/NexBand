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
import {
  findRowInScoreRange,
  resolveCommonMistakes,
  resolveQuestionTypeExplanations,
  splitList,
  type QuestionTypeExplanationResult,
} from "../shared/datasetFeedbackUtils";

import type { ReadingEvaluationResult, ReadingQuestionType } from "../../modules/reading/algorithm/readingAlgorithm";

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

export type QuestionTypeExplanation = QuestionTypeExplanationResult<ReadingQuestionType>;

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
 * The question-type mistake/explanation/answer matching logic is shared
 * with ListeningFeedbackService via `services/shared/datasetFeedbackUtils`
 * (see that module for why: both datasets turned out to use the exact same
 * column layout). Both collaborators here are constructor-injected
 * (defaulting to the shared singletons), so a caller can substitute fakes
 * in tests without touching this class.
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

    // reading_feedback.csv is keyed by the learner's raw correct-answer
    // count out of 40, mirroring the algorithm's own band tables.
    const overallFeedbackRow = findRowInScoreRange(
      feedbackRows,
      result.correctAnswers,
      (row) => row.min_score,
      (row) => row.max_score
    );

    return {
      ...result,
      strengths: [...feedback.strengths, ...splitList(overallFeedbackRow?.strengths ?? "")],
      weakAreas: [...feedback.weaknesses, ...splitList(overallFeedbackRow?.weaknesses ?? "")],
      recommendations: [...feedback.recommendations, ...splitList(overallFeedbackRow?.recommendations ?? "")],
      overallFeedback: overallFeedbackRow?.feedback ?? "",
      performanceLevel: overallFeedbackRow?.performance_level ?? NOT_ASSESSED_PERFORMANCE_LEVEL,
      commonMistakes: resolveCommonMistakes(commonMistakeRows, weakPerformances),
      questionTypeExplanations: resolveQuestionTypeExplanations(
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
}
