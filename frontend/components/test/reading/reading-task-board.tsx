"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  getReadingTaskHref,
  READING_MOCK_TESTS,
} from "@/lib/exams/ielts-reading";
import { buildAdminReadingMockTests } from "@/lib/admin/reading-to-exam";
import { useAdminReadingTests } from "@/hooks/useAdminReadingTests";

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6.3 4.2a1 1 0 0 1 1.52-.85l7.5 4.8a1 1 0 0 1 0 1.7l-7.5 4.8A1 1 0 0 1 6.3 15.7V4.2Z" />
    </svg>
  );
}

function TaskCard({
  task,
  href,
}: {
  task: {
    id: string;
    title: string;
    typeLabel?: string;
  };
  href: string;
}) {
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-600">
          R
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-slate-900">
            {task.title}
          </h2>
          {task.typeLabel ? (
            <span className="mt-2 inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              {task.typeLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-5">
        <p className="text-sm text-slate-400">No attempts yet</p>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition-colors group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
        >
          <PlayIcon className="h-4 w-4" />
          Start
        </Link>
      </div>
    </article>
  );
}

export function ReadingTaskBoard({ backHref }: { backHref?: string } = {}) {
  const { tests: adminTests } = useAdminReadingTests();

  const cards = useMemo(() => {
    const adminMocks = buildAdminReadingMockTests(adminTests, { publishedOnly: true });
    const allMocks = [...READING_MOCK_TESTS, ...adminMocks];
    return allMocks.map((mock) => ({
      id: mock.id,
      title: mock.title,
      typeLabel: `Full test · ${mock.totalMinutes} min`,
      href: getReadingTaskHref(mock.id, backHref),
    }));
  }, [backHref, adminTests]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Mock Tests</h2>
        <p className="mt-1 text-sm text-slate-500">
          Full reading tests with 3 passages. Choose a mock test to begin.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {cards.map((card) => (
            <TaskCard key={card.id} task={card} href={card.href} />
          ))}
        </div>
      </div>
    </div>
  );
}
