import { redirect } from "next/navigation";
import {
  SPEAKING_MOCK_TESTS,
  SPEAKING_PART1_TASKS,
  SPEAKING_PART2_TASKS,
  SPEAKING_PART3_TASKS,
} from "@/lib/exams/ielts-speaking";

interface PageProps {
  params: Promise<{ mode: string }>;
}

export default async function SpeakingModePage({ params }: PageProps) {
  const { mode } = await params;

  if (mode === "mock") {
    redirect(`/test/ielts/speaking/mock/${SPEAKING_MOCK_TESTS[0].id}`);
  }

  if (mode === "part-1" && SPEAKING_PART1_TASKS[0]) {
    redirect(`/test/ielts/speaking/part-1/${SPEAKING_PART1_TASKS[0].id}`);
  }

  if (mode === "part-2" && SPEAKING_PART2_TASKS[0]) {
    redirect(`/test/ielts/speaking/part-2/${SPEAKING_PART2_TASKS[0].id}`);
  }

  if (mode === "part-3" && SPEAKING_PART3_TASKS[0]) {
    redirect(`/test/ielts/speaking/part-3/${SPEAKING_PART3_TASKS[0].id}`);
  }

  redirect("/test/ielts/speaking");
}
