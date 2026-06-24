"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getReadingTaskHref,
  READING_MOCK_TESTS,
  READING_PRACTICE_PASSAGES,
  type ReadingBoardMode,
} from "@/lib/exams/ielts-reading";
import type { ReadingPartNumber, ReadingPassage } from "@/types/reading";
import { cn } from "@/lib/utils";

const MODE_TABS: { id: ReadingBoardMode; label: string }[] = [
  { id: "mock", label: "Mock Test" },
  { id: "part-1", label: "Part 1" },
  { id: "part-2", label: "Part 2" },
  { id: "part-3", label: "Part 3" },
];

const PART_STYLES: Record<ReadingPartNumber, { bg: string; icon: string }> = {
  1: { bg: "bg-sky-100 text-sky-600", icon: "1" },
  2: { bg: "bg-emerald-100 text-emerald-600", icon: "2" },
  3: { bg: "bg-violet-100 text-violet-600", icon: "3" },
};

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
    partNumber?: ReadingPartNumber;
  };
  href: string;
}) {
  const style = PART_STYLES[task.partNumber ?? 1];

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold",
            style.bg
          )}
        >
          {style.icon}
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
  const [mode, setMode] = useState<ReadingBoardMode>("part-1");

  const cards = useMemo(() => {
    if (mode === "mock") {
      return READING_MOCK_TESTS.map((mock) => ({
        id: mock.id,
        title: mock.title,
        typeLabel: "Full test · 60 min",
        href: getReadingTaskHref("mock", mock.id, backHref),
      }));
    }

    const partNumber = Number(mode.replace("part-", "")) as ReadingPartNumber;
    const passages = READING_PRACTICE_PASSAGES.filter(
      (passage) => passage.partNumber === partNumber
    );

    return passages.map((passage: ReadingPassage) => ({
      ...passage,
      href: getReadingTaskHref(mode, passage.id, backHref),
    }));
  }, [mode, backHref]);

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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {cards.map((card) => (
            <TaskCard key={card.id} task={card} href={card.href} />
          ))}
        </div>
      </div>
    </div>
  );
}
