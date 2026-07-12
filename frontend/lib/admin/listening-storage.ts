import type { AdminListeningMockTest, AdminListeningPart, AdminListeningQuestion } from "@/types/admin";
import { DEFAULT_QUESTIONS_PER_PART } from "./listening-constants";

const ADMIN_LISTENING_KEY = "nexband_admin_listening_tests";

export { ADMIN_LISTENING_KEY };
export const ADMIN_LISTENING_CHANGED_EVENT = "nexband:admin-listening-changed";

function notifyAdminListeningChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_LISTENING_CHANGED_EVENT));
}

function readTests(): AdminListeningMockTest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_LISTENING_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AdminListeningMockTest[];
  } catch {
    return [];
  }
}

function writeTests(tests: AdminListeningMockTest[]) {
  localStorage.setItem(ADMIN_LISTENING_KEY, JSON.stringify(tests));
  notifyAdminListeningChanged();
}

export function getAdminListeningTests(): AdminListeningMockTest[] {
  return readTests().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getAdminListeningTest(id: string): AdminListeningMockTest | undefined {
  return readTests().find((test) => test.id === id);
}

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

export type SaveAdminListeningTestInput = Omit<
  AdminListeningMockTest,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export function saveAdminListeningTest(input: SaveAdminListeningTestInput): AdminListeningMockTest {
  const existing = readTests();
  const now = new Date().toISOString();

  if (input.id) {
    const index = existing.findIndex((test) => test.id === input.id);
    if (index !== -1) {
      const updated: AdminListeningMockTest = {
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

  const test: AdminListeningMockTest = {
    ...input,
    id: input.id ?? `admin-listening-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };

  writeTests([test, ...existing]);
  return test;
}

export function deleteAdminListeningTest(id: string) {
  writeTests(readTests().filter((test) => test.id !== id));
}

export function setAdminListeningTestPublished(id: string, published: boolean) {
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

export function countAdminListeningQuestions(test: AdminListeningMockTest): number {
  return test.parts.reduce((total, part) => total + part.questions.length, 0);
}
