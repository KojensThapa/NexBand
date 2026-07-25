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
  >(`/api/writing/tests?${query.toString()}`);
  return response.data.tests;
}

export async function getPublishedWritingTest(testId: string): Promise<WritingMockTest> {
  const response = await apiFetch<ApiEnvelope<WritingMockTest>>(`/api/writing/tests/${testId}`);
  return response.data;
}

export async function startWritingAttempt(testId: string) {
  const response = await apiFetch<
    ApiEnvelope<{ attempt: WritingAttempt; test: WritingMockTest }>
  >(`/api/writing/tests/${testId}/attempts`, { method: "POST" });
  return response.data;
}

export async function saveWritingDraft(
  attemptId: string,
  essays: Array<{ taskId: string; content: string }>
) {
  const response = await apiFetch<ApiEnvelope<WritingAttempt>>(
    `/api/writing/attempts/${attemptId}/draft`,
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
  >(`/api/writing/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify({ essays }),
  });
  return response.data;
}

export interface WritingIssue {
  message: string;
  category?: string;
  suggestion?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface WritingEvaluationResultData {
  status: "Completed" | "Incomplete";
  wordCount: number;
  uniqueWords: number;
  repeatedWords: Array<{ word: string; count: number }>;
  grammarErrors: WritingIssue[];
  spellingErrors: WritingIssue[];
  punctuationErrors: WritingIssue[];
  taskAchievementScore: number;
  coherenceScore: number;
  vocabularyScore: number;
  grammarScore: number;
  overallBand: number;
  cefrLevel: string;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  wordCountMetrics: { wordCount: number; minimumWordCount: number; isBelowMinimum: boolean; wordCountPenalty: number };
  grammarSuggestions: string[];
  essaySummary?: string;
  algorithmVersion: string;
}

export interface WritingReportEntry {
  id: string;
  reportKey: string;
  scope: "TASK" | "MOCK";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  taskNumber: 1 | 2 | null;
  wordCount: number;
  uniqueWords: number;
  repeatedWords: Array<{ word: string; count: number }>;
  grammarScore: number;
  vocabularyScore: number;
  taskAchievementScore: number;
  coherenceScore: number;
  overallBand: number;
  cefrLevel: string;
  grammarErrors: WritingIssue[];
  spellingErrors: WritingIssue[];
  punctuationErrors: WritingIssue[];
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  evaluationData: WritingEvaluationResultData;
  algorithmVersion: string;
}

export interface WritingSubmission {
  id: string;
  userId: string;
  testId: string | null;
  attemptId: string | null;
  mode: "TASK" | "MOCK";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
  reports: WritingReportEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWritingSubmissionInput {
  mode: "task" | "mock";
  testId?: string;
  attemptId?: string;
  tasks: Array<{
    taskId?: string;
    taskNumber: 1 | 2;
    essay: string;
    questionMetadata?: {
      prompt?: string;
      title?: string;
      taskType?: string;
      expectedKeywords?: string[];
    };
  }>;
}

export async function createWritingSubmission(input: CreateWritingSubmissionInput) {
  const response = await apiFetch<ApiEnvelope<WritingSubmission>>("/api/writing/submissions", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function getWritingSubmission(submissionId: string) {
  const response = await apiFetch<ApiEnvelope<WritingSubmission>>(
    `/api/writing/submissions/${submissionId}`
  );
  return response.data;
}
