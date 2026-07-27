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

export interface CommonMistakeRow {
  mistake_id: string;
  category: string;
  mistake: string;
  correction: string;
  explanation: string;
}

export interface AnswerRow {
  question_id: string;
  correct_answer: string;
  accepted_answers: string;
}

export interface QuestionTypeFeedbackRow {
  question_type: string;
  score_min: string;
  score_max: string;
  feedback: string;
}

export interface CriterionFeedbackRow {
  criterion: string;
  score_min: string;
  score_max: string;
  feedback: string;
}

export interface QuestionKeywordRow {
  question_id: string;
  keyword: string;
  weight: string;
}

export interface InvalidResponseRow {
  response: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Reading
//
// Unlike the other categories, these five files have been populated with
// real content and their columns differ from the shared shapes above —
// notably reading_feedback.csv is keyed by an overall raw-score range
// (with its own strengths/weaknesses/recommendations lists) rather than by
// question_type + score range, and reading_common_mistakes.csv /
// reading_explanations.csv are keyed directly by question_type rather than
// by a generic "category" or by question_id. These interfaces intentionally
// do not alias the shared shapes above.
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

export interface ReadingAnswerRow {
  question_id: string;
  correct_answer: string;
  acceptable_answers: string;
  answer_type: string;
  keywords: string;
  explanation: string;
}

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

export interface ReadingExplanationRow {
  question_type: string;
  title: string;
  description: string;
  skill_tested: string;
  common_tip: string;
}

export interface ReadingCommonMistakeRow {
  mistake_id: string;
  question_type: string;
  mistake_name: string;
  description: string;
  recommendation: string;
  severity: string;
}

// ---------------------------------------------------------------------------
// Listening
// ---------------------------------------------------------------------------

export interface ListeningQuestionRow {
  question_id: string;
  part: string;
  question_type: string;
  question_text: string;
  audio_reference: string;
  options: string;
}

export type ListeningAnswerRow = AnswerRow;
export type ListeningFeedbackRow = QuestionTypeFeedbackRow;
export type TranscriptKeywordRow = QuestionKeywordRow;
export type ListeningCommonMistakeRow = CommonMistakeRow;

// ---------------------------------------------------------------------------
// Speaking
// ---------------------------------------------------------------------------

export interface SpeakingQuestionRow {
  question_id: string;
  part: string;
  topic: string;
  question_text: string;
}

export type SpeakingKeywordRow = QuestionKeywordRow;

export interface SpeakingSampleRow {
  sample_id: string;
  question_id: string;
  band_score: string;
  transcript: string;
  notes: string;
}

export type SpeakingFeedbackRow = CriterionFeedbackRow;
export type SpeakingCommonMistakeRow = CommonMistakeRow;
export type SpeakingInvalidResponseRow = InvalidResponseRow;

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export interface WritingTopicRow {
  topic_id: string;
  task_number: string;
  topic: string;
  prompt: string;
  task_type: string;
}

export interface WritingKeywordRow {
  topic_id: string;
  keyword: string;
  weight: string;
}

export interface WritingSampleRow {
  sample_id: string;
  topic_id: string;
  band_score: string;
  essay: string;
  notes: string;
}

export type WritingFeedbackRow = CriterionFeedbackRow;
export type WritingCommonMistakeRow = CommonMistakeRow;
export type WritingInvalidResponseRow = InvalidResponseRow;

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
