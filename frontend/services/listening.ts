import { API_BASE_URL } from "@/lib/constants";
import type { ListeningMockTest } from "@/types/listening";
import { apiFetch } from "./api";

export interface ListeningTestCard {
  id: string;
  title: string;
  iconStyle: "headphones" | "broadcast" | "microphone";
  typeLabel: string;
  totalMinutes: number;
  bufferSeconds: number;
  totalQuestions: number;
  isBackendTest: true;
}

export interface ListeningAttempt {
  id: string;
  mockTestId: string;
  status: "IN_PROGRESS" | "SUBMITTED";
  answers: Record<string, string>;
  startedAt: string;
  submittedAt: string | null;
  updatedAt: string;
}

export interface ListeningPartPerformance {
  part: 1 | 2 | 3 | 4;
  attempted: number;
  skipped: number;
  correct: number;
  wrong: number;
  accuracy: number | null;
  status: "Attempted" | "Not Attempted";
}

export interface ListeningQuestionTypePerformance {
  type: string;
  label: string;
  total: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
  status: "Attempted" | "Not Attempted";
}

export interface ListeningEvaluationReport {
  status: "Completed" | "Incomplete";
  totalQuestions: number;
  attemptedQuestions: number;
  skippedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  attemptAccuracy: number | null;
  overallBand: number | null;
  estimatedBand: number | null;
  partPerformance: ListeningPartPerformance[];
  questionTypePerformance: ListeningQuestionTypePerformance[];
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
}

export interface ListeningResult {
  id: string;
  attemptId: string;
  correctAnswers: number;
  totalQuestions: number;
  rawScore: number;
  totalMarks: number;
  percentage: number;
  bandScore: number;
  algorithmVersion: string;
  report: ListeningEvaluationReport | null;
  createdAt: string;
}

type ApiEnvelope<T> = { success: true; data: T };

export async function getPublishedListeningTests() {
  const response = await apiFetch<
    ApiEnvelope<{ tests: Omit<ListeningTestCard, "isBackendTest">[]; pagination: unknown }>
  >("/api/listening/tests?limit=50");
  return response.data.tests.map((test) => ({ ...test, isBackendTest: true as const }));
}

export async function getPublishedListeningTest(testId: string): Promise<ListeningMockTest> {
  const response = await apiFetch<ApiEnvelope<ListeningMockTest>>(`/api/listening/tests/${testId}`);
  return {
    ...response.data,
    isBackendTest: true,
    parts: response.data.parts.map((part) => ({
      ...part,
      audioUrl: part.audioUrl?.startsWith("/")
        ? `${API_BASE_URL}${part.audioUrl}`
        : part.audioUrl,
    })),
  };
}

export async function startListeningAttempt(testId: string) {
  const response = await apiFetch<ApiEnvelope<{ attempt: ListeningAttempt; test: ListeningMockTest }>>(
    `/api/listening/tests/${testId}/attempts`,
    { method: "POST" }
  );
  return response.data;
}

export async function saveListeningAnswers(
  attemptId: string,
  answers: Record<string, string>
) {
  const response = await apiFetch<ApiEnvelope<ListeningAttempt>>(
    `/api/listening/attempts/${attemptId}/answers`,
    { method: "PUT", body: JSON.stringify({ answers }) }
  );
  return response.data;
}

export async function submitListeningAttempt(
  attemptId: string,
  answers: Record<string, string>
) {
  const response = await apiFetch<
    ApiEnvelope<{ attempt: ListeningAttempt; result: ListeningResult; alreadySubmitted: boolean }>
  >(`/api/listening/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  return response.data;
}

export async function getListeningResult(attemptId: string) {
  const response = await apiFetch<ApiEnvelope<ListeningResult>>(
    `/api/listening/attempts/${attemptId}/result`
  );
  return response.data;
}
