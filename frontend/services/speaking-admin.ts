import type { AdminSpeakingCategory, AdminSpeakingMockTest } from "@/types/admin";
import { apiFetch } from "./api";

type ApiSpeakingCategory = "MOCK" | "PART_1" | "PART_2" | "PART_3";

interface ApiSpeakingQuestion {
  id: string;
  questionNumber: number;
  text: string;
}

interface ApiSpeakingPart {
  id: string;
  partNumber: 1 | 2 | 3;
  cueCardTitle: string | null;
  cueCardDescription: string | null;
  bulletPoints: string[];
  closingQuestion: string | null;
  preparationMinutes: number;
  speakingMinutes: number;
  durationMinutes: number;
  topic: string | null;
  questions: ApiSpeakingQuestion[];
}

interface ApiSpeakingTest {
  id: string;
  title: string;
  category: ApiSpeakingCategory;
  isPublished: boolean;
  parts: ApiSpeakingPart[];
  createdAt: string;
  updatedAt: string;
}

type ApiEnvelope<T> = { success: true; data: T };

const fromApiCategory: Record<ApiSpeakingCategory, AdminSpeakingCategory> = {
  MOCK: "mock",
  PART_1: "part-1",
  PART_2: "part-2",
  PART_3: "part-3",
};

function toAdminSpeakingTest(test: ApiSpeakingTest): AdminSpeakingMockTest {
  const part1 = test.parts.find((part) => part.partNumber === 1);
  const part2 = test.parts.find((part) => part.partNumber === 2);
  const part3 = test.parts.find((part) => part.partNumber === 3);

  return {
    id: test.id,
    title: test.title,
    category: fromApiCategory[test.category],
    published: test.isPublished,
    part1: {
      questions: (part1?.questions ?? [])
        .slice()
        .sort((a, b) => a.questionNumber - b.questionNumber)
        .map((question) => ({ id: question.id, text: question.text })),
    },
    part2: {
      cueCardTitle: part2?.cueCardTitle ?? "",
      cueCardDescription: part2?.cueCardDescription ?? "",
      bulletPoints: part2?.bulletPoints ?? [],
      closingQuestion: part2?.closingQuestion ?? "",
      preparationMinutes: part2?.preparationMinutes ?? 1,
      speakingMinutes: part2?.speakingMinutes ?? 2,
    },
    part3: {
      topic: part3?.topic ?? "",
      questions: (part3?.questions ?? [])
        .slice()
        .sort((a, b) => a.questionNumber - b.questionNumber)
        .map((question) => ({ id: question.id, text: question.text })),
    },
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
  };
}

function toApiPayload(
  test: Pick<AdminSpeakingMockTest, "title" | "category" | "part1" | "part2" | "part3">
) {
  return {
    title: test.title,
    category: test.category,
    part1: {
      questions: test.part1.questions
        .filter((question) => question.text.trim())
        .map((question) => ({ text: question.text })),
      durationMinutes: 5,
    },
    part2: {
      cueCardTitle: test.part2.cueCardTitle,
      cueCardDescription: test.part2.cueCardDescription,
      bulletPoints: test.part2.bulletPoints.filter((point) => point.trim()),
      closingQuestion: test.part2.closingQuestion,
      preparationMinutes: test.part2.preparationMinutes,
      speakingMinutes: test.part2.speakingMinutes,
    },
    part3: {
      topic: test.part3.topic,
      questions: test.part3.questions
        .filter((question) => question.text.trim())
        .map((question) => ({ text: question.text })),
      durationMinutes: 5,
    },
  };
}

export async function getAdminSpeakingTests(): Promise<AdminSpeakingMockTest[]> {
  const response = await apiFetch<ApiEnvelope<ApiSpeakingTest[]>>("/api/speaking/mock-tests");
  return response.data.map(toAdminSpeakingTest);
}

export async function createAdminSpeakingTest(
  test: Pick<AdminSpeakingMockTest, "title" | "category" | "part1" | "part2" | "part3">
): Promise<AdminSpeakingMockTest> {
  const response = await apiFetch<ApiEnvelope<ApiSpeakingTest>>("/api/speaking/mock-tests", {
    method: "POST",
    body: JSON.stringify(toApiPayload(test)),
  });
  return toAdminSpeakingTest(response.data);
}

export async function updateAdminSpeakingTest(
  id: string,
  test: Pick<AdminSpeakingMockTest, "title" | "category" | "part1" | "part2" | "part3">
): Promise<AdminSpeakingMockTest> {
  const response = await apiFetch<ApiEnvelope<ApiSpeakingTest>>(
    `/api/speaking/mock-tests/${id}`,
    { method: "PATCH", body: JSON.stringify(toApiPayload(test)) }
  );
  return toAdminSpeakingTest(response.data);
}

export async function deleteAdminSpeakingTest(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/api/speaking/mock-tests/${id}`, { method: "DELETE" });
}

export async function setAdminSpeakingTestPublished(
  id: string,
  published: boolean
): Promise<AdminSpeakingMockTest> {
  const endpoint = published ? "publish" : "unpublish";
  const response = await apiFetch<ApiEnvelope<ApiSpeakingTest>>(
    `/api/speaking/mock-tests/${id}/${endpoint}`,
    { method: "PATCH" }
  );
  return toAdminSpeakingTest(response.data);
}
