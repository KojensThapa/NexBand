import { datasetService as defaultDatasetService } from "../dataset";
import type {
  ListeningAnswerRow,
  ListeningCommonMistakeRow,
  ListeningExplanationRow,
  ListeningFeedbackRow,
  ListeningQuestionRow,
  TranscriptKeywordRow,
} from "../dataset";
import { feedbackEngine as defaultFeedbackEngine } from "../feedback";
import type { EvaluationInput, FeedbackResult } from "../feedback";
import {
  normalizeLabel,
  resolveCommonMistakes,
  resolveQuestionTypeExplanations,
  resolveScoreRangeFeedback,
  type QuestionTypeExplanationResult,
} from "../shared/datasetFeedbackUtils";

import type {
  ListeningEvaluationResult,
  ListeningQuestionType,
} from "../../modules/listening/algorithm/listeningAlgorithm";

/**
 * A question type is treated as "low-performing" at the same 60% accuracy
 * cutoff the Listening algorithm itself uses for `weakAreas`/
 * `recommendations` (see `generateWeakAreas` in listeningAlgorithm.ts).
 * Defined independently here — not imported — because this service must
 * not depend on the algorithm's internals; it only reads the
 * already-computed `questionTypePerformance` the algorithm returns.
 */
const LOW_PERFORMANCE_ACCURACY_THRESHOLD = 60;

/**
 * The only slice of DatasetService this service is allowed to see: the six
 * Listening-specific datasets. Depending on this narrow interface rather
 * than the concrete DatasetService (Interface Segregation + Dependency
 * Inversion) means the real DatasetService satisfies it structurally, no
 * adapter needed.
 */
export interface ListeningDatasetProvider {
  getListeningFeedback(): Promise<ListeningFeedbackRow[]>;
  getListeningCommonMistakes(): Promise<ListeningCommonMistakeRow[]>;
  getListeningExplanations(): Promise<ListeningExplanationRow[]>;
  getListeningQuestions(): Promise<ListeningQuestionRow[]>;
  getListeningAnswers(): Promise<ListeningAnswerRow[]>;
  getTranscriptKeywords(): Promise<TranscriptKeywordRow[]>;
}

/** The one FeedbackEngine method this service needs — matches the real FeedbackEngine's public API structurally. */
export interface ListeningFeedbackGenerator {
  generateFeedback(input: EvaluationInput): Promise<FeedbackResult>;
}

export interface QuestionTypeExplanation extends QuestionTypeExplanationResult<ListeningQuestionType> {
  /** Transcript keywords relevant to this question type, when transcript_keywords.csv actually has usable keyword data for it. */
  relatedKeywords?: string[];
}

/**
 * `ListeningEvaluationResult` (the algorithm's output) with its generated
 * strengths/weakAreas/recommendations replaced by dataset-driven values,
 * plus new dataset-driven fields appended. Every existing property is kept,
 * so anything already consuming `ListeningEvaluationResult` keeps working
 * unchanged against this superset.
 */
export interface EnhancedListeningEvaluationResult extends ListeningEvaluationResult {
  overallFeedback: string;
  performanceLevel: string;
  commonMistakes: string[];
  questionTypeExplanations: QuestionTypeExplanation[];
  feedbackSummary: string;
}

/**
 * Bridges the existing (untouched) Listening evaluation algorithm to this
 * project's reusable dataset-driven infrastructure, mirroring
 * ReadingFeedbackService. It receives the `ListeningEvaluationResult` the
 * algorithm already computed — scores, bands, part/question-type
 * performance — and turns it into an `EnhancedListeningEvaluationResult` by:
 *
 *  - replacing the algorithm's hardcoded strengths/weakAreas/recommendations
 *    with values combining the shared FeedbackEngine's per-question-type
 *    output (from the generic feedback_templates datasets) with the
 *    overall-band-level lists authored directly in listening_feedback.csv;
 *  - adding an overall feedback sentence and a performance-level label, both
 *    looked up from listening_feedback.csv by the learner's raw score;
 *  - listing common mistakes for whichever question types the learner
 *    performed poorly on, from listening_common_mistakes.csv;
 *  - listing explanations for those same weak question types, from
 *    listening_explanations.csv, plus accepted answers for their questions
 *    (bridged via listening_questions.csv's question_id -> question_type
 *    map) from listening_answers.csv, when available;
 *  - attaching transcript keywords for those question types from
 *    transcript_keywords.csv, when that file actually has keyword data for
 *    them.
 *
 * This class never scores anything and never re-evaluates an answer — it
 * only reads the algorithm's already-computed result and dataset content.
 * The question-type mistake/explanation/answer matching logic is shared
 * with ReadingFeedbackService via `services/shared/datasetFeedbackUtils`
 * (see that module for why: both datasets use the exact same column
 * layout). Both collaborators here are constructor-injected (defaulting to
 * the shared singletons), so a caller can substitute fakes in tests
 * without touching this class.
 */
export class ListeningFeedbackService {
  constructor(
    private readonly datasetProvider: ListeningDatasetProvider = defaultDatasetService,
    private readonly feedbackGenerator: ListeningFeedbackGenerator = defaultFeedbackEngine
  ) {}

  async enrich(result: ListeningEvaluationResult): Promise<EnhancedListeningEvaluationResult> {
    const [feedbackRows, commonMistakeRows, explanationRows, questionRows, answerRows, keywordRows] =
      await Promise.all([
        this.datasetProvider.getListeningFeedback(),
        this.datasetProvider.getListeningCommonMistakes(),
        this.datasetProvider.getListeningExplanations(),
        this.datasetProvider.getListeningQuestions(),
        this.datasetProvider.getListeningAnswers(),
        this.datasetProvider.getTranscriptKeywords(),
      ]);

    const weakPerformances = result.questionTypePerformance.filter(
      (performance) =>
        performance.accuracy !== null && performance.accuracy < LOW_PERFORMANCE_ACCURACY_THRESHOLD
    );

    const feedback = await this.feedbackGenerator.generateFeedback(this.buildEvaluationInput(result));

    // listening_feedback.csv is keyed by the learner's raw correct-answer
    // count out of 40, the same convention reading_feedback.csv uses.
    const overallFeedback = resolveScoreRangeFeedback(feedbackRows, result.correctAnswers);

    const questionTypeExplanations = this.attachRelatedKeywords(
      resolveQuestionTypeExplanations(weakPerformances, questionRows, explanationRows, answerRows),
      questionRows,
      keywordRows
    );

    return {
      ...result,
      strengths: [...feedback.strengths, ...overallFeedback.strengths],
      weakAreas: [...feedback.weaknesses, ...overallFeedback.weaknesses],
      recommendations: [...feedback.recommendations, ...overallFeedback.recommendations],
      overallFeedback: overallFeedback.overallFeedback,
      performanceLevel: overallFeedback.performanceLevel,
      commonMistakes: resolveCommonMistakes(commonMistakeRows, weakPerformances),
      questionTypeExplanations,
      feedbackSummary: feedback.summary,
    };
  }

  /** Listening's per-question-type accuracies (0-100) and overall band become the "skill scores" FeedbackEngine matches its templates against. */
  private buildEvaluationInput(result: ListeningEvaluationResult): EvaluationInput {
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

  /**
   * transcript_keywords.csv is documented as {question_id, keyword, weight},
   * but is used "only to improve keyword-based explanations if
   * appropriate" — so this reads defensively and simply attaches nothing
   * when a row doesn't actually carry a usable `keyword` string, rather
   * than assuming the file matches its intended shape.
   */
  private attachRelatedKeywords(
    explanations: QuestionTypeExplanationResult<ListeningQuestionType>[],
    questionRows: ListeningQuestionRow[],
    keywordRows: TranscriptKeywordRow[]
  ): QuestionTypeExplanation[] {
    return explanations.map((explanation) => {
      const questionIds = new Set(
        questionRows
          .filter((row) => normalizeLabel(row.question_type) === normalizeLabel(explanation.type))
          .map((row) => row.question_id)
      );

      const relatedKeywords = Array.from(
        new Set(
          keywordRows
            .filter(
              (row) =>
                questionIds.has(row.question_id) &&
                typeof row.keyword === "string" &&
                row.keyword.trim().length > 0
            )
            .map((row) => row.keyword.trim())
        )
      );

      return relatedKeywords.length > 0 ? { ...explanation, relatedKeywords } : explanation;
    });
  }
}
