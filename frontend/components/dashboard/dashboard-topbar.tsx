"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserIcon } from "./icons";
import { cn } from "@/lib/utils";

interface DashboardTopbarProps {
  title: string;
  description?: string;
  showProfile?: boolean;
  onProfileClick?: () => void;
}

export function DashboardTopbar({
  title,
  description,
  showProfile = false,
  onProfileClick,
}: DashboardTopbarProps) {
  const { user } = useAuth();

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
        onClick={onProfileClick}
        aria-label="Open profile"
        className={cn(
          "flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 transition-colors",
          showProfile
            ? "border-indigo-200 bg-indigo-50"
            : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50"
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <UserIcon className="h-4 w-4" />
        </span>
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 sm:inline">
          {user?.name ?? "Profile"}
        </span>
      </button>
    </header>
  );
}
