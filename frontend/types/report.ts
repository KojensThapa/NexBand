import type { IeltsSkill } from "./exam";

export interface CriterionScore {
  id: string;
  label: string;
  score: number;
  color: string;
  summary?: string;
  subScores?: { label: string; score: number }[];
}

export interface FeedbackError {
  id: number;
  title: string;
  category: string;
  original: string;
  corrected: string;
  explanation: string;
}

export interface WordCountEntry {
  word: string;
  count: number;
}

export interface FillerWordEntry {
  word: string;
  count: number;
}

export interface MispronouncedWordEntry {
  word: string;
  suggestion: string;
}

export interface SectionScoreEntry {
  label: string;
  score: number;
  correct: number;
  total: number;
}

export interface QuestionTypePerformanceEntry {
  type: string;
  score: number;
  correct: number;
  total: number;
}

export interface WritingFeedbackDetail {
  taskTitle: string;
  taskPrompt: string;
  responseText: string;
  wordCount: number;
  wordCountStatus: string;
  overallScore: number;
  cefrLevel: string;
  criteria: CriterionScore[];
  errors: FeedbackError[];
  vocabularyAnalysis: {
    uniqueWords: number;
    repeatedWords: WordCountEntry[];
  };
  grammarAnalysis: {
    grammarErrors: number;
    spellingErrors: number;
    punctuationErrors: number;
  };
  strengths: string[];
  improvements: string[];
  aiSummary: string;
  suggestedImprovements: string[];
  correctedEssay: string;
}

export interface ReadingFeedbackDetail {
  taskTitle: string;
  overallScore: number;
  correctCount: number;
  totalQuestions: number;
  accuracyPercentage: number;
  timeTaken: string;
  sectionScores: SectionScoreEntry[];
  questionTypePerformance: QuestionTypePerformanceEntry[];
  strengths: string[];
  weakAreas: string[];
  aiSummary: string;
  recommendedTopics: string[];
}

export interface ListeningFeedbackDetail {
  taskTitle: string;
  overallScore: number;
  correctCount: number;
  totalQuestions: number;
  accuracyPercentage: number;
  timeTaken: string;
  partScores: SectionScoreEntry[];
  questionTypePerformance: QuestionTypePerformanceEntry[];
  strengths: string[];
  weakAreas: string[];
  aiSummary: string;
  recommendedTopics: string[];
}

export interface SpeakingFeedbackDetail {
  taskTitle: string;
  overallScore: number;
  cefrLevel: string;
  recordingCount: number;
  totalQuestions: number;
  criteria: CriterionScore[];
  recordingStats: {
    duration: string;
    wordsPerMinute: number;
  };
  fillerWords: FillerWordEntry[];
  mispronouncedWords: MispronouncedWordEntry[];
  strengths: string[];
  improvements: string[];
  aiSummary: string;
  practiceRecommendations: string[];
}

export interface SpeakingFeedbackDetail {
  taskTitle: string;
  overallScore: number;
  /** CEFR level, e.g. "B2". */
  cefrLevel: string;
  /** Estimated speaking speed in words per minute. */
  speakingSpeedWpm: number;
  /** Estimated count of long pauses / hesitations. */
  pauses: number;
  /** 0–100 confidence estimate. */
  confidence: number;
  /** 0–100 naturalness estimate. */
  naturalness: number;
  criteria: CriterionScore[];
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  commonMistakes: { mistake: string; correction: string }[];
  summary: string;
}

export type ReportDetail =
  | { skill: "writing"; detail: WritingFeedbackDetail }
  | { skill: "reading"; detail: ReadingFeedbackDetail }
  | { skill: "listening"; detail: ListeningFeedbackDetail }
  | { skill: "speaking"; detail: SpeakingFeedbackDetail };

export interface SavedReport {
  id: string;
  skill: IeltsSkill;
  taskTitle: string;
  taskDescription: string;
  status: "Completed";
  score: number;
  createdAt: string;
  detail:
    | WritingFeedbackDetail
    | ReadingFeedbackDetail
    | ListeningFeedbackDetail
    | SpeakingFeedbackDetail;
<<<<<<< HEAD
=======
}

export interface ReportHeaderMeta {
  testTitle: string;
  testDate?: string;
  overallScore: number;
  cefrLevel?: string;
  status?: string;
  aiSummary: string;
  backHref?: string;
  backLabel?: string;
>>>>>>> dd93bf638b3a9424786982ca72ef20d8ee1d2be5
}
