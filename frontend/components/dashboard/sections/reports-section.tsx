"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteReport,
  formatReportDate,
  getSavedReports,
} from "@/lib/reports/storage";
import type { SavedReport } from "@/types/report";

function TaskIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function ReportsSection() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  useEffect(() => {
    setReports(getSavedReports());
  }, []);

  function handleDelete(report: SavedReport) {
    const confirmed = window.confirm(
      `Permanently delete "${report.taskTitle}"? This cannot be undone.`
    );
    if (!confirmed) return;

    if (!deleteReport(report.id)) return;

    const next = reports.filter((item) => item.id !== report.id);
    const nextTotalPages = Math.max(1, Math.ceil(next.length / rowsPerPage));
    if (page > nextTotalPages) {
      setPage(nextTotalPages);
    }
    setReports(next);
  }

  const totalPages = Math.max(1, Math.ceil(reports.length / rowsPerPage));
  const pageReports = reports.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (reports.length === 0) {
    return (
      <div className="space-y-6">
        <div className="inline-flex rounded-lg bg-[#553285] px-4 py-2 text-sm font-medium text-white">
          Reports
        </div>
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-500">No reports yet</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">My Reports</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Complete a writing, reading, or listening practice session and submit for
            AI feedback. Your reports will appear here.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-lg bg-[#553285] px-4 py-2 text-sm font-medium text-white">
        Reports
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="bg-violet-50 text-left text-slate-700">
                <th className="px-4 py-3 font-semibold">Time ↓</th>
                <th className="px-4 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Task Description</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {pageReports.map((report, index) => (
                <tr
                  key={report.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-violet-50/30"}
                >
                  <td className="px-4 py-3 text-slate-600">
                    {formatReportDate(report.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-slate-900">
                      <TaskIcon />
                      {report.taskTitle}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                    {report.taskDescription}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                      </svg>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {Math.round(report.score)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/report/${report.id}`}
                        className="inline-flex rounded-lg border border-[#553285] px-4 py-1.5 text-sm font-medium text-[#553285] transition-colors hover:bg-[#553285] hover:text-white"
                      >
                        View Report
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(report)}
                        className="inline-flex rounded-lg border border-rose-200 px-4 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Rows per page</span>
            <select
              value={rowsPerPage}
              disabled
              className="rounded border border-slate-200 px-2 py-1"
            >
              <option value={20}>20</option>
            </select>
          </div>
          <p className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="rounded border border-slate-200 px-2 py-1 text-sm disabled:opacity-40"
            >
              «
            </button>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-slate-200 px-2 py-1 text-sm disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-slate-200 px-2 py-1 text-sm disabled:opacity-40"
            >
              ›
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="rounded border border-slate-200 px-2 py-1 text-sm disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
