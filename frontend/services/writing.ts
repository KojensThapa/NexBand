import { apiFetch } from "./api";
import type { WritingMockTest, WritingTask1Type } from "@/types/writing";

type ApiEnvelope<T> = { success: true; data: T };

export type WritingCategory = "mock" | "task-1" | "task-2";

export interface WritingPublishedTestSummary {
  id: string;
  title: string;
  category: WritingCategory;
  totalMinutes: number;
  tasks: Array<{
    id: string;
    taskNumber: 1 | 2;
    title: string;
    typeLabel?: string;
    task1Type?: WritingTask1Type;
  }>;
}

export interface WritingEssay {
  id: string;
  taskId: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WritingAttempt {
  id: string;
  testId: string;
  status: "DRAFT" | "PENDING_ANALYSIS";
  startedAt: string;
  submittedAt: string | null;
  updatedAt: string;
  essays: WritingEssay[];
}

export async function getPublishedWritingTests(category?: WritingCategory) {
  const query = new URLSearchParams({ limit: "50" });
  if (category) query.set("category", category);

  const response = await apiFetch<
    ApiEnvelope<{ tests: WritingPublishedTestSummary[]; pagination: unknown }>
  >(`/writing/tests?${query.toString()}`);
  return response.data.tests;
}

export async function getPublishedWritingTest(testId: string): Promise<WritingMockTest> {
  const response = await apiFetch<ApiEnvelope<WritingMockTest>>(`/writing/tests/${testId}`);
  return response.data;
}

export async function startWritingAttempt(testId: string) {
  const response = await apiFetch<
    ApiEnvelope<{ attempt: WritingAttempt; test: WritingMockTest }>
  >(`/writing/tests/${testId}/attempts`, { method: "POST" });
  return response.data;
}

export async function saveWritingDraft(
  attemptId: string,
  essays: Array<{ taskId: string; content: string }>
) {
  const response = await apiFetch<ApiEnvelope<WritingAttempt>>(
    `/writing/attempts/${attemptId}/draft`,
    { method: "PUT", body: JSON.stringify({ essays }) }
  );
  return response.data;
}

export async function submitWritingAttempt(
  attemptId: string,
  essays: Array<{ taskId: string; content: string }>
) {
  const response = await apiFetch<
    ApiEnvelope<{ attempt: WritingAttempt; alreadySubmitted: boolean }>
  >(`/writing/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify({ essays }),
  });
  return response.data;
}
