import Link from "next/link";
import type { DashboardSectionId } from "@/lib/dashboard/nav";
import { IELTS_SECTIONS } from "@/lib/exams/ielts";
import { WritingTaskBoard } from "@/components/test/writing/writing-task-board";
import { ReadingTaskBoard } from "@/components/test/reading/reading-task-board";
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

interface SkillSectionProps {
  sectionId: Extract<DashboardSectionId, "writing" | "speaking" | "listening" | "reading">;
}

export function SkillSection({ sectionId }: SkillSectionProps) {
  if (sectionId === "writing") {
    return <WritingTaskBoard backHref="/dashboard?section=writing" />;
  }

  if (sectionId === "reading") {
    return <ReadingTaskBoard backHref="/dashboard?section=reading" />;
  }

  const section = IELTS_SECTIONS.find((item) => item.skill === sectionId);

  if (!section) {
    return null;
  }

  const Icon = SKILL_ICONS[sectionId];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">IELTS {section.label}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Complete a full {section.label.toLowerCase()} practice session with AI
              scoring and detailed feedback. Estimated duration:{" "}
              {section.durationMinutes} minutes.
            </p>
            <Link
              href={section.path}
              className="mt-5 inline-flex items-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Start {section.label} practice
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          "Instant band score estimate",
          "Examiner-style feedback",
          "Track progress over time",
          "Practice anytime, anywhere",
        ].map((feature) => (
          <article
            key={feature}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            {feature}
          </article>
        ))}
      </section>
    </div>
  );
}
