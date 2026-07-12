import type { AdminWritingQuestion } from "@/types/admin";
import type { WritingMockTest, WritingTask } from "@/types/writing";

export function adminQuestionToWritingTask(question: AdminWritingQuestion): WritingTask {
  return {
    id: question.id,
    taskNumber: question.taskNumber,
    label: question.taskNumber === 1 ? "Task 1" : "Task 2",
    title: question.title,
    prompt: question.prompt,
    minWords: question.taskNumber === 1 ? 150 : 250,
    recommendedMinutes: question.taskNumber === 1 ? 20 : 40,
    imageUrl: question.imageUrl,
    imageAlt: question.imageAlt,
    task1Type: question.task1Type,
    typeLabel: question.typeLabel,
  };
}

export function buildAdminMockTests(
  questions: AdminWritingQuestion[],
  options?: { publishedOnly?: boolean }
): WritingMockTest[] {
  const mockQuestions = questions.filter((question) => question.category === "mock");
  const grouped = new Map<string, AdminWritingQuestion[]>();

  for (const question of mockQuestions) {
    const key = question.mockTestId ?? question.mockTestTitle ?? question.id;
    const existing = grouped.get(key) ?? [];
    grouped.set(key, [...existing, question]);
  }

  return Array.from(grouped.entries())
    .filter(([, items]) => {
      if (!options?.publishedOnly) return true;
      return items.every((item) => item.published);
    })
    .map(([key, items]) => {
    const tasks = items
      .sort((a, b) => a.taskNumber - b.taskNumber)
      .map(adminQuestionToWritingTask);

    return {
      id: key,
      title: items[0]?.mockTestTitle ?? "Admin Mock Test",
      totalMinutes: 60,
      tasks,
    };
  });
}

export function getAdminPracticeTasks(
  questions: AdminWritingQuestion[],
  taskNumber: 1 | 2,
  options?: { publishedOnly?: boolean }
): WritingTask[] {
  const category = taskNumber === 1 ? "task-1" : "task-2";
  return questions
    .filter((question) => question.category === category)
    .filter((question) => !options?.publishedOnly || question.published)
    .map(adminQuestionToWritingTask);
}
