import Link from "next/link";
import { IELTS_SECTIONS } from "@/lib/exams/ielts";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Choose an IELTS skill to start practicing with AI feedback.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {IELTS_SECTIONS.map((section) => (
          <Link
            key={section.skill}
            href={section.path}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{section.label}</h2>
            <p className="mt-1 text-sm text-slate-500">
              ~{section.durationMinutes} min · Practice module
            </p>
            <span className="mt-4 inline-flex text-sm font-medium text-indigo-600">
              Start →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
