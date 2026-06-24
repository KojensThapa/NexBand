import { notFound } from "next/navigation";
import { ReadingSession } from "@/components/test/reading/reading-session";
import {
  getReadingMockTest,
  getReadingPracticePassage,
} from "@/lib/exams/ielts-reading";

interface PageProps {
  params: Promise<{
    mode: string;
    taskId: string;
  }>;
}

export default async function ReadingTaskPage({ params }: PageProps) {
  const { mode, taskId } = await params;
  const modeTyped = mode as "mock" | "part-1" | "part-2" | "part-3";

  if (modeTyped === "mock") {
    const mockTest = getReadingMockTest(taskId);
    if (mockTest.id !== taskId) notFound();

    return (
      <ReadingSession
        mockTest={mockTest}
        mode="mock"
        backHref="/test/ielts/reading"
      />
    );
  }

  const passage = getReadingPracticePassage(taskId);
  if (!passage) notFound();

  const expectedPart = Number(modeTyped.replace("part-", "")) as 1 | 2 | 3;
  if (passage.partNumber !== expectedPart) notFound();

  return (
    <ReadingSession
      singlePassage={passage}
      mode={modeTyped}
      backHref="/test/ielts/reading"
    />
  );
}
