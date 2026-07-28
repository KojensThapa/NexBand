import path from "node:path";

import { CsvLoader } from "./CsvLoader";
import { DatasetCache } from "./DatasetCache";
import type {
  AcademicWordRow,
  AIFeedbackSummaryTemplateRow,
  CollocationRow,
  GrammarRuleRow,
  ListeningAnswerRow,
  ListeningCommonMistakeRow,
  ListeningExplanationRow,
  ListeningFeedbackRow,
  ListeningQuestionRow,
  ReadingAnswerRow,
  ReadingCommonMistakeRow,
  ReadingExplanationRow,
  ReadingFeedbackRow,
  ReadingQuestionRow,
  RecommendationTemplateRow,
  ScoreCommentRow,
  SpeakingCommonMistakeRow,
  SpeakingFeedbackRow,
  SpeakingInvalidResponseRow,
  SpeakingKeywordRow,
  SpeakingQuestionRow,
  SpeakingRelevanceTrainingRow,
  SpeakingSampleRow,
  StrengthTemplateRow,
  SynonymRow,
  TopicVocabularyRow,
  TranscriptKeywordRow,
  WeaknessTemplateRow,
  WritingCommonMistakeRow,
  WritingFeedbackRow,
  WritingInvalidResponseRow,
  WritingKeywordRow,
  WritingRelevanceTrainingRow,
  WritingSampleRow,
  WritingTopicRow,
} from "./interfaces";
import type { DatasetCacheKey, DatasetCategory, LoadOptions } from "./types";

const DEFAULT_DATASETS_ROOT = path.join(__dirname, "..", "..", "datasets");

/**
 * Business-facing entry point for reading dataset CSVs. Every public method
 * corresponds to one CSV file and returns its rows, cached after the first
 * load. Reading, Listening, Speaking, and Writing evaluation modules should
 * depend on this service instead of touching the filesystem or csv-parser
 * directly.
 */
export class DatasetService {
  private readonly cache = new DatasetCache();

  constructor(private readonly datasetsRoot: string = DEFAULT_DATASETS_ROOT) {}

  // ---------------------------------------------------------------------
  // Reading
  // ---------------------------------------------------------------------

  getReadingQuestions(options?: LoadOptions): Promise<ReadingQuestionRow[]> {
    return this.loadDataset<ReadingQuestionRow>("reading", "reading_questions.csv", options);
  }

  getReadingAnswers(options?: LoadOptions): Promise<ReadingAnswerRow[]> {
    return this.loadDataset<ReadingAnswerRow>("reading", "reading_answers.csv", options);
  }

  getReadingFeedback(options?: LoadOptions): Promise<ReadingFeedbackRow[]> {
    return this.loadDataset<ReadingFeedbackRow>("reading", "reading_feedback.csv", options);
  }

  getReadingExplanations(options?: LoadOptions): Promise<ReadingExplanationRow[]> {
    return this.loadDataset<ReadingExplanationRow>("reading", "reading_explanations.csv", options);
  }

  getReadingCommonMistakes(options?: LoadOptions): Promise<ReadingCommonMistakeRow[]> {
    return this.loadDataset<ReadingCommonMistakeRow>("reading", "common_mistakes.csv", options);
  }

  // ---------------------------------------------------------------------
  // Listening
  // ---------------------------------------------------------------------

  getListeningQuestions(options?: LoadOptions): Promise<ListeningQuestionRow[]> {
    return this.loadDataset<ListeningQuestionRow>("listening", "listening_questions.csv", options);
  }

  getListeningAnswers(options?: LoadOptions): Promise<ListeningAnswerRow[]> {
    return this.loadDataset<ListeningAnswerRow>("listening", "listening_answers.csv", options);
  }

  getListeningFeedback(options?: LoadOptions): Promise<ListeningFeedbackRow[]> {
    return this.loadDataset<ListeningFeedbackRow>("listening", "listening_feedback.csv", options);
  }

  getTranscriptKeywords(options?: LoadOptions): Promise<TranscriptKeywordRow[]> {
    return this.loadDataset<TranscriptKeywordRow>("listening", "transcript_keywords.csv", options);
  }

  getListeningCommonMistakes(options?: LoadOptions): Promise<ListeningCommonMistakeRow[]> {
    return this.loadDataset<ListeningCommonMistakeRow>("listening", "common_mistakes.csv", options);
  }

  getListeningExplanations(options?: LoadOptions): Promise<ListeningExplanationRow[]> {
    return this.loadDataset<ListeningExplanationRow>("listening", "listening_explanations.csv", options);
  }

  // ---------------------------------------------------------------------
  // Speaking
  // ---------------------------------------------------------------------

  getSpeakingQuestions(options?: LoadOptions): Promise<SpeakingQuestionRow[]> {
    return this.loadDataset<SpeakingQuestionRow>("speaking", "speaking_questions.csv", options);
  }

  getSpeakingKeywords(options?: LoadOptions): Promise<SpeakingKeywordRow[]> {
    return this.loadDataset<SpeakingKeywordRow>("speaking", "speaking_keywords.csv", options);
  }

  getSpeakingSamples(options?: LoadOptions): Promise<SpeakingSampleRow[]> {
    return this.loadDataset<SpeakingSampleRow>("speaking", "speaking_samples.csv", options);
  }

  getSpeakingFeedback(options?: LoadOptions): Promise<SpeakingFeedbackRow[]> {
    return this.loadDataset<SpeakingFeedbackRow>("speaking", "speaking_feedback.csv", options);
  }

  getSpeakingCommonMistakes(options?: LoadOptions): Promise<SpeakingCommonMistakeRow[]> {
    return this.loadDataset<SpeakingCommonMistakeRow>("speaking", "common_mistakes.csv", options);
  }

  getSpeakingInvalidResponses(options?: LoadOptions): Promise<SpeakingInvalidResponseRow[]> {
    return this.loadDataset<SpeakingInvalidResponseRow>("speaking", "invalid_responses.csv", options);
  }

  getRelevanceTraining(options?: LoadOptions): Promise<SpeakingRelevanceTrainingRow[]> {
    return this.loadDataset<SpeakingRelevanceTrainingRow>("speaking", "relevance_training.csv", options);
  }

  // ---------------------------------------------------------------------
  // Writing
  // ---------------------------------------------------------------------

  getWritingTopics(options?: LoadOptions): Promise<WritingTopicRow[]> {
    return this.loadDataset<WritingTopicRow>("writing", "writing_topics.csv", options);
  }

  getWritingKeywords(options?: LoadOptions): Promise<WritingKeywordRow[]> {
    return this.loadDataset<WritingKeywordRow>("writing", "writing_keywords.csv", options);
  }

  getWritingSamples(options?: LoadOptions): Promise<WritingSampleRow[]> {
    return this.loadDataset<WritingSampleRow>("writing", "writing_samples.csv", options);
  }

  getWritingFeedback(options?: LoadOptions): Promise<WritingFeedbackRow[]> {
    return this.loadDataset<WritingFeedbackRow>("writing", "writing_feedback.csv", options);
  }

  getWritingCommonMistakes(options?: LoadOptions): Promise<WritingCommonMistakeRow[]> {
    return this.loadDataset<WritingCommonMistakeRow>("writing", "common_mistakes.csv", options);
  }

  getWritingInvalidResponses(options?: LoadOptions): Promise<WritingInvalidResponseRow[]> {
    return this.loadDataset<WritingInvalidResponseRow>("writing", "invalid_responses.csv", options);
  }

  getWritingRelevanceTraining(options?: LoadOptions): Promise<WritingRelevanceTrainingRow[]> {
    return this.loadDataset<WritingRelevanceTrainingRow>("writing", "relevance_training.csv", options);
  }

  // ---------------------------------------------------------------------
  // Vocabulary
  // ---------------------------------------------------------------------

  getAcademicWords(options?: LoadOptions): Promise<AcademicWordRow[]> {
    return this.loadDataset<AcademicWordRow>("vocabulary", "academic_words.csv", options);
  }

  getCollocations(options?: LoadOptions): Promise<CollocationRow[]> {
    return this.loadDataset<CollocationRow>("vocabulary", "collocations.csv", options);
  }

  getGrammarRules(options?: LoadOptions): Promise<GrammarRuleRow[]> {
    return this.loadDataset<GrammarRuleRow>("vocabulary", "grammar_rules.csv", options);
  }

  getSynonyms(options?: LoadOptions): Promise<SynonymRow[]> {
    return this.loadDataset<SynonymRow>("vocabulary", "synonyms.csv", options);
  }

  getTopicVocabulary(options?: LoadOptions): Promise<TopicVocabularyRow[]> {
    return this.loadDataset<TopicVocabularyRow>("vocabulary", "topic_vocabulary.csv", options);
  }

  // ---------------------------------------------------------------------
  // Feedback templates
  // ---------------------------------------------------------------------

  getStrengthTemplates(options?: LoadOptions): Promise<StrengthTemplateRow[]> {
    return this.loadDataset<StrengthTemplateRow>("feedback_templates", "strengths.csv", options);
  }

  getWeaknessTemplates(options?: LoadOptions): Promise<WeaknessTemplateRow[]> {
    return this.loadDataset<WeaknessTemplateRow>("feedback_templates", "weaknesses.csv", options);
  }

  getRecommendationTemplates(options?: LoadOptions): Promise<RecommendationTemplateRow[]> {
    return this.loadDataset<RecommendationTemplateRow>("feedback_templates", "recommendations.csv", options);
  }

  getScoreComments(options?: LoadOptions): Promise<ScoreCommentRow[]> {
    return this.loadDataset<ScoreCommentRow>("feedback_templates", "score_comments.csv", options);
  }

  getAIFeedbackSummaryTemplates(options?: LoadOptions): Promise<AIFeedbackSummaryTemplateRow[]> {
    return this.loadDataset<AIFeedbackSummaryTemplateRow>("feedback_templates", "ai_feedback_summary.csv", options);
  }

  // ---------------------------------------------------------------------
  // Cache administration
  // ---------------------------------------------------------------------

  /** Drops every cached dataset. The next call to any getter reloads from disk. */
  clearCache(): void {
    this.cache.clear();
  }

  /** Recursively lists every CSV file actually present under the datasets root. */
  listAvailableDatasetFiles(): Promise<string[]> {
    return CsvLoader.listCsvFiles(this.datasetsRoot);
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private loadDataset<T>(
    category: DatasetCategory,
    fileName: string,
    options: LoadOptions = {}
  ): Promise<T[]> {
    const key: DatasetCacheKey = `${category}/${fileName}`;

    if (options.forceReload) {
      this.cache.invalidate(key);
    }

    const cached = this.cache.get<T>(key);
    if (cached) {
      return cached;
    }

    const filePath = path.join(this.datasetsRoot, category, fileName);
    const loadPromise = CsvLoader.load<T>(filePath);

    // A failed load must not poison the cache forever: let the next call
    // retry from disk instead of permanently returning the same rejection.
    loadPromise.catch(() => this.cache.invalidate(key));

    this.cache.set(key, loadPromise);
    return loadPromise;
  }
}
