import type { AdminWritingCategory, AdminWritingQuestion } from "@/types/admin";
import type { WritingTask1Type } from "@/types/writing";
import { apiFetch } from "./api";

interface ApiWritingTask {
  id: string;
  testId: string;
  taskNumber: 1 | 2;
  title: string;
  prompt: string;
  typeLabel?: string;
  task1Type?: WritingTask1Type;
  imageUrl?: string;
  imageAlt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiWritingTest {
  id: string;
  title: string;
  category: AdminWritingCategory;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  tasks: ApiWritingTask[];
}

type ApiEnvelope<T> = { success: true; data: T };

function toAdminWritingQuestions(test: ApiWritingTest): AdminWritingQuestion[] {
  return test.tasks.map((task) => ({
    id: test.category === "mock" ? `${test.id}:${task.taskNumber}` : test.id,
    category: test.category,
    taskNumber: task.taskNumber,
    title: task.title,
    prompt: task.prompt,
    typeLabel: task.typeLabel,
    task1Type: task.task1Type,
    imageUrl: task.imageUrl,
    imageAlt: task.imageAlt,
    mockTestId: test.category === "mock" ? test.id : undefined,
    mockTestTitle: test.category === "mock" ? test.title : undefined,
    published: test.published,
    createdAt: test.createdAt,
  }));
}

export async function getAdminWritingQuestions(): Promise<AdminWritingQuestion[]> {
  const response = await apiFetch<ApiEnvelope<ApiWritingTest[]>>("/api/writing/admin/tests");
  return response.data.flatMap(toAdminWritingQuestions);
}

export interface SaveAdminMockTestInput {
  mockTestId?: string;
  title: string;
  published?: boolean;
  part1: {
    title: string;
    prompt: string;
    task1Type: WritingTask1Type;
    typeLabel?: string;
    imageUrl?: string;
    imageAlt?: string;
  };
  part2: {
    title: string;
    prompt: string;
    typeLabel?: string;
  };
}

export async function saveAdminMockTest(
  input: SaveAdminMockTestInput
): Promise<AdminWritingQuestion[]> {
  const payload = {
    title: input.title,
    category: "mock" as const,
    published: input.published,
    tasks: [
      {
        taskNumber: 1 as const,
        title: input.part1.title,
        prompt: input.part1.prompt,
        task1Type: input.part1.task1Type,
        typeLabel: input.part1.typeLabel,
        imageUrl: input.part1.imageUrl,
        imageAlt: input.part1.imageAlt,
      },
      {
        taskNumber: 2 as const,
        title: input.part2.title,
        prompt: input.part2.prompt,
        typeLabel: input.part2.typeLabel,
      },
    ],
  };

  const response = input.mockTestId
    ? await apiFetch<ApiEnvelope<ApiWritingTest>>(`/api/writing/admin/tests/${input.mockTestId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    : await apiFetch<ApiEnvelope<ApiWritingTest>>("/api/writing/admin/tests", {
        method: "POST",
        body: JSON.stringify(payload),
      });

  return toAdminWritingQuestions(response.data);
}

export interface SaveAdminPracticeQuestionInput {
  id?: string;
  category: "task-1" | "task-2";
  title: string;
  prompt: string;
  published?: boolean;
  task1Type?: WritingTask1Type;
  typeLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export async function saveAdminPracticeQuestion(
  input: SaveAdminPracticeQuestionInput
): Promise<AdminWritingQuestion> {
  const payload = {
    title: input.title,
    category: input.category,
    published: input.published,
    tasks: [
      {
        taskNumber: input.category === "task-2" ? (2 as const) : (1 as const),
        title: input.title,
        prompt: input.prompt,
        task1Type: input.category === "task-1" ? input.task1Type : undefined,
        typeLabel: input.typeLabel,
        imageUrl: input.imageUrl,
        imageAlt: input.imageAlt,
      },
    ],
  };

  const response = input.id
    ? await apiFetch<ApiEnvelope<ApiWritingTest>>(`/api/writing/admin/tests/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    : await apiFetch<ApiEnvelope<ApiWritingTest>>("/api/writing/admin/tests", {
        method: "POST",
        body: JSON.stringify(payload),
      });

  return toAdminWritingQuestions(response.data)[0];
}

export async function deleteAdminWritingTest(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/api/writing/admin/tests/${id}`, { method: "DELETE" });
}

export async function setAdminWritingTestPublished(
  id: string,
  published: boolean
): Promise<AdminWritingQuestion[]> {
  const endpoint = published ? "publish" : "unpublish";
  const response = await apiFetch<ApiEnvelope<ApiWritingTest>>(
    `/api/writing/admin/tests/${id}/${endpoint}`,
    { method: "PATCH" }
  );
  return toAdminWritingQuestions(response.data);
}
