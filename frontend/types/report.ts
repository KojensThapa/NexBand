import type { IeltsSkill } from "./exam";

export interface CriterionScore {  id: string;
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

export interface WritingFeedbackDetail {
  taskTitle: string;
  taskPrompt: string;
  responseText: string;
  wordCount: number;
  overallScore: number;
  cefrLevel: string;
  criteria: CriterionScore[];
  errors: FeedbackError[];
}

export interface ReadingFeedbackDetail {
  taskTitle: string;
  overallScore: number;
  correctCount: number;
  totalQuestions: number;
  summary: string;
}

export interface ListeningFeedbackDetail {
  taskTitle: string;
  overallScore: number;
  correctCount: number;
  totalQuestions: number;
  summary: string;
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
}
