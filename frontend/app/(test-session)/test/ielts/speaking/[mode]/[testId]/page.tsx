import { notFound } from "next/navigation";
import { SpeakingTaskPageClient } from "@/components/test/speaking/speaking-task-page-client";
import type { SpeakingBoardMode } from "@/types/speaking";

interface PageProps {
  params: Promise<{ mode: string; testId: string }>;
}

export default async function SpeakingTaskPage({ params }: PageProps) {
  const { mode, testId } = await params;
  const modeTyped = mode as SpeakingBoardMode;

  if (!["mock", "part-1", "part-2", "part-3"].includes(modeTyped)) {
    notFound();
  }

  return (
    <SpeakingTaskPageClient
      mode={modeTyped}
      testId={testId}
      backHref="/test/ielts/speaking"
    />
  );
}
