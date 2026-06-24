import { redirect } from "next/navigation";
import {
  READING_MOCK_TESTS,
  READING_PRACTICE_PASSAGES,
} from "@/lib/exams/ielts-reading";

interface PageProps {
  params: Promise<{
    mode: string;
  }>;
}

export default async function ReadingModePage({ params }: PageProps) {
  const { mode } = await params;

  if (mode === "mock") {
    redirect(`/test/ielts/reading/mock/${READING_MOCK_TESTS[0].id}`);
  }

  if (mode === "part-1" || mode === "part-2" || mode === "part-3") {
    const partNumber = Number(mode.replace("part-", "")) as 1 | 2 | 3;
    const firstPassage = READING_PRACTICE_PASSAGES.find(
      (passage) => passage.partNumber === partNumber
    );
    if (firstPassage) {
      redirect(`/test/ielts/reading/${mode}/${firstPassage.id}`);
    }
  }

  redirect("/test/ielts/reading");
}
