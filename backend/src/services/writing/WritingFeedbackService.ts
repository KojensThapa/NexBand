import { datasetService as defaultDatasetService } from "../dataset";
import type {
  WritingCommonMistakeRow,
  WritingFeedbackRow,
  WritingRelevanceTrainingRow,
  WritingSampleRow,
  WritingTopicRow,
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

import type { WritingEvaluationResult, WritingTaskNumber } from "../../modules/writing/algorithm/types";

/** Grammar/vocabulary/coherence/task-achievement are on the same 0-9 band scale as overallBand; below this is treated as "low" for common-mistake matching. */
const LOW_SCORE_THRESHOLD = 6;

/**
 * The only slice of DatasetService this service is allowed to see directly:
 * the datasets it reads itself. writing_keywords.csv and
 * writing_invalid_responses.csv are still used — but indirectly, through
 * RelevanceEngine and ValidationEngine respectively, which already own
 * their own narrow DatasetService interfaces.
 */
export interface WritingDatasetProvider {
  getWritingFeedback(): Promise<WritingFeedbackRow[]>;
  getWritingCommonMistakes(): Promise<WritingCommonMistakeRow[]>;
  getWritingTopics(): Promise<WritingTopicRow[]>;
  getWritingSamples(): Promise<WritingSampleRow[]>;
  getWritingRelevanceTraining(): Promise<WritingRelevanceTrainingRow[]>;
}

/** The one FeedbackEngine method this service needs — matches the real FeedbackEngine's public API structurally. */
export interface WritingFeedbackGenerator {
  generateFeedback(input: EvaluationInput): Promise<FeedbackResult>;
}

/** The one ValidationEngine method this service needs — matches the real ValidationEngine's public API structurally. */
export interface EssayValidator {
  validate(text: string, target: ValidationTarget, options?: ValidationOptions): Promise<ValidationResult>;
}

/** The one RelevanceEngine method this service needs — matches the real RelevanceEngine's public API structurally. */
export interface WritingRelevanceAnalyzer {
  evaluate(input: RelevanceInput): Promise<RelevanceResult>;
}

export interface RelevanceAgreement {
  /** True when the dataset-based verdict and Gemini's own on-topic verdict match. */
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
 * Gemini's `questionRelevance`/task-achievement judgement — they never
 * replace it. `relevanceEngine.evaluate()`'s own output plus, when
 * available, the closest matching labeled training example.
 */
export interface WritingRelevanceAnalysis {
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
 * `WritingEvaluationResult` (evaluateWriting()'s output) with its generated
 * strengths/weakAreas/recommendations replaced by dataset-driven values,
 * plus new dataset-driven fields appended. Every existing property —
 * including all scores, `cefrLevel`, grammar/spelling/punctuation errors,
 * repeated words, and word count — is kept exactly as evaluateWriting()
 * produced it.
 */
export interface EnhancedWritingEvaluationResult extends WritingEvaluationResult {
  validation: ValidationResult;
  relevanceAnalysis?: WritingRelevanceAnalysis;
  topicMetadata?: WritingTopicRow[];
  performanceLevel: string;
  overallFeedback: string;
  commonMistakes: string[];
  sampleEssay?: string;
  feedbackSummary: string;
  datasetWarnings: string[];
}

/**
 * Bridges the existing (untouched) Writing evaluation pipeline — Gemini
 * grammar/essay analysis and the deterministic `evaluateWriting()`
 * algorithm — to this project's reusable dataset-driven infrastructure,
 * following the same shape as ReadingFeedbackService,
 * ListeningFeedbackService, and SpeakingFeedbackService. It receives the
 * `WritingEvaluationResult` those already produced and turns it into an
 * `EnhancedWritingEvaluationResult` by:
 *
 *  - running ValidationEngine on the essay (consulting
 *    writing_invalid_responses.csv);
 *  - running RelevanceEngine (consulting writing_keywords.csv and
 *    writing_samples.csv, filtered to the report's own task number — see
 *    `resolveTopicIds`) and comparing its verdict against Gemini's own
 *    `questionRelevance` judgement — corroborating or flagging a mismatch,
 *    never overriding Gemini's score — plus corroborating against
 *    relevance_training.csv's labeled examples;
 *  - replacing the algorithm's hardcoded strengths/weakAreas/recommendations
 *    with values combining FeedbackEngine's per-skill output with the
 *    overall-band-level lists authored in writing_feedback.csv;
 *  - appending common mistakes for whichever score categories (grammar,
 *    vocabulary, coherence, task response) came out low, from
 *    common_mistakes.csv;
 *  - attaching topic metadata and the closest sample essay from
 *    writing_topics.csv / writing_samples.csv, when the report's question
 *    text can be matched to a catalogued topic.
 *
 * This class never scores anything and never re-evaluates an essay — it
 * only reads evaluateWriting()'s already-computed result and dataset
 * content. Every collaborator is constructor-injected (defaulting to the
 * shared singletons), so a caller can substitute fakes in tests without
 * touching this class.
 */
export class WritingFeedbackService {
  constructor(
    private readonly datasetProvider: WritingDatasetProvider = defaultDatasetService,
    private readonly feedbackGenerator: WritingFeedbackGenerator = defaultFeedbackEngine,
    private readonly essayValidator: EssayValidator = defaultValidationEngine,
    private readonly relevanceAnalyzer: WritingRelevanceAnalyzer = defaultRelevanceEngine,
    private readonly similarityCalculator: SimilarityCalculator = new RuleBasedSimilarityCalculator(),
    private readonly normalizer: TextNormalizer = new ResponseNormalizer()
  ) {}

  async enrich(result: WritingEvaluationResult): Promise<EnhancedWritingEvaluationResult> {
    const [feedbackRows, mistakeRows, topicRows, sampleRows, trainingRows] = await Promise.all([
      this.datasetProvider.getWritingFeedback(),
      this.datasetProvider.getWritingCommonMistakes(),
      this.datasetProvider.getWritingTopics(),
      this.datasetProvider.getWritingSamples(),
      this.datasetProvider.getWritingRelevanceTraining(),
    ]);

    const validation = await this.essayValidator.validate(result.studentEssay, "writing");

    const topicIds = this.resolveTopicIds(result.question, result.taskNumber, topicRows);
    const topicMetadata = topicRows.filter((row) => topicIds.includes(row.topic_id));

    const { analysis: relevanceAnalysis, warnings: relevanceWarnings } = await this.buildRelevanceAnalysis(
      result,
      topicIds,
      sampleRows,
      trainingRows
    );

    const feedback = await this.feedbackGenerator.generateFeedback(this.buildEvaluationInput(result));

    // writing_feedback.csv is keyed by overallBand, already a 0-9 band score.
    const overallFeedback = resolveScoreRangeFeedback(feedbackRows, result.overallBand);

    const weakCategories = this.resolveWeakCategories(result);
    const commonMistakes = resolveCategoryMistakes(mistakeRows, weakCategories);

    const essayTokens = this.normalizer.tokenize(result.studentEssay);
    const sampleEssay = this.resolveSampleEssay(essayTokens, topicIds, sampleRows);

    return {
      ...result,
      strengths: [...feedback.strengths, ...overallFeedback.strengths],
      weakAreas: [...feedback.weaknesses, ...overallFeedback.weaknesses],
      recommendations: [...feedback.recommendations, ...overallFeedback.recommendations],
      validation,
      ...(relevanceAnalysis ? { relevanceAnalysis } : {}),
      ...(topicMetadata.length > 0 ? { topicMetadata } : {}),
      performanceLevel: overallFeedback.performanceLevel,
      overallFeedback: overallFeedback.overallFeedback,
      commonMistakes,
      ...(sampleEssay ? { sampleEssay } : {}),
      feedbackSummary: feedback.summary,
      datasetWarnings: relevanceWarnings,
    };
  }

  /** Writing's own 0-9 band scores map directly onto the "skill scores" FeedbackEngine matches its templates against. */
  private buildEvaluationInput(result: WritingEvaluationResult): EvaluationInput {
    return {
      overallBand: result.overallBand,
      grammar: result.grammarScore,
      vocabulary: result.vocabularyScore,
      coherence: result.coherenceScore,
      taskAchievement: result.taskAchievementScore,
      taskResponse: result.taskAchievementScore,
    };
  }

  private resolveWeakCategories(result: WritingEvaluationResult): ReadonlySet<string> {
    const categories = new Set<string>();

    if (result.grammarScore < LOW_SCORE_THRESHOLD) categories.add(normalizeLabel("Grammar"));
    if (result.vocabularyScore < LOW_SCORE_THRESHOLD) categories.add(normalizeLabel("Vocabulary"));
    if (result.coherenceScore < LOW_SCORE_THRESHOLD) {
      // IELTS scores this as one combined "Coherence and Cohesion" criterion.
      categories.add(normalizeLabel("Coherence"));
      categories.add(normalizeLabel("Cohesion"));
    }
    if (result.taskAchievementScore < LOW_SCORE_THRESHOLD) categories.add(normalizeLabel("Task Response"));

    return categories;
  }

  /**
   * Resolves the report's free-text `question` to one or more
   * writing_topics.csv rows — but only among rows whose `task_type`
   * matches the report's own `taskNumber`, so a Task 1 essay can never be
   * matched (and therefore never compared) against a Task 2 topic, and
   * vice versa. Catalogued topic text and the database's actual stored
   * prompts are maintained separately, so this tolerates partial matches
   * rather than requiring an exact one.
   */
  private resolveTopicIds(
    questionText: string,
    taskNumber: WritingTaskNumber,
    topicRows: WritingTopicRow[]
  ): string[] {
    const expectedTaskType = normalizeSentence(`Task${taskNumber}`);
    const candidateRows = topicRows.filter((row) => normalizeSentence(row.task_type) === expectedTaskType);

    const normalizedQuestion = normalizeSentence(questionText);
    if (normalizedQuestion.length === 0) return [];

    return candidateRows
      .filter((row) => {
        const normalizedPrompt = normalizeSentence(row.prompt);
        const normalizedTitle = normalizeSentence(row.title);
        return (
          normalizedQuestion === normalizedPrompt ||
          normalizedQuestion === normalizedTitle ||
          (normalizedPrompt.length > 0 &&
            (normalizedQuestion.includes(normalizedPrompt) || normalizedPrompt.includes(normalizedQuestion)))
        );
      })
      .map((row) => row.topic_id);
  }

  /** The sample answer (among this topic's candidates) most similar to the essay, by rule-based token overlap. */
  private resolveSampleEssay(
    essayTokens: string[],
    topicIds: string[],
    sampleRows: WritingSampleRow[]
  ): string | undefined {
    const candidates = sampleRows
      .filter((row) => topicIds.includes(row.topic_id))
      .map((row) => ({ id: row.sample_id, text: row.sample_answer }));

    return findClosestTextMatch(essayTokens, candidates, this.normalizer, this.similarityCalculator)?.text;
  }

  /**
   * Runs RelevanceEngine and compares its verdict against Gemini's own
   * relevance judgement — it never overrides Gemini's score. Only runs
   * when the report's question text resolved to exactly one catalogued
   * topic (within its own task number); no match, or an ambiguous match
   * against several topics, means there is no single keyword/sample set
   * to compare against, so the comparison is skipped rather than
   * producing a misleading result.
   */
  private async buildRelevanceAnalysis(
    result: WritingEvaluationResult,
    topicIds: string[],
    sampleRows: WritingSampleRow[],
    trainingRows: WritingRelevanceTrainingRow[]
  ): Promise<{ analysis?: WritingRelevanceAnalysis; warnings: string[] }> {
    const topicId = topicIds[0];
    if (topicIds.length !== 1 || topicId === undefined) {
      return {
        warnings: [
          topicIds.length === 0
            ? "Could not match this report's question text to a catalogued writing topic; dataset-based relevance analysis was skipped."
            : "This report's question text matched multiple catalogued topics; dataset-based relevance analysis requires a single matched topic and was skipped.",
        ],
      };
    }

    const relevanceResult = await this.relevanceAnalyzer.evaluate({
      target: "writing",
      id: topicId,
      response: result.studentEssay,
    });

    const aiRelevant = result.questionRelevance.answeredQuestion && !result.questionRelevance.offTopic;
    const datasetRelevant = relevanceResult.relevant;
    const agreesWithAi = aiRelevant === datasetRelevant;

    const essayTokens = this.normalizer.tokenize(result.studentEssay);
    const trainingExampleMatch = this.matchTrainingExample(essayTokens, topicId, trainingRows);
    const matchedSample = sampleRows.find((row) => row.topic_id === topicId)?.sample_answer;

    const warnings = [...relevanceResult.warnings];
    warnings.push(
      agreesWithAi
        ? `Dataset-based relevance analysis agrees with the AI assessment — essay strongly validated as ${datasetRelevant ? "relevant" : "not relevant"}.`
        : `Dataset-based relevance analysis disagrees with the AI assessment (AI judged the essay as ${aiRelevant ? "addressing" : "not fully addressing"} the prompt; dataset analysis found ${Math.round(relevanceResult.keywordCoverage * 100)}% keyword coverage and ${Math.round(relevanceResult.sampleSimilarity * 100)}% sample similarity, judging it ${datasetRelevant ? "relevant" : "not relevant"}). Gemini's original task achievement score was kept unchanged.`
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

  /** Finds the labeled relevance_training.csv example (for this topic) most similar to the essay, as extra corroborating evidence. */
  private matchTrainingExample(
    essayTokens: string[],
    topicId: string,
    trainingRows: WritingRelevanceTrainingRow[]
  ): TrainingExampleMatch | undefined {
    const candidates = trainingRows
      .filter((row) => row.topic_id === topicId && row.response_text.trim().length > 0)
      .map((row) => ({ id: row.training_id, text: row.response_text, label: row.label, reason: row.reason }));

    const match = findClosestTextMatch(essayTokens, candidates, this.normalizer, this.similarityCalculator);
    if (!match) return undefined;

    return {
      trainingId: match.id,
      label: match.label ?? "",
      reason: match.reason ?? "",
      similarity: match.similarity,
    };
  }
}
