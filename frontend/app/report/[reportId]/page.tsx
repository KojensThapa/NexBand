import { ReportPageClient } from "@/components/reports/report-page-client";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const { reportId } = await params;
  return <ReportPageClient reportId={reportId} />;
}
