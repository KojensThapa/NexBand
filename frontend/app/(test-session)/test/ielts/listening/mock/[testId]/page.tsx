import { notFound } from "next/navigation";
import { ListeningSession } from "@/components/test/listening/listening-session";
import { getListeningMockTest } from "@/lib/exams/ielts-listening";

interface PageProps {
  params: Promise<{ testId: string }>;
}

export default async function ListeningMockPage({ params }: PageProps) {
  const { testId } = await params;
  const mockTest = getListeningMockTest(testId);
  if (mockTest.id !== testId) notFound();

  return <ListeningSession mockTest={mockTest} backHref="/test/ielts/listening" />;
}
