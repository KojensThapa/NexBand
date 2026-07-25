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
  durationSeconds: number;
  transcript?: string;
}

export interface SpeakingAttempt {
  id: string;
  testId: string;
  status: "IN_PROGRESS" | "SUBMITTED";
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

export async function getSpeakingResult(attemptId: string) {
  const response = await apiFetch<ApiEnvelope<SpeakingResult>>(
    `/api/speaking/attempts/${attemptId}/result`
  );
  return response.data;
}
