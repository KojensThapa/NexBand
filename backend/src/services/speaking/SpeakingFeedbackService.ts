import { datasetService as defaultDatasetService } from "../dataset";
import type {
  SpeakingRelevanceTrainingRow,
  SpeakingCommonMistakeRow,
  SpeakingFeedbackRow,
  SpeakingQuestionRow,
  SpeakingSampleRow,
} from "../dataset";
import { feedbackEngine as defaultFeedbackEngine } from "../feedback";
import type { EvaluationInput, FeedbackResult } from "../feedback";
import {
  relevanceEngine as defaultRelevanceEngine,
  ResponseNormalizer,
  RuleBasedSimilarityCalculator,
} from "../relevance";
import type { RelevanceInput, RelevanceResult, SimilarityCalculator, TextNormalizer } from "../relevance";
import {
  findClosestTextMatch,
  normalizeLabel,
  normalizeSentence,
  resolveCategoryMistakes,
  resolveScoreRangeFeedback,
} from "../shared/datasetFeedbackUtils";
import { validationEngine as defaultValidationEngine } from "../validation";
import type { ValidationOptions, ValidationResult, ValidationTarget } from "../validation";

import type { SpeakingEvaluationResult } from "../../modules/speaking/algorithm/types";

/** Grammar/vocabulary/pronunciation/fluency are on the same 0-9 band scale as overallBand; below this is treated as "low" for common-mistake matching. */
const LOW_SCORE_THRESHOLD = 6;
/**
 * Mirrors the threshold `evaluateSpeaking()` itself uses internally
 * (`responseRelevance.score <= 5`) to decide relevance is a weak area.
 * Defined independently here — not imported — because this service must
 * not depend on the algorithm's internals.
 */
const LOW_RELEVANCE_THRESHOLD = 5;

/**
 * The only slice of DatasetService this service is allowed to see directly:
 * the datasets it reads itself. speaking_keywords.csv and
 * speaking_invalid_responses.csv are still used — but indirectly, through
 * RelevanceEngine and ValidationEngine respectively, which already own
 * their own narrow DatasetService interfaces.
 */
export interface SpeakingDatasetProvider {
  getSpeakingFeedback(): Promise<SpeakingFeedbackRow[]>;
  getSpeakingCommonMistakes(): Promise<SpeakingCommonMistakeRow[]>;
  getSpeakingQuestions(): Promise<SpeakingQuestionRow[]>;
  getSpeakingSamples(): Promise<SpeakingSampleRow[]>;
  getRelevanceTraining(): Promise<SpeakingRelevanceTrainingRow[]>;
}

/** The one FeedbackEngine method this service needs — matches the real FeedbackEngine's public API structurally. */
export interface SpeakingFeedbackGenerator {
  generateFeedback(input: EvaluationInput): Promise<FeedbackResult>;
}

/** The one ValidationEngine method this service needs — matches the real ValidationEngine's public API structurally. */
export interface TranscriptValidator {
  validate(text: string, target: ValidationTarget, options?: ValidationOptions): Promise<ValidationResult>;
}

/** The one RelevanceEngine method this service needs — matches the real RelevanceEngine's public API structurally. */
export interface SpeakingRelevanceAnalyzer {
  evaluate(input: RelevanceInput): Promise<RelevanceResult>;
}

export interface RelevanceAgreement {
  /** True when the dataset-based verdict and Gemini's `answeredQuestion` verdict match. */
  agreesWithAi: boolean;
  aiRelevant: boolean;
  datasetRelevant: boolean;
}

export interface TrainingExampleMatch {
  trainingId: string;
  label: string;
  reason: string;
  similarity: number;
}

/**
 * Dataset-driven relevance diagnostics that *explain and corroborate*
 * Gemini's `responseRelevance`/`responseRelevanceScore` — they never
 * replace it. `relevanceEngine.evaluate()`'s own output plus a resolved
 * sample answer and, when available, the closest matching labeled
 * training example.
 */
export interface SpeakingRelevanceAnalysis {
  relevanceScore: number;
  keywordCoverage: number;
  sampleSimilarity: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  unexpectedKeywords: string[];
  matchedSample?: string;
  trainingExampleMatch?: TrainingExampleMatch;
  agreement: RelevanceAgreement;
  warnings: string[];
}

/**
 * `SpeakingEvaluationResult` (evaluateSpeaking()'s output) with its
 * generated strengths/weakAreas/recommendations replaced by dataset-driven
 * values, plus new dataset-driven fields appended. Every existing property
 * — including all scores, `cefrLevel`, `transcript`, `wordsPerMinute`,
 * grammar errors, and pronunciation analysis — is kept exactly as
 * evaluateSpeaking() produced it.
 */
export interface EnhancedSpeakingEvaluationResult extends SpeakingEvaluationResult {
  validation: ValidationResult;
  relevanceAnalysis?: SpeakingRelevanceAnalysis;
  performanceLevel: string;
  overallFeedback: string;
  commonMistakes: string[];
  feedbackSummary: string;
  sampleAnswer?: string;
  questionMetadata?: SpeakingQuestionRow[];
  datasetWarnings: string[];
}

/**
 * Bridges the existing (untouched) Speaking evaluation pipeline —
 * Deepgram transcription, Gemini grammar/pronunciation/relevance analysis,
 * and the deterministic `evaluateSpeaking()` algorithm — to this project's
 * reusable dataset-driven infrastructure, following the same shape as
 * ReadingFeedbackService and ListeningFeedbackService. It receives the
 * `SpeakingEvaluationResult` those already produced and turns it into an
 * `EnhancedSpeakingEvaluationResult` by:
 *
 *  - running ValidationEngine on the transcript (consulting
 *    speaking_invalid_responses.csv);
 *  - running RelevanceEngine (consulting speaking_keywords.csv and
 *    speaking_samples.csv) and comparing its verdict against Gemini's own
 *    `responseRelevance.answeredQuestion` — corroborating or flagging a
 *    mismatch, never overriding Gemini's score — plus corroborating against
 *    relevance_training.csv's labeled examples;
 *  - replacing the algorithm's hardcoded strengths/weakAreas/recommendations
 *    with values combining FeedbackEngine's per-skill output with the
 *    overall-band-level lists authored in speaking_feedback.csv;
 *  - appending common mistakes for whichever score categories (grammar,
 *    vocabulary, pronunciation, fluency/coherence, task response, filler
 *    words) came out low, from common_mistakes.csv;
 *  - attaching question metadata and a reference sample answer from
 *    speaking_questions.csv / speaking_samples.csv, when the report's
 *    question text can be matched to a catalogued question.
 *
 * This class never scores anything and never re-evaluates a response — it
 * only reads evaluateSpeaking()'s already-computed result and dataset
 * content. Every collaborator is constructor-injected (defaulting to the
 * shared singletons), so a caller can substitute fakes in tests without
 * touching this class.
 */
export class SpeakingFeedbackService {
  constructor(
    private readonly datasetProvider: SpeakingDatasetProvider = defaultDatasetService,
    private readonly feedbackGenerator: SpeakingFeedbackGenerator = defaultFeedbackEngine,
    private readonly transcriptValidator: TranscriptValidator = defaultValidationEngine,
    private readonly relevanceAnalyzer: SpeakingRelevanceAnalyzer = defaultRelevanceEngine,
    private readonly similarityCalculator: SimilarityCalculator = new RuleBasedSimilarityCalculator(),
    private readonly normalizer: TextNormalizer = new ResponseNormalizer()
  ) {}

  async enrich(result: SpeakingEvaluationResult): Promise<EnhancedSpeakingEvaluationResult> {
    const [feedbackRows, mistakeRows, questionRows, sampleRows, trainingRows] = await Promise.all([
      this.datasetProvider.getSpeakingFeedback(),
      this.datasetProvider.getSpeakingCommonMistakes(),
      this.datasetProvider.getSpeakingQuestions(),
      this.datasetProvider.getSpeakingSamples(),
      this.datasetProvider.getRelevanceTraining(),
    ]);

    const validation = await this.transcriptValidator.validate(result.transcript, "speaking");

    const questionIds = this.resolveQuestionIds(result.question, questionRows);
    const questionMetadata = questionRows.filter((row) => questionIds.includes(row.question_id));

    const { analysis: relevanceAnalysis, warnings: relevanceWarnings } = await this.buildRelevanceAnalysis(
      result,
      questionIds,
      sampleRows,
      trainingRows
    );

    const feedback = await this.feedbackGenerator.generateFeedback(this.buildEvaluationInput(result));

    // speaking_feedback.csv is keyed by overallBand, already a 0-9 band score.
    const overallFeedback = resolveScoreRangeFeedback(feedbackRows, result.overallBand);

    const weakCategories = this.resolveWeakCategories(result);
    const commonMistakes = resolveCategoryMistakes(mistakeRows, weakCategories);
    const sampleAnswer = sampleRows.find((row) => questionIds.includes(row.question_id))?.sample_answer;

    return {
      ...result,
      strengths: [...feedback.strengths, ...overallFeedback.strengths],
      weakAreas: [...feedback.weaknesses, ...overallFeedback.weaknesses],
      recommendations: [...feedback.recommendations, ...overallFeedback.recommendations],
      validation,
      ...(relevanceAnalysis ? { relevanceAnalysis } : {}),
      performanceLevel: overallFeedback.performanceLevel,
      overallFeedback: overallFeedback.overallFeedback,
      commonMistakes,
      feedbackSummary: feedback.summary,
      ...(sampleAnswer ? { sampleAnswer } : {}),
      ...(questionMetadata.length > 0 ? { questionMetadata } : {}),
      datasetWarnings: relevanceWarnings,
    };
  }

  /** Speaking's own 0-9 band scores map directly onto the "skill scores" FeedbackEngine matches its templates against. */
  private buildEvaluationInput(result: SpeakingEvaluationResult): EvaluationInput {
    return {
      overallBand: result.overallBand,
      grammar: result.grammarScore,
      vocabulary: result.vocabularyScore,
      pronunciation: result.pronunciationScore,
      fluency: result.fluencyScore,
      relevance: result.responseRelevanceScore,
      taskResponse: result.responseRelevanceScore,
    };
  }

  private resolveWeakCategories(result: SpeakingEvaluationResult): ReadonlySet<string> {
    const categories = new Set<string>();

    if (result.grammarScore < LOW_SCORE_THRESHOLD) categories.add(normalizeLabel("Grammar"));
    if (result.vocabularyScore < LOW_SCORE_THRESHOLD) categories.add(normalizeLabel("Vocabulary"));
    if (result.pronunciationScore < LOW_SCORE_THRESHOLD) categories.add(normalizeLabel("Pronunciation"));
    if (result.fluencyScore < LOW_SCORE_THRESHOLD) {
      // This algorithm combines Fluency and Coherence into one score, as IELTS itself does.
      categories.add(normalizeLabel("Fluency"));
      categories.add(normalizeLabel("Coherence"));
    }
    if (result.responseRelevanceScore <= LOW_RELEVANCE_THRESHOLD) categories.add(normalizeLabel("Task Response"));
    if (result.fillerWords.penalty > 0) categories.add(normalizeLabel("Filler Words"));

    return categories;
  }

  /**
   * Best-effort match from the report's free-text `question` (which may
   * join several prompts with newlines, for multi-question parts) to one
   * or more speaking_questions.csv rows. Catalogued question text and the
   * database's actual stored prompts are maintained separately, so this
   * tolerates partial matches rather than requiring an exact one.
   */
  private resolveQuestionIds(questionText: string, questionRows: SpeakingQuestionRow[]): string[] {
    const lines = questionText
      .split(/\n+/)
      .map((line) => normalizeSentence(line))
      .filter((line) => line.length > 0);

    if (lines.length === 0) return [];

    return questionRows
      .filter((row) => {
        const normalizedQuestion = normalizeSentence(row.question);
        const normalizedTopic = normalizeSentence(row.topic);
        return lines.some(
          (line) =>
            line === normalizedQuestion ||
            line === normalizedTopic ||
            (normalizedQuestion.length > 0 && (line.includes(normalizedQuestion) || normalizedQuestion.includes(line)))
        );
      })
      .map((row) => row.question_id);
  }

  /**
   * Runs RelevanceEngine and compares its verdict against Gemini's own
   * relevance judgement — it never overrides Gemini's score. Only runs
   * when the report's question text resolved to exactly one catalogued
   * question; an aggregated multi-question report (e.g. a full Part 1
   * submission) has no single keyword/sample set to compare against, so
   * the comparison is skipped rather than producing a misleading average.
   */
  private async buildRelevanceAnalysis(
    result: SpeakingEvaluationResult,
    questionIds: string[],
    sampleRows: SpeakingSampleRow[],
    trainingRows: SpeakingRelevanceTrainingRow[]
  ): Promise<{ analysis?: SpeakingRelevanceAnalysis; warnings: string[] }> {
    const questionId = questionIds[0];
    if (questionIds.length !== 1 || questionId === undefined) {
      return {
        warnings: [
          questionIds.length === 0
            ? "Could not match this report's question text to a catalogued speaking question; dataset-based relevance analysis was skipped."
            : "This report covers multiple catalogued questions; dataset-based relevance analysis requires a single matched question and was skipped.",
        ],
      };
    }
    const relevanceResult = await this.relevanceAnalyzer.evaluate({
      target: "speaking",
      id: questionId,
      response: result.transcript,
    });

    const aiRelevant = result.responseRelevance.answeredQuestion;
    const datasetRelevant = relevanceResult.relevant;
    const agreesWithAi = aiRelevant === datasetRelevant;

    const transcriptTokens = this.normalizer.tokenize(result.transcript);
    const trainingExampleMatch = this.matchTrainingExample(transcriptTokens, questionId, trainingRows);
    const matchedSample = sampleRows.find((row) => row.question_id === questionId)?.sample_answer;

    const warnings = [...relevanceResult.warnings];
    warnings.push(
      agreesWithAi
        ? `Dataset-based relevance analysis agrees with the AI assessment — response strongly validated as ${datasetRelevant ? "relevant" : "not relevant"}.`
        : `Dataset-based relevance analysis disagrees with the AI assessment (AI judged the response as ${aiRelevant ? "answering" : "not answering"} the question; dataset analysis found ${Math.round(relevanceResult.keywordCoverage * 100)}% keyword coverage and ${Math.round(relevanceResult.sampleSimilarity * 100)}% sample similarity, judging it ${datasetRelevant ? "relevant" : "not relevant"}). Gemini's original relevance score was kept unchanged.`
    );

    return {
      analysis: {
        relevanceScore: relevanceResult.relevanceScore,
        keywordCoverage: relevanceResult.keywordCoverage,
        sampleSimilarity: relevanceResult.sampleSimilarity,
        matchedKeywords: relevanceResult.matchedKeywords,
        missingKeywords: relevanceResult.missingKeywords,
        unexpectedKeywords: relevanceResult.unexpectedKeywords,
        ...(matchedSample ? { matchedSample } : {}),
        ...(trainingExampleMatch ? { trainingExampleMatch } : {}),
        agreement: { agreesWithAi, aiRelevant, datasetRelevant },
        warnings,
      },
      warnings,
    };
  }

  /** Finds the labeled relevance_training.csv example (for this question) most similar to the transcript, as extra corroborating evidence. */
  private matchTrainingExample(
    transcriptTokens: string[],
    questionId: string,
    trainingRows: SpeakingRelevanceTrainingRow[]
  ): TrainingExampleMatch | undefined {
    const candidates = trainingRows
      .filter((row) => row.question_id === questionId && row.response_text.trim().length > 0)
      .map((row) => ({ id: row.training_id, text: row.response_text, label: row.label, reason: row.reason }));

    const match = findClosestTextMatch(transcriptTokens, candidates, this.normalizer, this.similarityCalculator);
    if (!match) return undefined;

    return {
      trainingId: match.id,
      label: match.label ?? "",
      reason: match.reason ?? "",
      similarity: match.similarity,
    };
  }
}
