import Link from "next/link";
import type { ReportHeaderMeta } from "@/types/report";

interface ReportHeaderProps extends ReportHeaderMeta {
  skillLabel?: string;
}

export function ReportHeader({
  testTitle,
  testDate,
  overallScore,
  cefrLevel,
  status = "Completed",
  aiSummary,
  summaryLabel = "AI Summary",
  backHref,
  backLabel = "Back to My Reports",
  skillLabel,
}: ReportHeaderProps) {
  return (
    <header className="space-y-6">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex text-sm font-medium text-[#553285] hover:underline"
        >
          ← {backLabel}
        </Link>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {skillLabel ? (
              <p className="text-xs font-medium uppercase tracking-wide text-[#553285]">
                {skillLabel}
              </p>
            ) : null}
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{testTitle}</h1>
            {testDate ? (
              <p className="mt-1 text-sm text-slate-500">Test date: {testDate}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-slate-500">Overall Band Score</p>
              <p className="text-4xl font-bold text-slate-900">
                {overallScore.toFixed(1)}
                <span className="text-xl font-medium text-slate-400">/9.0</span>
              </p>
            </div>
            {cefrLevel ? (
              <div>
                <p className="text-sm text-slate-500">CEFR Level</p>
                <p className="text-2xl font-bold text-slate-900">{cefrLevel}</p>
              </div>
            ) : null}
            <div>
              <p className="text-sm text-slate-500">Test Status</p>
              <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                {status}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#553285]">
            {summaryLabel}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{aiSummary}</p>
        </div>
      </div>
    </header>
  );
}
