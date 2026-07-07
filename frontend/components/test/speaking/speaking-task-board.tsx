<<<<<<< HEAD
import Link from "next/link";
import { SPEAKING_TESTS } from "@/lib/exams/ielts-speaking";
import type { SpeakingPartId } from "@/types/speaking";
import { cn } from "@/lib/utils";

/** Per-card accent (matches the indigo/violet/emerald/amber IELTS palette). */
const PART_ACCENT: Record<
  SpeakingPartId,
  { ring: string; chip: string; icon: string; glow: string }
> = {
  "part-1": {
    ring: "hover:border-indigo-300",
    chip: "bg-indigo-50 text-indigo-700",
    icon: "from-indigo-500 to-violet-500",
    glow: "group-hover:shadow-indigo-200",
  },
  "part-2": {
    ring: "hover:border-violet-300",
    chip: "bg-violet-50 text-violet-700",
    icon: "from-violet-500 to-fuchsia-500",
    glow: "group-hover:shadow-violet-200",
  },
  "part-3": {
    ring: "hover:border-emerald-300",
    chip: "bg-emerald-50 text-emerald-700",
    icon: "from-emerald-500 to-teal-500",
    glow: "group-hover:shadow-emerald-200",
  },
  mock: {
    ring: "hover:border-amber-300",
    chip: "bg-amber-50 text-amber-700",
    icon: "from-amber-500 to-orange-500",
    glow: "group-hover:shadow-amber-200",
  },
};

/** Inline mic icon (keeps the page free of icon dependencies). */
function MicGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
        fill="currentColor"
      />
      <path
        d="M5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-3.07A7 7 0 0 1 5 11Z"
        fill="currentColor"
      />
=======
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getSpeakingTaskHref,
  SPEAKING_MOCK_TESTS,
  SPEAKING_PART1_TASKS,
  SPEAKING_PART2_TASKS,
  SPEAKING_PART3_TASKS,
} from "@/lib/exams/ielts-speaking";
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
>>>>>>> dd93bf638b3a9424786982ca72ef20d8ee1d2be5
    </svg>
  );
}

<<<<<<< HEAD
interface SpeakingTaskBoardProps {
  /** Where the back link points. */
  backHref?: string;
}

/**
 * The speaking options board: four glassmorphism-style cards (Part 1, Part 2,
 * Part 3, Full Mock). Mirrors the writing-task-board design language.
 */
export function SpeakingTaskBoard({ backHref = "/dashboard" }: SpeakingTaskBoardProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Hero */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#553285] to-[#432668] p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
          <MicGlyph className="h-4 w-4" />
          IELTS Speaking
        </div>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">IELTS Speaking Test</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
          Practice with AI-assisted recording. Get instant feedback on pronunciation, fluency,
          grammar, vocabulary, and confidence — just like the real exam.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">🎙️ Voice recording</span>
          <span className="rounded-full bg-white/15 px-3 py-1">⏱️ Real exam timers</span>
          <span className="rounded-full bg-white/15 px-3 py-1">📊 AI band score</span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {SPEAKING_TESTS.map((test) => {
          const accent = PART_ACCENT[test.part];
          return (
            <Link
              key={test.id}
              href={`/test/ielts/speaking/${test.part}/${test.id}`}
              className={cn(
                "group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-6",
                accent.ring,
                accent.glow
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                    accent.icon
                  )}
                >
                  <MicGlyph className="h-6 w-6" />
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", accent.chip)}>
                  {test.durationLabel}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">{test.title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">
                {test.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-medium text-slate-400">
                  {test.questionCount} questions
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#553285] transition-transform group-hover:translate-x-0.5">
                  Start test →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Link href={backHref} className="text-sm font-medium text-slate-500 hover:text-slate-700">
          ← Back to dashboard
        </Link>
=======
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

  const cards = useMemo(() => {
    if (mode === "mock") {
      return SPEAKING_MOCK_TESTS.map((mock) => ({
        id: mock.id,
        title: mock.title,
        typeLabel: mock.typeLabel,
        subtitle: `All 3 parts · ~${mock.totalMinutes} min`,
        href: getSpeakingTaskHref("mock", mock.id, backHref),
      }));
    }

    if (mode === "part-1") {
      return SPEAKING_PART1_TASKS.map((task) => ({
        id: task.id,
        title: task.title,
        typeLabel: task.typeLabel,
        subtitle: `${task.part1.questions.length} questions`,
        href: getSpeakingTaskHref("part-1", task.id, backHref),
      }));
    }

    if (mode === "part-2") {
      return SPEAKING_PART2_TASKS.map((task) => ({
        id: task.id,
        title: task.title,
        typeLabel: task.typeLabel,
        subtitle: "Cue card + follow-up",
        href: getSpeakingTaskHref("part-2", task.id, backHref),
      }));
    }

    return SPEAKING_PART3_TASKS.map((task) => ({
      id: task.id,
      title: task.title,
      typeLabel: task.typeLabel,
      subtitle: `${task.part3.questions.length} discussion questions`,
      href: getSpeakingTaskHref("part-3", task.id, backHref),
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
            <TaskCard key={card.id} {...card} />
          ))}
        </div>
>>>>>>> dd93bf638b3a9424786982ca72ef20d8ee1d2be5
      </div>
    </div>
  );
}
