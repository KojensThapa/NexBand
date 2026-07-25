import type { AdminWritingQuestion } from "@/types/admin";

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
