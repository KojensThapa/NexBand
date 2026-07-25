"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSpeakingTaskHref } from "@/lib/exams/ielts-speaking";
import { getPublishedSpeakingTests, type SpeakingTestCard } from "@/services/speaking";
import type { SpeakingBoardMode } from "@/types/speaking";
import { cn } from "@/lib/utils";

const MODE_TABS: { id: SpeakingBoardMode; label: string }[] = [
  { id: "mock", label: "Mock Test" },
  { id: "part-1", label: "Part 1" },
  { id: "part-2", label: "Part 2" },
  { id: "part-3", label: "Part 3" },
];

function MicBadge({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v3" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M6.3 4.2a1 1 0 0 1 1.52-.85l7.5 4.8a1 1 0 0 1 0 1.7l-7.5 4.8A1 1 0 0 1 6.3 15.7V4.2Z" />
    </svg>
  );
}

function TaskCard({
  title,
  typeLabel,
  subtitle,
  href,
}: {
  title: string;
  typeLabel: string;
  subtitle: string;
  href: string;
}) {
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <MicBadge className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-slate-900">{title}</h2>
          <span className="mt-2 inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
            {typeLabel}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-5">
        <p className="text-sm text-slate-400">{subtitle}</p>
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

export function SpeakingTaskBoard({ backHref }: { backHref?: string } = {}) {
  const [mode, setMode] = useState<SpeakingBoardMode>("mock");
  const [backendTests, setBackendTests] = useState<SpeakingTestCard[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getPublishedSpeakingTests()
      .then((tests) => {
        if (active) {
          setBackendTests(tests);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load Speaking tests.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(() => {
    return backendTests
      .filter((test) => test.mode === mode)
      .map((test) => ({
        id: test.id,
        title: test.title,
        typeLabel: test.typeLabel,
        subtitle: mode === "mock" ? "All 3 parts" : "Published speaking practice",
        href: getSpeakingTaskHref(mode, test.id, backHref),
      }));
  }, [mode, backHref, backendTests]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-2">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                mode === tab.id
                  ? "border-indigo-700 bg-indigo-700 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadError ? (
          <p className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loadError}
          </p>
        ) : null}

        {cards.length === 0 && !loadError ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No published Speaking tests are available yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {cards.map((card) => (
              <TaskCard key={card.id} {...card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
