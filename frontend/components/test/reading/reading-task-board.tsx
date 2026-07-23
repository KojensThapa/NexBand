"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getReadingTaskHref } from "@/lib/exams/ielts-reading";
import { getPublishedReadingTests, type ReadingTestCard } from "@/services/reading";

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M6.3 4.2a1 1 0 0 1 1.52-.85l7.5 4.8a1 1 0 0 1 0 1.7l-7.5 4.8A1 1 0 0 1 6.3 15.7V4.2Z" />
    </svg>
  );
}

export function ReadingTaskBoard({ backHref }: { backHref?: string } = {}) {
  const [tests, setTests] = useState<ReadingTestCard[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getPublishedReadingTests()
      .then((publishedTests) => {
        if (active) {
          setTests(publishedTests);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load Reading tests."
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Reading Mock Tests</h2>
        <p className="mt-1 text-sm text-slate-500">
          Published tests are scored by the deterministic IELTS Reading evaluation algorithm.
        </p>

        {loadError ? (
          <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loadError}
          </p>
        ) : null}

        {tests.length === 0 && !loadError ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No published Reading tests are available yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {tests.map((test) => (
              <article
                key={test.id}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-600">
                    R
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold leading-snug text-slate-900">{test.title}</h3>
                    <span className="mt-2 inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      Full test · {test.totalMinutes} min
                    </span>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <p className="text-sm text-slate-400">{test.totalQuestions} questions</p>
                  <Link
                    href={getReadingTaskHref(test.id, backHref)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition-colors group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                  >
                    <PlayIcon className="h-4 w-4" />
                    Start
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
