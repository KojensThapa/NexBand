import type { AdminListeningMockTest, AdminListeningPart, AdminListeningQuestion } from "@/types/admin";
import { DEFAULT_QUESTIONS_PER_PART } from "./listening-constants";

export function createEmptyQuestion(questionNumber: number): AdminListeningQuestion {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    questionNumber,
    type: "form-completion",
    questionText: "",
    correctAnswer: "",
    explanation: "",
    marks: 1,
  };
}

export function createEmptyPart(partNumber: 1 | 2 | 3 | 4): AdminListeningPart {
  return {
    partNumber,
    title: "",
    instruction: "",
    transcript: "",
    audioDurationSeconds: 480,
    questions: Array.from({ length: DEFAULT_QUESTIONS_PER_PART }, (_, index) =>
      createEmptyQuestion(index + 1)
    ),
  };
}

export function createEmptyMockTestDraft(): Omit<AdminListeningMockTest, "id" | "createdAt" | "updatedAt"> {
  return {
    title: "",
    iconStyle: "headphones",
    published: false,
    parts: [1, 2, 3, 4].map((num) => createEmptyPart(num as 1 | 2 | 3 | 4)),
  };
}

export function countAdminListeningQuestions(test: AdminListeningMockTest): number {
  return test.parts.reduce((total, part) => total + part.questions.length, 0);
}
