import { notFound } from "next/navigation";
import { SpeakingSession } from "@/components/test/speaking/speaking-session";
import {
  getSpeakingMockTest,
  getSpeakingPart1Task,
  getSpeakingPart2Task,
  getSpeakingPart3Task,
} from "@/lib/exams/ielts-speaking";

interface PageProps {
  params: Promise<{ mode: string; testId: string }>;
}

export default async function SpeakingTaskPage({ params }: PageProps) {
  const { mode, testId } = await params;
  const modeTyped = mode as "mock" | "part-1" | "part-2" | "part-3";

  if (modeTyped === "mock") {
    const mockTest = getSpeakingMockTest(testId);
    if (mockTest.id !== testId) notFound();

    return (
      <SpeakingSession
        mode="mock"
        mockTest={mockTest}
        backHref="/test/ielts/speaking"
      />
    );
  }

  if (modeTyped === "part-1") {
    const task = getSpeakingPart1Task(testId);
    if (!task) notFound();

    return (
      <SpeakingSession
        mode="part-1"
        part1Task={task}
        backHref="/test/ielts/speaking"
      />
    );
  }

  if (modeTyped === "part-2") {
    const task = getSpeakingPart2Task(testId);
    if (!task) notFound();

    return (
      <SpeakingSession
        mode="part-2"
        part2Task={task}
        backHref="/test/ielts/speaking"
      />
    );
  }

  if (modeTyped === "part-3") {
    const task = getSpeakingPart3Task(testId);
    if (!task) notFound();

    return (
      <SpeakingSession
        mode="part-3"
        part3Task={task}
        backHref="/test/ielts/speaking"
      />
    );
  }

  notFound();
}
