import type {
  AdminSpeakingCategory,
  AdminSpeakingMockTest,
  AdminSpeakingQuestion,
} from "@/types/admin";
import {
  DEFAULT_BULLET_POINT_COUNT,
  DEFAULT_PART1_QUESTION_COUNT,
  DEFAULT_PART3_QUESTION_COUNT,
  DEFAULT_PREP_MINUTES,
  DEFAULT_SPEAK_MINUTES,
} from "./speaking-constants";

const ADMIN_SPEAKING_KEY = "nexband_admin_speaking_tests";

export { ADMIN_SPEAKING_KEY };
export const ADMIN_SPEAKING_CHANGED_EVENT = "nexband:admin-speaking-changed";

function notifyAdminSpeakingChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_SPEAKING_CHANGED_EVENT));
}

function readTests(): AdminSpeakingMockTest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_SPEAKING_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AdminSpeakingMockTest[];
  } catch {
    return [];
  }
}

function writeTests(tests: AdminSpeakingMockTest[]) {
  localStorage.setItem(ADMIN_SPEAKING_KEY, JSON.stringify(tests));
  notifyAdminSpeakingChanged();
}

export function getAdminSpeakingTests(): AdminSpeakingMockTest[] {
  return readTests().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getAdminSpeakingTest(id: string): AdminSpeakingMockTest | undefined {
  return readTests().find((test) => test.id === id);
}

export function createEmptySpeakingQuestion(): AdminSpeakingQuestion {
  return {
    id: `sq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: "",
  };
}

export function createEmptyMockTestDraft(
  category: AdminSpeakingMockTest["category"] = "mock"
): Omit<AdminSpeakingMockTest, "id" | "createdAt" | "updatedAt"> {
  return {
    title: "",
    category,
    published: false,
    part1: {
      questions: Array.from({ length: DEFAULT_PART1_QUESTION_COUNT }, () =>
        createEmptySpeakingQuestion()
      ),
    },
    part2: {
      cueCardTitle: "",
      cueCardDescription: "",
      bulletPoints: Array.from({ length: DEFAULT_BULLET_POINT_COUNT }, () => ""),
      closingQuestion: "",
      preparationMinutes: DEFAULT_PREP_MINUTES,
      speakingMinutes: DEFAULT_SPEAK_MINUTES,
    },
    part3: {
      topic: "",
      questions: Array.from({ length: DEFAULT_PART3_QUESTION_COUNT }, () =>
        createEmptySpeakingQuestion()
      ),
    },
  };
}

export type SaveAdminSpeakingTestInput = Omit<
  AdminSpeakingMockTest,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export function saveAdminSpeakingTest(
  input: SaveAdminSpeakingTestInput
): AdminSpeakingMockTest {
  const existing = readTests();
  const now = new Date().toISOString();

  if (input.id) {
    const index = existing.findIndex((test) => test.id === input.id);
    if (index !== -1) {
      const updated: AdminSpeakingMockTest = {
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

  const test: AdminSpeakingMockTest = {
    ...input,
    id: input.id ?? `admin-speaking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };

  writeTests([test, ...existing]);
  return test;
}

export function deleteAdminSpeakingTest(id: string) {
  writeTests(readTests().filter((test) => test.id !== id));
}

export function setAdminSpeakingTestPublished(id: string, published: boolean) {
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

export function countAdminSpeakingQuestions(test: AdminSpeakingMockTest): number {
  if (test.category === "part-1") {
    return test.part1.questions.length;
  }
  if (test.category === "part-2") {
    return test.part2.closingQuestion.trim() ? 1 : 0;
  }
  if (test.category === "part-3") {
    return test.part3.questions.length;
  }
  return (
    test.part1.questions.length +
    (test.part2.closingQuestion.trim() ? 1 : 0) +
    test.part3.questions.length
  );
}

export function getAdminSpeakingCategoryLabel(category: AdminSpeakingCategory): string {
  switch (category) {
    case "mock":
      return "Mock Test";
    case "part-1":
      return "Part 1";
    case "part-2":
      return "Part 2";
    case "part-3":
      return "Part 3";
  }
}
