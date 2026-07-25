/** Framework- and provider-independent contracts for Writing evaluation. */

export type WritingTaskNumber = 1 | 2;
export type WritingReportStatus = "Completed" | "Incomplete";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface WritingIssue {
  message: string;
  category?: string;
  suggestion?: string;
  startOffset?: number;
  endOffset?: number;
}

/** Data supplied by the Grammar Provider. Scores may be 0–9 or 0–100. */
export interface GrammarResult {
  score: number;
  grammarErrors: WritingIssue[];
  spellingErrors: WritingIssue[];
  punctuationErrors: WritingIssue[];
  suggestions: string[];
}

/** Data supplied by the Essay Analysis Provider. All scores may be 0–9 or 0–100. */
export interface EssayAnalysis {
  taskAchievementScore?: number;
  coherenceScore?: number;
  vocabularyScore?: number;
  estimatedBand?: number;
  summary?: string;
  /** A ratio from 0–1 or a percentage from 0–100. */
  keywordCoverage?: number;
}

export interface WritingQuestionMetadata {
  prompt?: string;
  title?: string;
  taskType?: string;
  expectedKeywords?: string[];
}

/** Dataset seam for later JSON-backed academic vocabulary resources. */
export interface WritingVocabularyDataset {
  stopWords?: ReadonlySet<string>;
  academicWords?: ReadonlySet<string>;
  isAcademicWord?: (word: string) => boolean;
}

export interface RepeatedWord {
  word: string;
  count: number;
}

export interface WordCountMetrics {
  wordCount: number;
  minimumWordCount: number;
  isBelowMinimum: boolean;
  wordCountPenalty: number;
}

export interface VocabularyMetrics {
  uniqueWords: number;
  repeatedWords: RepeatedWord[];
  vocabularyDiversity: number;
  lexicalRichness: number;
  academicWordCount: number;
  score: number;
}

export interface TaskAchievementMetrics {
  score: number;
  overviewPresent?: boolean;
  mainTrendPresent?: boolean;
  comparisonPresent?: boolean;
  dataDescriptionPresent?: boolean;
  introductionPresent?: boolean;
  opinionPresent?: boolean;
  supportingIdeasPresent?: boolean;
  examplesPresent?: boolean;
  conclusionPresent?: boolean;
  keywordCoverage: number;
}

export interface CoherenceMetrics {
  paragraphCount: number;
  averageParagraphLength: number;
  transitionWordCount: number;
  linkingWordCount: number;
  averageSentenceLength: number;
  score: number;
}

export interface WritingEvaluationInput {
  essay: string;
  taskNumber: WritingTaskNumber;
  grammarResult: GrammarResult;
  essayAnalysis: EssayAnalysis;
  questionMetadata: WritingQuestionMetadata;
  /** A mock report supplies both tasks; one task yields Incomplete. */
  completedTaskNumbers?: readonly WritingTaskNumber[];
  vocabularyDataset?: WritingVocabularyDataset;
}

export interface WritingEvaluationResult {
  status: WritingReportStatus;
  taskNumber: WritingTaskNumber;
  wordCount: number;
  uniqueWords: number;
  repeatedWords: RepeatedWord[];
  grammarErrors: WritingIssue[];
  spellingErrors: WritingIssue[];
  punctuationErrors: WritingIssue[];
  taskAchievementScore: number;
  coherenceScore: number;
  vocabularyScore: number;
  grammarScore: number;
  overallBand: number;
  cefrLevel: CefrLevel;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  wordCountMetrics: WordCountMetrics;
  vocabulary: VocabularyMetrics;
  taskAchievement: TaskAchievementMetrics;
  coherence: CoherenceMetrics;
  grammarSuggestions: string[];
  essaySummary?: string;
  algorithmVersion: "writing-v1";
}

export interface WritingMockReport {
  status: WritingReportStatus;
  taskNumber: "mock";
  taskReports: WritingEvaluationResult[];
  wordCount: number;
  uniqueWords: number;
  repeatedWords: RepeatedWord[];
  grammarErrors: WritingIssue[];
  spellingErrors: WritingIssue[];
  punctuationErrors: WritingIssue[];
  taskAchievementScore: number;
  coherenceScore: number;
  vocabularyScore: number;
  grammarScore: number;
  overallBand: number;
  cefrLevel: CefrLevel;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  algorithmVersion: "writing-v1";
}
