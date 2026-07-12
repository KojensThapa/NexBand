import { ListeningMockPageClient } from "@/components/test/listening/listening-mock-page-client";

interface PageProps {
  params: Promise<{ testId: string }>;
}

export default async function ListeningMockPage({ params }: PageProps) {
  const { testId } = await params;
  return <ListeningMockPageClient testId={testId} backHref="/test/ielts/listening" />;
}
