import { redirect } from "next/navigation";
import { READING_MOCK_TESTS } from "@/lib/exams/ielts-reading";

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

  redirect("/test/ielts/reading");
}
