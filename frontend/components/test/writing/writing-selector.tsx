"use client";

import Link from "next/link";

export function WritingSelector() {
  const options = [
    {
      id: "mock",
      title: "Mock Test",
      description: "Complete both Task 1 and Task 2 in one session",
      subtitle: "60 minutes",
      href: "/test/ielts/writing/mock",
      badge: "Full Test",
    },
    {
      id: "task-1",
      title: "Task 1 Practice",
      description: "Practice Task 1 (Report/Letter)",
      subtitle: "20 minutes",
      href: "/test/ielts/writing/task-1",
      badge: "Individual",
    },
    {
      id: "task-2",
      title: "Task 2 Practice",
      description: "Practice Task 2 (Essay)",
      subtitle: "40 minutes",
      href: "/test/ielts/writing/task-2",
      badge: "Individual",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">IELTS Writing Practice</h1>
        <p className="mt-2 text-slate-600">
          Choose a practice mode: complete a full mock test, or focus on a specific task.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <Link
            key={option.id}
            href={option.href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600">
                  {option.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{option.description}</p>
              </div>
              <span className="ml-2 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                {option.badge}
              </span>
            </div>

            <div className="mt-auto flex items-end justify-between pt-4">
              <span className="text-xs font-medium text-slate-400">~{option.subtitle}</span>
              <span className="text-indigo-600 transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
