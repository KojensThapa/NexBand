import type { ReadingMockTest } from "@/types/reading";
import { apiFetch } from "./api";

export interface ReadingTestCard {
  id: string;
  title: string;
  totalMinutes: number;
  totalQuestions: number;
  tags: string[];
  isBackendTest: true;
}

export interface ReadingAttempt {
  id: string;
  mockTestId: string;
  status: "IN_PROGRESS" | "SUBMITTED";
  answers: Record<string, string>;
  startedAt: string;
  submittedAt: string | null;
  updatedAt: string;
}

export interface ReadingSectionPerformance {
  section: 1 | 2 | 3;
  attempted: number;
  skipped: number;
  correct: number;
  wrong: number;
  accuracy: number | null;
  status: "Attempted" | "Not Attempted";
}

export interface ReadingQuestionTypePerformance {
  type: string;
  label: string;
  total: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
  status: "Attempted" | "Not Attempted";
}

export interface ReadingEvaluationReport {
  status: "Completed" | "Incomplete";
  totalQuestions: number;
  attemptedQuestions: number;
  skippedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  attemptAccuracy: number | null;
  overallBand: number | null;
  estimatedBand: number | null;
  sectionPerformance: ReadingSectionPerformance[];
  questionTypePerformance: ReadingQuestionTypePerformance[];
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
}

export interface ReadingResult {
  id: string;
  attemptId: string;
  correctAnswers: number;
  totalQuestions: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  bandScore: number;
  algorithmVersion: string;
  report: ReadingEvaluationReport | null;
  createdAt: string;
}

type ApiEnvelope<T> = { success: true; data: T };

export async function getPublishedReadingTests(): Promise<ReadingTestCard[]> {
  const response = await apiFetch<
    ApiEnvelope<{ tests: Omit<ReadingTestCard, "isBackendTest">[]; pagination: unknown }>
  >("/api/reading/tests?limit=50");

  return response.data.tests.map((test) => ({ ...test, isBackendTest: true as const }));
}

export async function getPublishedReadingTest(testId: string): Promise<ReadingMockTest> {
  const response = await apiFetch<ApiEnvelope<ReadingMockTest>>(`/api/reading/tests/${testId}`);
  return { ...response.data, isBackendTest: true };
}

export async function startReadingAttempt(testId: string) {
  const response = await apiFetch<ApiEnvelope<{ attempt: ReadingAttempt; test: ReadingMockTest }>>(
    `/api/reading/tests/${testId}/attempts`,
    { method: "POST" }
  );
  return response.data;
}

export async function saveReadingAnswers(attemptId: string, answers: Record<string, string>) {
  const response = await apiFetch<ApiEnvelope<ReadingAttempt>>(
    `/api/reading/attempts/${attemptId}/answers`,
    { method: "PUT", body: JSON.stringify({ answers }) }
  );
  return response.data;
}

export async function submitReadingAttempt(attemptId: string, answers: Record<string, string>) {
  const response = await apiFetch<
    ApiEnvelope<{ attempt: ReadingAttempt; result: ReadingResult; alreadySubmitted: boolean }>
  >(`/api/reading/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  return response.data;
}

export async function getReadingResult(attemptId: string) {
  const response = await apiFetch<ApiEnvelope<ReadingResult>>(
    `/api/reading/attempts/${attemptId}/result`
  );
  return response.data;
}
