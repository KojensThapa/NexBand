import { notFound } from "next/navigation";
import { WritingSession } from "@/components/test/writing/writing-session";
import {
  getWritingMockTest,
  getWritingPracticeTask,
} from "@/lib/exams/ielts-writing";

interface PageProps {
  params: Promise<{
    mode: string;
    taskId: string;
  }>;
}

export default async function WritingTaskPage({ params }: PageProps) {
  const { mode, taskId } = await params;
  const modeTyped = mode as "mock" | "task-1" | "task-2";

  if (modeTyped === "mock") {
    const mockTest = getWritingMockTest(taskId);
    if (mockTest.id !== taskId) notFound();

    return (
      <WritingSession
        mockTest={mockTest}
        mode="mock"
        backHref="/test/ielts/writing"
      />
    );
  }

  const task = getWritingPracticeTask(taskId);
  if (!task) notFound();
  if (modeTyped === "task-1" && task.taskNumber !== 1) notFound();
  if (modeTyped === "task-2" && task.taskNumber !== 2) notFound();

  return (
    <WritingSession
      singleTask={task}
      mode={modeTyped}
      backHref="/test/ielts/writing"
    />
  );
}
