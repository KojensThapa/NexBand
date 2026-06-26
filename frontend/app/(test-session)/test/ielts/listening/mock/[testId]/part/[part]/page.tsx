import { notFound } from "next/navigation";
import { ListeningSession } from "@/components/test/listening/listening-session";
import { getListeningMockTest } from "@/lib/exams/ielts-listening";
import type { ListeningPartNumber } from "@/types/listening";

interface PageProps {
  params: Promise<{ testId: string; part: string }>;
}

export default async function ListeningPartPage({ params }: PageProps) {
  const { testId, part } = await params;
  const partNum = Number(part) as ListeningPartNumber;
  if (![1, 2, 3, 4].includes(partNum)) notFound();

  const mockTest = getListeningMockTest(testId);
  if (mockTest.id !== testId) notFound();

  return (
    <ListeningSession
      mockTest={mockTest}
      initialPart={partNum}
      backHref="/test/ielts/listening"
    />
  );
}
