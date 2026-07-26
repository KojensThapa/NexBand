/**
 * Framework-independent contracts for the deterministic speaking evaluator.
 * Provider adapters may enrich these values, but the algorithm never imports
 * Fastify, Prisma, or an AI SDK.
 */
export type SpeakingPartNumber = 1 | 2 | 3 | "mock";

export type SpeakingPace = "TOO_SLOW" | "NORMAL" | "TOO_FAST";

export interface QuestionMetadata {
  questionIds?: string[];
  topic?: string;
  prompt?: string;
  expectedDurationSeconds?: number;
  questionCount?: number;
}

export interface GrammarError {
  message: string;
  category?: string;
  suggestion?: string;
  startOffset?: number;
  endOffset?: number;
}

/** Scores are IELTS-band equivalents (0–9). Providers returning 0–100 are
 * normalised at the boundary before their result reaches the algorithm. */
export interface GrammarAnalysis {
  score: number;
  errors: GrammarError[];
  suggestions: string[];
}

export interface MispronouncedWord {
  word: string;
  suggestedPronunciation?: string;
  confidence?: number;
}

export interface PronunciationAnalysis {
  score: number;
  confidenceScore: number;
  mispronouncedWords: MispronouncedWord[];
  supported: boolean;
}

/** AI assessment of whether a response addresses the examiner's prompt. */
export interface ResponseRelevanceAnalysis {
  score: number;
  answeredQuestion: boolean;
  relevance: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  missingPoints: string[];
}

export interface FillerWordCount {
  word: string;
  count: number;
}

export interface FillerWordAnalysis {
  fillerWords: FillerWordCount[];
  count: number;
  penalty: number;
}

export interface FluencyMetrics {
  totalWords: number;
  totalSentences: number;
  averageSentenceLength: number;
  wordsPerMinute: number;
  speakingPace: SpeakingPace;
  score: number;
}

export interface RepeatedWord {
  word: string;
  count: number;
}

export interface VocabularyMetrics {
  totalWords: number;
  uniqueWords: number;
  vocabularyDiversity: number;
  lexicalRichness: number;
  advancedWordCount: number;
  repeatedWords: RepeatedWord[];
  score: number;
}

/**
 * A replaceable vocabulary source. Dataset adapters can provide either a set
 * or their own lookup without changing calculator code.
 */
export interface VocabularyDataset {
  stopWords?: ReadonlySet<string>;
  advancedWords?: ReadonlySet<string>;
  isAdvancedWord?: (word: string) => boolean;
}

export interface SpeakingEvaluationInput {
  transcript: string;
  durationSeconds: number;
  grammarAnalysis: GrammarAnalysis;
  pronunciationAnalysis: PronunciationAnalysis;
  /** Optional for backwards-compatible callers that have no question prompt. */
  responseRelevanceAnalysis?: ResponseRelevanceAnalysis;
  speechToTextConfidence?: number;
  partNumber: SpeakingPartNumber;
  questionMetadata: QuestionMetadata;
  vocabularyDataset?: VocabularyDataset;
}

export interface SpeakingEvaluationResult {
  status: "COMPLETED" | "INCOMPLETE";
  partNumber: SpeakingPartNumber;
  transcript: string;
  question: string;
  duration: number;
  wordsPerMinute: number;
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  pronunciationScore: number;
  responseRelevanceScore: number;
  overallBand: number;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  fillerWords: FillerWordAnalysis;
  mispronouncedWords: MispronouncedWord[];
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  fluency: FluencyMetrics;
  vocabulary: VocabularyMetrics;
  grammar: GrammarAnalysis;
  pronunciation: PronunciationAnalysis;
  responseRelevance: ResponseRelevanceAnalysis;
  speechToTextConfidence?: number;
  algorithmVersion: "speaking-v2";
}

export interface BandCriteria {
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  pronunciationScore: number;
}
