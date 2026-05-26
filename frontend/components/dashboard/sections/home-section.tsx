import Link from "next/link";
import { IELTS_SECTIONS } from "@/lib/exams/ielts";
import {
  ListeningIcon,
  ReadingIcon,
  SpeakingIcon,
  WritingIcon,
} from "@/components/dashboard/icons";

const SKILL_ICONS = {
  writing: WritingIcon,
  speaking: SpeakingIcon,
  listening: ListeningIcon,
  reading: ReadingIcon,
} as const;

const STATS = [
  { label: "Overall band", value: "—", hint: "Complete a full practice set" },
  { label: "Tests taken", value: "0", hint: "Start your first session" },
  { label: "Streak", value: "0 days", hint: "Practice daily to build momentum" },
];

export function HomeSection() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 sm:p-8">
        <p className="text-sm font-medium text-indigo-600">Welcome back</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Ready to improve your IELTS score?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Practice all four skills with AI feedback and band scores — inspired by
          modern IELTS prep dashboards like Cathoven.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Practice by skill</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose a module to start a timed IELTS session.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {IELTS_SECTIONS.map((section) => {
            const Icon = SKILL_ICONS[section.skill];
            return (
              <Link
                key={section.skill}
                href={section.path}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                  <Icon />
                </span>
                <h4 className="mt-4 font-semibold text-slate-900">{section.label}</h4>
                <p className="mt-1 text-sm text-slate-500">
                  ~{section.durationMinutes} min practice
                </p>
                <span className="mt-4 inline-flex text-sm font-medium text-indigo-600">
                  Start practice →
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
