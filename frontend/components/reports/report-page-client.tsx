"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ReportViewer } from "@/components/reports/report-viewer";
import { getSavedReport } from "@/lib/reports/storage";
import type { SavedReport } from "@/types/report";

interface ReportPageClientProps {
  reportId: string;
}

export function ReportPageClient({ reportId }: ReportPageClientProps) {
  const [report, setReport] = useState<SavedReport | null>(null);

  useEffect(() => {
    setReport(getSavedReport(reportId) ?? null);
  }, [reportId]);

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Report not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          This report may have been cleared or the link is invalid.
        </p>
        <Link
          href="/dashboard?section=reports"
          className="mt-6 inline-flex text-sm font-medium text-[#553285] hover:underline"
        >
          ← Back to My Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <ReportViewer report={report} />
    </div>
  );
}
