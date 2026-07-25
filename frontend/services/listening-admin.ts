import type {
  AdminListeningMockTest,
  AdminListeningPart,
  AdminListeningQuestion,
} from "@/types/admin";
import { apiFetch } from "./api";

interface ApiListeningQuestion {
  id: string;
  questionNumber: number;
  type: AdminListeningQuestion["type"];
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  explanation?: string;
}

interface ApiListeningPart {
  id: string;
  partNumber: 1 | 2 | 3 | 4;
  title: string;
  instruction: string;
  transcript?: string;
  audioStorageKey?: string;
  audioUrl?: string;
  audioDurationSeconds: number;
  mapImageUrl?: string;
  mapImageAlt?: string;
  questions: ApiListeningQuestion[];
}

interface ApiListeningMockTest {
  id: string;
  title: string;
  iconStyle: "headphones" | "broadcast" | "microphone";
  totalQuestions: number;
  totalMinutes: number;
  bufferSeconds: number;
  published: boolean;
  parts: ApiListeningPart[];
  createdAt: string;
  updatedAt: string;
}

type ApiEnvelope<T> = { success: true; data: T };

function toAdminListeningMockTest(test: ApiListeningMockTest): AdminListeningMockTest {
  return {
    id: test.id,
    title: test.title,
    iconStyle: test.iconStyle,
    published: test.published,
    parts: test.parts
      .slice()
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((part) => ({
        partNumber: part.partNumber,
        title: part.title,
        instruction: part.instruction,
        transcript: part.transcript,
        audioStorageKey: part.audioStorageKey,
        audioUrl: part.audioUrl,
        audioDurationSeconds: part.audioDurationSeconds,
        mapImageUrl: part.mapImageUrl,
        mapImageAlt: part.mapImageAlt,
        questions: part.questions
          .slice()
          .sort((a, b) => a.questionNumber - b.questionNumber)
          .map((question) => ({
            id: question.id,
            questionNumber: question.questionNumber,
            type: question.type,
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            marks: question.marks,
          })),
      })),
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
  };
}

function toApiPayload(test: Pick<AdminListeningMockTest, "title" | "iconStyle" | "parts">) {
  return {
    title: test.title,
    iconStyle: test.iconStyle,
    parts: test.parts.map((part: AdminListeningPart) => ({
      partNumber: part.partNumber,
      title: part.title,
      instruction: part.instruction,
      transcript: part.transcript || undefined,
      audioStorageKey: part.audioStorageKey || undefined,
      audioUrl: part.audioUrl || undefined,
      audioDurationSeconds: part.audioDurationSeconds,
      mapImageUrl: part.mapImageUrl || undefined,
      mapImageAlt: part.mapImageAlt || undefined,
      questions: part.questions.map((question) => ({
        questionNumber: question.questionNumber,
        type: question.type,
        questionText: question.questionText,
        options: question.options?.filter((option) => option.trim()) ?? [],
        correctAnswer: question.correctAnswer,
        marks: question.marks,
        explanation: question.explanation || undefined,
      })),
    })),
  };
}

export async function getAdminListeningTests(): Promise<AdminListeningMockTest[]> {
  const response = await apiFetch<ApiEnvelope<ApiListeningMockTest[]>>(
    "/api/listening/mock-tests"
  );
  return response.data.map(toAdminListeningMockTest);
}

export async function createAdminListeningTest(
  test: Pick<AdminListeningMockTest, "title" | "iconStyle" | "parts">
): Promise<AdminListeningMockTest> {
  const response = await apiFetch<ApiEnvelope<ApiListeningMockTest>>(
    "/api/listening/mock-tests",
    { method: "POST", body: JSON.stringify(toApiPayload(test)) }
  );
  return toAdminListeningMockTest(response.data);
}

export async function updateAdminListeningTest(
  id: string,
  test: Pick<AdminListeningMockTest, "title" | "iconStyle" | "parts">
): Promise<AdminListeningMockTest> {
  const response = await apiFetch<ApiEnvelope<ApiListeningMockTest>>(
    `/api/listening/mock-tests/${id}`,
    { method: "PATCH", body: JSON.stringify(toApiPayload(test)) }
  );
  return toAdminListeningMockTest(response.data);
}

export async function deleteAdminListeningTest(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/api/listening/mock-tests/${id}`, {
    method: "DELETE",
  });
}

export async function setAdminListeningTestPublished(
  id: string,
  published: boolean
): Promise<AdminListeningMockTest> {
  const endpoint = published ? "publish" : "unpublish";
  const response = await apiFetch<ApiEnvelope<ApiListeningMockTest>>(
    `/api/listening/mock-tests/${id}/${endpoint}`,
    { method: "PATCH" }
  );
  return toAdminListeningMockTest(response.data);
}
