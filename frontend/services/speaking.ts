import { apiFetch } from "./api";
import type {
  SpeakingBoardMode,
  SpeakingMockTest,
  SpeakingPart1Task,
  SpeakingPart2Task,
  SpeakingPart3Task,
} from "@/types/speaking";

type ApiEnvelope<T> = { success: true; data: T };

export type SpeakingCategory = SpeakingBoardMode;

export interface SpeakingTestCard {
  id: string;
  title: string;
  mode: SpeakingCategory;
  typeLabel: string;
}

export type SpeakingLearnerTask =
  | { mode: "mock"; task: SpeakingMockTest }
  | { mode: "part-1"; task: SpeakingPart1Task }
  | { mode: "part-2"; task: SpeakingPart2Task }
  | { mode: "part-3"; task: SpeakingPart3Task };

export interface SpeakingRecordingInput {
  audioUrl?: string;
  audioStorageKey?: string;
  mimeType?: string;
  durationSeconds: number;
  transcript?: string;
}

export interface SpeakingQuestionMetadata {
  questionIds?: string[];
  topic?: string;
  prompt?: string;
  expectedDurationSeconds?: number;
  questionCount?: number;
}

export interface SpeakingEvaluationRecording extends SpeakingRecordingInput {
  responseKey: string;
  questionMetadata: SpeakingQuestionMetadata;
}

export interface SpeakingEvaluationSubmissionInput {
  mode: "part" | "mock";
  testId?: string;
  attemptId?: string;
  parts: Array<{
    partNumber: 1 | 2 | 3;
    questionMetadata: SpeakingQuestionMetadata;
    recordings: SpeakingEvaluationRecording[];
  }>;
}

export interface SpeakingEvaluationReport {
  status: "COMPLETED" | "INCOMPLETE";
  partNumber: 1 | 2 | 3 | "mock";
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
  cefrLevel: string;
  fillerWords: { fillerWords: Array<{ word: string; count: number }>; count: number; penalty: number };
  mispronouncedWords: Array<{ word: string; suggestedPronunciation?: string; confidence?: number }>;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  fluency: { speakingPace: "TOO_SLOW" | "NORMAL" | "TOO_FAST" };
  grammar: {
    score: number;
    errors: Array<{ message: string; category?: string; suggestion?: string }>;
    suggestions: string[];
  };
  pronunciation: { confidenceScore: number; supported: boolean };
  responseRelevance: {
    score: number;
    answeredQuestion: boolean;
    relevance: "HIGH" | "MEDIUM" | "LOW";
    reason: string;
    missingPoints: string[];
  };
  speechToTextConfidence?: number;
  algorithmVersion: string;
}

export interface SpeakingEvaluationSubmission {
  id: string;
  status: "COMPLETED" | "INCOMPLETE" | "FAILED" | "PROCESSING" | "PENDING";
  reports: Array<{
    scope: "PART" | "MOCK";
    partNumber: number | null;
    evaluationData: SpeakingEvaluationReport;
  }>;
}

export interface SpeakingAttempt {
  id: string;
  testId: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "INCOMPLETE";
  recordings: Record<string, SpeakingRecordingInput>;
  startedAt: string;
  submittedAt: string | null;
  updatedAt: string;
}

export interface SpeakingResult {
  id: string;
  attemptId: string;
  recordingCount: number;
  totalQuestions: number;
  totalDurationSeconds: number;
  completionPercentage: number;
  basicScore: number;
  estimatedBandScore: number;
  evaluationMode: "BASIC" | "AI";
  algorithmVersion: string;
  feedback: { summary: string; strengths: string[]; improvements: string[] } | null;
  createdAt: string;
}

function markBackendTask(result: SpeakingLearnerTask): SpeakingLearnerTask {
  return { ...result, task: { ...result.task, isBackendTest: true } } as SpeakingLearnerTask;
}

export async function getPublishedSpeakingTests(
  category?: SpeakingCategory
): Promise<SpeakingTestCard[]> {
  const query = new URLSearchParams({ limit: "50" });
  if (category) query.set("category", category);

  const response = await apiFetch<
    ApiEnvelope<{ tests: SpeakingTestCard[]; pagination: unknown }>
  >(`/api/speaking/tests?${query.toString()}`);
  return response.data.tests;
}

export async function getPublishedSpeakingTest(testId: string): Promise<SpeakingLearnerTask> {
  const response = await apiFetch<ApiEnvelope<SpeakingLearnerTask>>(
    `/api/speaking/tests/${testId}`
  );
  return markBackendTask(response.data);
}

export async function startSpeakingAttempt(testId: string) {
  const response = await apiFetch<ApiEnvelope<{ attempt: SpeakingAttempt } & SpeakingLearnerTask>>(
    `/api/speaking/tests/${testId}/attempts`,
    { method: "POST" }
  );
  const { attempt, ...learnerTask } = response.data;
  return { attempt, ...markBackendTask(learnerTask) };
}

export async function getSpeakingAttempt(attemptId: string) {
  const response = await apiFetch<ApiEnvelope<{ attempt: SpeakingAttempt } & SpeakingLearnerTask>>(
    `/api/speaking/attempts/${attemptId}`
  );
  const { attempt, ...learnerTask } = response.data;
  return { attempt, ...markBackendTask(learnerTask) };
}

export async function saveSpeakingRecordings(
  attemptId: string,
  recordings: Record<string, SpeakingRecordingInput>
) {
  const response = await apiFetch<ApiEnvelope<SpeakingAttempt>>(
    `/api/speaking/attempts/${attemptId}/recordings`,
    { method: "PUT", body: JSON.stringify({ recordings }) }
  );
  return response.data;
}

export async function submitSpeakingAttempt(
  attemptId: string,
  recordings?: Record<string, SpeakingRecordingInput>
) {
  const response = await apiFetch<
    ApiEnvelope<{ attempt: SpeakingAttempt; result: SpeakingResult; alreadySubmitted: boolean }>
  >(`/api/speaking/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify({ recordings }),
  });
  return response.data;
}

/** Calls the provider-backed endpoint without changing the legacy attempt APIs. */
export async function submitSpeakingEvaluation(input: SpeakingEvaluationSubmissionInput) {
  const response = await apiFetch<ApiEnvelope<SpeakingEvaluationSubmission>>(
    "/api/speaking/submissions",
    { method: "POST", body: JSON.stringify(input) }
  );
  return response.data;
}

export async function getSpeakingResult(attemptId: string) {
  const response = await apiFetch<ApiEnvelope<SpeakingResult>>(
    `/api/speaking/attempts/${attemptId}/result`
  );
  return response.data;
}
