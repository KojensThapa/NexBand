import { redirect } from "next/navigation";
import {
  WRITING_MOCK_TESTS,
  WRITING_PRACTICE_TASKS,
} from "@/lib/exams/ielts-writing";

interface PageProps {
  params: Promise<{
    mode: string;
  }>;
}

export default async function WritingModePage({ params }: PageProps) {
  const { mode } = await params;

  if (mode === "mock") {
    redirect(`/test/ielts/writing/mock/${WRITING_MOCK_TESTS[0].id}`);
  }

  if (mode === "task-1") {
    const firstTask = WRITING_PRACTICE_TASKS.find((task) => task.taskNumber === 1);
    if (firstTask) {
      redirect(`/test/ielts/writing/task-1/${firstTask.id}`);
    }
  }

  if (mode === "task-2") {
    const firstTask = WRITING_PRACTICE_TASKS.find((task) => task.taskNumber === 2);
    if (firstTask) {
      redirect(`/test/ielts/writing/task-2/${firstTask.id}`);
    }
  }

  redirect("/test/ielts/writing");
}
