import type {
  AdminReadingQuestionType,
  AdminReadingTest,
} from "@/types/admin";
import { apiFetch } from "./api";

type ApiReadingQuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE_NOT_GIVEN"
  | "YES_NO_NOT_GIVEN"
  | "MATCHING_HEADING"
  | "MATCHING_INFORMATION"
  | "MATCHING_FEATURES"
  | "MATCHING_SENTENCE_ENDINGS"
  | "SENTENCE_COMPLETION"
  | "SUMMARY_COMPLETION"
  | "NOTE_COMPLETION"
  | "TABLE_COMPLETION"
  | "FLOW_CHART_COMPLETION"
  | "DIAGRAM_LABELLING"
  | "SHORT_ANSWER";

type ApiReadingMockTest = {
  id: string;
  title: string;
  tags: string[];
  duration: number;
  totalQuestions: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  passages: Array<{
    id: string;
    passageNumber: 1 | 2 | 3;
    title: string;
    instruction: string | null;
    passageText: string;
    imageUrl: string | null;
    questions: Array<{
      id: string;
      questionNumber: number;
      type: ApiReadingQuestionType;
      questionText: string;
      options: string[] | null;
      correctAnswer: string[];
      marks: number;
      explanation: string | null;
    }>;
  }>;
};

type ApiEnvelope<T> = { success: true; data: T };

const toApiType: Record<AdminReadingQuestionType, ApiReadingQuestionType> = {
  "multiple-choice": "MULTIPLE_CHOICE",
  "true-false-not-given": "TRUE_FALSE_NOT_GIVEN",
  "yes-no-not-given": "YES_NO_NOT_GIVEN",
  "matching-headings": "MATCHING_HEADING",
  "matching-information": "MATCHING_INFORMATION",
  "matching-features": "MATCHING_FEATURES",
  "matching-sentence-endings": "MATCHING_SENTENCE_ENDINGS",
  "sentence-completion": "SENTENCE_COMPLETION",
  "summary-completion": "SUMMARY_COMPLETION",
  "note-completion": "NOTE_COMPLETION",
  "table-completion": "TABLE_COMPLETION",
  "flow-chart-completion": "FLOW_CHART_COMPLETION",
  "diagram-labelling": "DIAGRAM_LABELLING",
  "short-answer": "SHORT_ANSWER",
};

const fromApiType: Record<ApiReadingQuestionType, AdminReadingQuestionType> = {
  MULTIPLE_CHOICE: "multiple-choice",
  TRUE_FALSE_NOT_GIVEN: "true-false-not-given",
  YES_NO_NOT_GIVEN: "yes-no-not-given",
  MATCHING_HEADING: "matching-headings",
  MATCHING_INFORMATION: "matching-information",
  MATCHING_FEATURES: "matching-features",
  MATCHING_SENTENCE_ENDINGS: "matching-sentence-endings",
  SENTENCE_COMPLETION: "sentence-completion",
  SUMMARY_COMPLETION: "summary-completion",
  NOTE_COMPLETION: "note-completion",
  TABLE_COMPLETION: "table-completion",
  FLOW_CHART_COMPLETION: "flow-chart-completion",
  DIAGRAM_LABELLING: "diagram-labelling",
  SHORT_ANSWER: "short-answer",
};

function toAdminReadingTest(test: ApiReadingMockTest): AdminReadingTest {
  return {
    id: test.id,
    title: test.title,
    category: "mock",
    tags: test.tags,
    published: test.isPublished,
    totalQuestions: test.totalQuestions,
    totalMinutes: test.duration,
    passages: test.passages.map((passage) => ({
      id: passage.id,
      partNumber: passage.passageNumber,
      passageOrder: passage.passageNumber,
      title: passage.title,
      passageText: passage.passageText,
      instruction: passage.instruction ?? "",
      imageUrl: passage.imageUrl ?? undefined,
      questions: passage.questions.map((question) => ({
        id: question.id,
        questionNumber: question.questionNumber,
        type: fromApiType[question.type],
        questionText: question.questionText,
        options: question.options ?? undefined,
        correctAnswer: question.correctAnswer[0] ?? "",
        explanation: question.explanation ?? undefined,
        marks: question.marks,
      })),
    })),
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
  };
}

function toApiPayload(
  test: Pick<AdminReadingTest, "title" | "tags" | "totalMinutes" | "passages">
) {
  return {
    title: test.title,
    tags: test.tags,
    duration: test.totalMinutes,
    passages: test.passages.map((passage) => ({
      passageNumber: passage.partNumber,
      title: passage.title,
      instruction: passage.instruction || undefined,
      passageText: passage.passageText,
      imageUrl: passage.imageUrl || undefined,
      questions: passage.questions.map((question) => ({
        questionNumber: question.questionNumber,
        type: toApiType[question.type],
        questionText: question.questionText,
        options: question.options?.filter((option) => option.trim()) || undefined,
        correctAnswer: [question.correctAnswer],
        marks: question.marks,
        explanation: question.explanation || undefined,
      })),
    })),
  };
}

export async function getAdminReadingTests(): Promise<AdminReadingTest[]> {
  const response = await apiFetch<ApiEnvelope<ApiReadingMockTest[]>>("/api/reading/mock-tests");
  return response.data.map(toAdminReadingTest);
}

export async function createAdminReadingTest(
  test: Omit<AdminReadingTest, "id" | "createdAt" | "updatedAt">
) {
  const response = await apiFetch<ApiEnvelope<ApiReadingMockTest>>("/api/reading/mock-tests", {
    method: "POST",
    body: JSON.stringify(toApiPayload(test)),
  });
  return toAdminReadingTest(response.data);
}

export async function updateAdminReadingTest(
  id: string,
  test: Omit<AdminReadingTest, "createdAt" | "updatedAt">
) {
  const response = await apiFetch<ApiEnvelope<ApiReadingMockTest>>(`/api/reading/mock-tests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toApiPayload(test)),
  });
  return toAdminReadingTest(response.data);
}

export async function deleteAdminReadingTest(id: string) {
  await apiFetch<ApiEnvelope<unknown>>(`/api/reading/mock-tests/${id}`, { method: "DELETE" });
}

export async function setAdminReadingTestPublished(id: string, published: boolean) {
  const endpoint = published ? "publish" : "unpublish";
  const response = await apiFetch<ApiEnvelope<ApiReadingMockTest>>(
    `/api/reading/mock-tests/${id}/${endpoint}`,
    { method: "PATCH" }
  );
  return toAdminReadingTest(response.data);
}
