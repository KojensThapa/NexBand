/**
 * Row shapes for every CSV dataset. csv-parser yields every column as a
 * string (it does no type coercion), so numeric-looking fields such as
 * score_min/score_max/weight/band_score are intentionally typed as string
 * here. Converting them to numbers is a concern for whichever evaluation
 * module consumes the data, not this layer.
 */

// ---------------------------------------------------------------------------
// Shared shapes (identical column layout reused across categories)
// ---------------------------------------------------------------------------

export interface QuestionKeywordRow {
  question_id: string;
  keyword: string;
  weight: string;
}

export interface InvalidResponseRow {
  response: string;
  reason: string;
}

/**
 * Reading and Listening both populated their per-question-type mistake,
 * explanation, and answer-metadata files with this exact same column
 * layout, so these three shapes (unlike the generic ones above, which were
 * each designed once and only later populated) are shared because they
 * are provably identical in the real data, not merely similar.
 */
export interface QuestionTypeMistakeRow {
  mistake_id: string;
  question_type: string;
  mistake_name: string;
  description: string;
  recommendation: string;
  severity: string;
}

export interface QuestionTypeExplanationRow {
  question_type: string;
  title: string;
  description: string;
  skill_tested: string;
  common_tip: string;
}

export interface QuestionAnswerMetadataRow {
  question_id: string;
  correct_answer: string;
  acceptable_answers: string;
  answer_type: string;
  keywords: string;
  explanation: string;
}

/**
 * Listening, Speaking, and Writing all populated their overall-band
 * feedback file with this exact same column layout (a raw score/band
 * range plus its own performance level, feedback sentence, and
 * semicolon-separated strengths/weaknesses/recommendations lists). Reading
 * keeps its own distinct shape (see ReadingFeedbackRow below) since its
 * file also carries a "band" column and uses different column names.
 */
export interface ScoreRangeFeedbackRow {
  score_min: string;
  score_max: string;
  performance_level: string;
  overall_feedback: string;
  strengths: string;
  weaknesses: string;
  recommendations: string;
}

/**
 * Speaking and Writing both populated their common-mistakes file keyed by
 * a score *category* (Grammar, Vocabulary, Coherence, Task Response, ...)
 * rather than by question_type, with this exact same column layout.
 */
export interface CategoryMistakeRow {
  mistake_id: string;
  category: string;
  mistake_name: string;
  description: string;
  recommendation: string;
  severity: string;
}

// ---------------------------------------------------------------------------
// Reading
//
// reading_feedback.csv is keyed by an overall raw-score range (with its own
// strengths/weaknesses/recommendations lists) rather than by question_type
// + score range, so it keeps its own distinct shape below.
// ---------------------------------------------------------------------------

export interface ReadingQuestionRow {
  question_id: string;
  passage_id: string;
  question_number: string;
  question_type: string;
  difficulty: string;
  explanation_type: string;
  mistake_category: string;
}

export type ReadingAnswerRow = QuestionAnswerMetadataRow;
export type ReadingExplanationRow = QuestionTypeExplanationRow;
export type ReadingCommonMistakeRow = QuestionTypeMistakeRow;

export interface ReadingFeedbackRow {
  min_score: string;
  max_score: string;
  band: string;
  performance_level: string;
  feedback: string;
  strengths: string;
  weaknesses: string;
  recommendations: string;
}

// ---------------------------------------------------------------------------
// Listening
//
// listening_feedback.csv is keyed by the same kind of overall raw-score
// range as reading_feedback.csv, but with its own column names and no
// "band" column, so it also keeps its own distinct shape below.
// ---------------------------------------------------------------------------

export interface ListeningQuestionRow {
  question_id: string;
  section_id: string;
  question_number: string;
  question_type: string;
  difficulty: string;
  explanation_type: string;
  mistake_category: string;
}

export type ListeningAnswerRow = QuestionAnswerMetadataRow;
export type ListeningExplanationRow = QuestionTypeExplanationRow;
export type ListeningCommonMistakeRow = QuestionTypeMistakeRow;
export type ListeningFeedbackRow = ScoreRangeFeedbackRow;

export type TranscriptKeywordRow = QuestionKeywordRow;

// ---------------------------------------------------------------------------
// Speaking
// ---------------------------------------------------------------------------

export interface SpeakingQuestionRow {
  question_id: string;
  part: string;
  question_type: string;
  topic: string;
  question: string;
  difficulty: string;
  time_limit_seconds: string;
}

export type SpeakingKeywordRow = QuestionKeywordRow;

export interface SpeakingSampleRow {
  question_id: string;
  sample_level: string;
  sample_answer: string;
}

export type SpeakingFeedbackRow = ScoreRangeFeedbackRow;
/** Speaking's mistakes are keyed by score category (Grammar, Vocabulary, Pronunciation, Fluency, Coherence, Task Response, Filler Words) rather than by question_type. */
export type SpeakingCommonMistakeRow = CategoryMistakeRow;

export interface SpeakingInvalidResponseRow {
  response: string;
  reason: string;
  severity: string;
}

/** Labeled example responses (Relevant/Not Relevant) per question, used to corroborate the dataset-based relevance analysis. */
export interface SpeakingRelevanceTrainingRow {
  training_id: string;
  question_id: string;
  response_text: string;
  label: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export interface WritingTopicRow {
  topic_id: string;
  task_type: string;
  title: string;
  prompt: string;
  difficulty: string;
  category: string;
}

export interface WritingKeywordRow {
  keyword_id: string;
  topic_id: string;
  keyword: string;
  weight: string;
}

export interface WritingSampleRow {
  sample_id: string;
  topic_id: string;
  sample_level: string;
  sample_answer: string;
}

export type WritingFeedbackRow = ScoreRangeFeedbackRow;
/** Writing's mistakes are keyed by score category (Grammar, Vocabulary, Coherence, Task Response, Cohesion), the same convention Speaking uses. */
export type WritingCommonMistakeRow = CategoryMistakeRow;

export interface WritingInvalidResponseRow {
  response_id: string;
  response: string;
  reason: string;
}

/** Labeled example responses (Relevant/Not Relevant) per topic, used to corroborate the dataset-based relevance analysis. */
export interface WritingRelevanceTrainingRow {
  training_id: string;
  topic_id: string;
  response_text: string;
  label: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export interface AcademicWordRow {
  word: string;
  part_of_speech: string;
  definition: string;
  example: string;
}

export interface CollocationRow {
  base_word: string;
  collocation: string;
  example: string;
}

export interface GrammarRuleRow {
  rule_id: string;
  category: string;
  rule: string;
  example: string;
  common_error: string;
}

export interface SynonymRow {
  word: string;
  synonym: string;
  context: string;
}

export interface TopicVocabularyRow {
  topic: string;
  word: string;
  definition: string;
  example: string;
}

// ---------------------------------------------------------------------------
// Feedback templates
// ---------------------------------------------------------------------------

export interface StrengthTemplateRow {
  rule_id: string;
  condition: string;
  template: string;
}

export interface WeaknessTemplateRow {
  rule_id: string;
  condition: string;
  template: string;
}

export interface RecommendationTemplateRow {
  rule_id: string;
  condition: string;
  recommendation: string;
}

export interface ScoreCommentRow {
  skill: string;
  score_min: string;
  score_max: string;
  comment: string;
}

export interface AIFeedbackSummaryTemplateRow {
  skill: string;
  condition: string;
  template: string;
}
