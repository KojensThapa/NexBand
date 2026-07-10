import { WritingTaskPageClient } from "@/components/test/writing/writing-task-page-client";

interface PageProps {
  params: Promise<{
    mode: string;
    taskId: string;
  }>;
}

export default async function WritingTaskPage({ params }: PageProps) {
  const { mode, taskId } = await params;
  const modeTyped = mode as "mock" | "task-1" | "task-2";

  if (!["mock", "task-1", "task-2"].includes(modeTyped)) {
    return null;
  }

  return <WritingTaskPageClient mode={modeTyped} taskId={taskId} />;
}
