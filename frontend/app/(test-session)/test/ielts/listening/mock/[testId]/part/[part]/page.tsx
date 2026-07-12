import { notFound } from "next/navigation";
import { ListeningMockPageClient } from "@/components/test/listening/listening-mock-page-client";
import type { ListeningPartNumber } from "@/types/listening";

interface PageProps {
  params: Promise<{ testId: string; part: string }>;
}

export default async function ListeningPartPage({ params }: PageProps) {
  const { testId, part } = await params;
  const partNum = Number(part) as ListeningPartNumber;
  if (![1, 2, 3, 4].includes(partNum)) notFound();

  return (
    <ListeningMockPageClient
      testId={testId}
      initialPart={partNum}
      backHref="/test/ielts/listening"
    />
  );
}
