import { ReadingTaskPageClient } from "@/components/test/reading/reading-task-page-client";

interface PageProps {
  params: Promise<{
    mode: string;
    taskId: string;
  }>;
}

export default async function ReadingTaskPage({ params }: PageProps) {
  const { taskId } = await params;

  return (
    <ReadingTaskPageClient
      taskId={taskId}
      backHref="/test/ielts/reading"
    />
  );
}
