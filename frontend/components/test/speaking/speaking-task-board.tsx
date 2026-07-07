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
    </svg>
  );
}

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
      </div>
    </div>
  );
}
