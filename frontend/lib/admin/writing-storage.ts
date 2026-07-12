import type { AdminWritingQuestion } from "@/types/admin";

const ADMIN_WRITING_KEY = "nexband_admin_writing_questions";

export { ADMIN_WRITING_KEY };
export const ADMIN_WRITING_CHANGED_EVENT = "nexband:admin-writing-changed";

function notifyAdminWritingChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_WRITING_CHANGED_EVENT));
}

function readQuestions(): AdminWritingQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_WRITING_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AdminWritingQuestion[];
  } catch {
    return [];
  }
}

function writeQuestions(questions: AdminWritingQuestion[]) {
  localStorage.setItem(ADMIN_WRITING_KEY, JSON.stringify(questions));
  notifyAdminWritingChanged();
}

export function getAdminWritingQuestions(): AdminWritingQuestion[] {
  return readQuestions().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveAdminWritingQuestion(
  input: Omit<AdminWritingQuestion, "id" | "createdAt"> & { id?: string }
): AdminWritingQuestion {
  const existing = readQuestions();

  if (input.id) {
    const index = existing.findIndex((question) => question.id === input.id);
    if (index !== -1) {
      const updated: AdminWritingQuestion = {
        ...existing[index],
        ...input,
        id: input.id,
      };
      const next = [...existing];
      next[index] = updated;
      writeQuestions(next);
      return updated;
    }
  }

  if (input.category === "mock" && input.mockTestId) {
    const matchIndex = existing.findIndex(
      (question) =>
        question.category === "mock" &&
        question.mockTestId === input.mockTestId &&
        question.taskNumber === input.taskNumber
    );

    if (matchIndex !== -1) {
      const updated: AdminWritingQuestion = {
        ...existing[matchIndex],
        ...input,
      };
      const next = [...existing];
      next[matchIndex] = updated;
      writeQuestions(next);
      return updated;
    }
  }

  const question: AdminWritingQuestion = {
    ...input,
    published: input.published ?? false,
    id: `admin-writing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  writeQuestions([question, ...existing]);
  return question;
}

export function deleteAdminWritingQuestion(id: string) {
  writeQuestions(readQuestions().filter((question) => question.id !== id));
}

export function deleteAdminMockTest(mockTestId: string) {
  writeQuestions(
    readQuestions().filter(
      (question) => !(question.category === "mock" && question.mockTestId === mockTestId)
    )
  );
}

export function setAdminWritingQuestionPublished(id: string, published: boolean) {
  const existing = readQuestions();
  const index = existing.findIndex((question) => question.id === id);
  if (index === -1) return;

  const next = [...existing];
  next[index] = { ...next[index], published };
  writeQuestions(next);
}

export function setAdminMockTestPublished(mockTestId: string, published: boolean) {
  writeQuestions(
    readQuestions().map((question) =>
      question.category === "mock" && question.mockTestId === mockTestId
        ? { ...question, published }
        : question
    )
  );
}

export function isAdminMockTestComplete(parts: AdminWritingQuestion[]): boolean {
  const part1 = parts.find((part) => part.taskNumber === 1);
  const part2 = parts.find((part) => part.taskNumber === 2);
  if (!part1 || !part2) return false;
  if (!part1.title.trim() || !part1.prompt.trim() || !part1.imageUrl) return false;
  if (!part2.title.trim() || !part2.prompt.trim()) return false;
  return true;
}

export function isAdminWritingQuestionComplete(question: AdminWritingQuestion): boolean {
  if (!question.title.trim() || !question.prompt.trim()) return false;
  if (question.category === "task-1" && !question.imageUrl) return false;
  return true;
}

export type AdminSavedWritingItem =
  | { kind: "practice"; question: AdminWritingQuestion }
  | {
      kind: "mock";
      mockTestId: string;
      mockTestTitle: string;
      parts: AdminWritingQuestion[];
      published: boolean;
      createdAt: string;
    };

export function getAdminSavedWritingItems(): AdminSavedWritingItem[] {
  return groupAdminSavedWritingItems(getAdminWritingQuestions());
}

export function groupAdminSavedWritingItems(
  questions: AdminWritingQuestion[]
): AdminSavedWritingItem[] {
  const mockGroups = new Map<string, AdminWritingQuestion[]>();
  const practiceItems: AdminSavedWritingItem[] = [];

  for (const question of questions) {
    if (question.category === "mock" && question.mockTestId) {
      const existing = mockGroups.get(question.mockTestId) ?? [];
      mockGroups.set(question.mockTestId, [...existing, question]);
      continue;
    }

    practiceItems.push({ kind: "practice", question });
  }

  const mockItems: AdminSavedWritingItem[] = Array.from(mockGroups.entries()).map(
    ([mockTestId, parts]) => ({
      kind: "mock",
      mockTestId,
      mockTestTitle: parts[0]?.mockTestTitle ?? "Admin Mock Test",
      parts: parts.sort((a, b) => a.taskNumber - b.taskNumber),
      published: parts.every((part) => part.published),
      createdAt: parts.reduce(
        (latest, part) =>
          new Date(part.createdAt).getTime() > new Date(latest).getTime()
            ? part.createdAt
            : latest,
        parts[0]?.createdAt ?? new Date().toISOString()
      ),
    })
  );

  return [...mockItems, ...practiceItems].sort(
    (a, b) =>
      new Date(getSavedItemCreatedAt(b)).getTime() -
      new Date(getSavedItemCreatedAt(a)).getTime()
  );
}

function getSavedItemCreatedAt(item: AdminSavedWritingItem) {
  return item.kind === "mock" ? item.createdAt : item.question.createdAt;
}

export function getAdminWritingQuestionsByCategory(
  category: AdminWritingQuestion["category"]
): AdminWritingQuestion[] {
  return getAdminWritingQuestions().filter((question) => question.category === category);
}
