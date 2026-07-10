"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAdminWritingQuestions } from "@/hooks/useAdminWritingQuestions";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { groupAdminSavedWritingItems } from "@/lib/admin/writing-storage";
export function OverviewSection() {
  const { admin } = useAdminAuth();
  const { questions } = useAdminWritingQuestions();
  const writingCount = useMemo(
    () => groupAdminSavedWritingItems(questions).length,
    [questions]
  );
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 sm:p-8">
        <p className="text-sm font-medium text-violet-600">Welcome back</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          {admin?.name ?? "Admin"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Manage IELTS exam content for the student frontend. Admin accounts are stored separately
          from student accounts and will connect to a dedicated admin database in the future.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Writing questions" value={String(writingCount)} accent="violet" />
        <StatCard label="Speaking questions" value="—" accent="slate" />
        <StatCard label="Listening questions" value="—" accent="slate" />
        <StatCard label="Reading questions" value="—" accent="slate" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">Quick actions</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/dashboard?section=writing"
            className="inline-flex items-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            Add writing question
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            View student site
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "violet" | "slate";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={
          accent === "violet"
            ? "mt-2 text-3xl font-bold text-violet-600"
            : "mt-2 text-3xl font-bold text-slate-300"
        }
      >
        {value}
      </p>
    </div>
  );
}
