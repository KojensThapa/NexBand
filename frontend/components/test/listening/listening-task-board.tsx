"use client";

import Link from "next/link";
import {
  getListeningTaskHref,
  LISTENING_MOCK_TESTS,
} from "@/lib/exams/ielts-listening";
import type { ListeningMockTest } from "@/types/listening";
import { cn } from "@/lib/utils";

const ICON_STYLES: Record<
  ListeningMockTest["iconStyle"],
  { bg: string; icon: React.ReactNode }
> = {
  headphones: {
    bg: "bg-sky-100 text-sky-600",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 14v4a2 2 0 0 0 2 2h1M20 14v4a2 2 0 0 1-2 2h-1M4 10a8 8 0 0 1 16 0v4H4v-4Z" />
      </svg>
    ),
  },
  broadcast: {
    bg: "bg-violet-100 text-violet-600",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="2" />
        <path d="M8 8a6 6 0 0 0 0 8M16 8a6 6 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" />
      </svg>
    ),
  },
  microphone: {
    bg: "bg-rose-100 text-rose-600",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v3" />
      </svg>
    ),
  },
};

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M6.3 4.2a1 1 0 0 1 1.52-.85l7.5 4.8a1 1 0 0 1 0 1.7l-7.5 4.8A1 1 0 0 1 6.3 15.7V4.2Z" />
    </svg>
  );
}

function MockTestCard({
  test,
  backHref,
}: {
  test: ListeningMockTest;
  backHref?: string;
}) {
  const style = ICON_STYLES[test.iconStyle];

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            style.bg
          )}
        >
          {style.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-slate-900">
            {test.title}
          </h2>
          <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            {test.typeLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">No attempts yet</p>
        <Link
          href={getListeningTaskHref(test.id, { backHref })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#553285] bg-white px-4 py-2 text-sm font-medium text-[#553285] transition-colors hover:bg-[#553285] hover:text-white"
        >
          <PlayIcon className="h-4 w-4" />
          Start
        </Link>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">Practice by part:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {([1, 2, 3, 4] as const).map((part) => (
            <Link
              key={part}
              href={getListeningTaskHref(test.id, { part, backHref })}
              className="rounded-lg bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-100"
            >
              Part {part}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export function ListeningTaskBoard({ backHref }: { backHref?: string } = {}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 inline-flex rounded-lg bg-[#553285] px-4 py-2 text-sm font-medium text-white">
          Mock Test
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {LISTENING_MOCK_TESTS.map((test) => (
            <MockTestCard key={test.id} test={test} backHref={backHref} />
          ))}
        </div>
      </div>
    </div>
  );
}
