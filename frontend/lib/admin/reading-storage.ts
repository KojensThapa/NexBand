import type {
  AdminReadingPassage,
  AdminReadingQuestion,
  AdminReadingTest,
} from "@/types/admin";
import {
  DEFAULT_QUESTIONS_PER_PASSAGE,
  DEFAULT_READING_TOTAL_MINUTES,
  DEFAULT_READING_TOTAL_QUESTIONS,
} from "./reading-constants";

const ADMIN_READING_KEY = "nexband_admin_reading_tests";

export { ADMIN_READING_KEY };
export const ADMIN_READING_CHANGED_EVENT = "nexband:admin-reading-changed";

function notifyAdminReadingChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_READING_CHANGED_EVENT));
}

function readTests(): AdminReadingTest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_READING_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AdminReadingTest[];
  } catch {
    return [];
  }
}

function writeTests(tests: AdminReadingTest[]) {
  localStorage.setItem(ADMIN_READING_KEY, JSON.stringify(tests));
  notifyAdminReadingChanged();
}

export function getAdminReadingTests(): AdminReadingTest[] {
  return readTests().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getAdminReadingTest(id: string): AdminReadingTest | undefined {
  return readTests().find((test) => test.id === id);
}

export function createEmptyQuestion(questionNumber: number): AdminReadingQuestion {
  return {
    id: `rq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    questionNumber,
    type: "true-false-not-given",
    questionText: "",
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    correctAnswer: "",
    explanation: "",
    marks: 1,
  };
}

export function createEmptyPassage(partNumber: 1 | 2 | 3): AdminReadingPassage {
  return {
    id: `rp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    partNumber,
    passageOrder: partNumber,
    title: "",
    passageText: "",
    instruction: "",
    questions: Array.from({ length: DEFAULT_QUESTIONS_PER_PASSAGE }, (_, index) =>
      createEmptyQuestion(index + 1)
    ),
  };
}

export function createEmptyReadingDraft(): Omit<
  AdminReadingTest,
  "id" | "createdAt" | "updatedAt"
> {
  return {
    title: "",
    category: "mock",
    tags: [],
    published: false,
    totalQuestions: DEFAULT_READING_TOTAL_QUESTIONS,
    totalMinutes: DEFAULT_READING_TOTAL_MINUTES,
    passages: ([1, 2, 3] as const).map((num) => createEmptyPassage(num)),
  };
}

export type SaveAdminReadingTestInput = Omit<
  AdminReadingTest,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export function saveAdminReadingTest(input: SaveAdminReadingTestInput): AdminReadingTest {
  const existing = readTests();
  const now = new Date().toISOString();

  if (input.id) {
    const index = existing.findIndex((test) => test.id === input.id);
    if (index !== -1) {
      const updated: AdminReadingTest = {
        ...existing[index],
        ...input,
        id: input.id,
        updatedAt: now,
      };
      const next = [...existing];
      next[index] = updated;
      writeTests(next);
      return updated;
    }
  }

  const test: AdminReadingTest = {
    ...input,
    id: input.id ?? `admin-reading-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };

  writeTests([test, ...existing]);
  return test;
}

export function deleteAdminReadingTest(id: string) {
  writeTests(readTests().filter((test) => test.id !== id));
}

export function setAdminReadingTestPublished(id: string, published: boolean) {
  const existing = readTests();
  const index = existing.findIndex((test) => test.id === id);
  if (index === -1) return;

  const next = [...existing];
  next[index] = {
    ...next[index],
    published,
    updatedAt: new Date().toISOString(),
  };
  writeTests(next);
}

export type AdminReadingTestContent = Pick<
  AdminReadingTest,
  "title" | "category" | "passages"
>;

export function countAdminReadingQuestions(test: AdminReadingTestContent): number {
  return test.passages.reduce((sum, passage) => sum + passage.questions.length, 0);
}

export function isAdminReadingPassageValid(passage: AdminReadingPassage): boolean {
  if (!passage.title.trim() || !passage.instruction.trim()) return false;
  const passageContent = passage.passageText.replace(/<[^>]*>/g, "").trim();
  if (!passageContent) return false;
  return passage.questions.every(
    (question) =>
      question.questionText.trim() &&
      question.correctAnswer.trim() &&
      question.marks > 0
  );
}

export function isAdminReadingTestValid(test: AdminReadingTestContent): boolean {
  return getAdminReadingValidationError(test) === null;
}

export function getAdminReadingValidationError(test: AdminReadingTestContent): string | null {
  if (!test.title.trim()) {
    return "Enter a test title.";
  }

  if (test.passages.length < 3) {
    return "Mock tests require all 3 passages.";
  }

  const incompletePassage = test.passages.find(
    (passage) => !isAdminReadingPassageValid(passage)
  );
  if (incompletePassage) {
    return `Complete passage ${incompletePassage.partNumber} — title, instructions, passage text, and all questions are required.`;
  }

  return null;
}
