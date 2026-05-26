"use client";

import { UserIcon } from "./icons";

interface DashboardTopbarProps {
  title: string;
  description?: string;
}

export function DashboardTopbar({ title, description }: DashboardTopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
        {description ? (
          <p className="truncate text-xs text-slate-500">{description}</p>
        ) : null}
      </div>

      <button
        type="button"
        disabled
        aria-label="Profile (coming soon)"
        title="Profile page coming soon"
        className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-1.5 pr-4 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <UserIcon className="h-4 w-4" />
        </span>
        <span className="hidden text-sm font-medium text-slate-700 sm:inline">
          Profile
        </span>
      </button>
    </header>
  );
}
