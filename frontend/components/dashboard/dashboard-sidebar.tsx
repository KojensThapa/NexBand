"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { siteConfig } from "@/config/site";
import {
  DASHBOARD_NAV_ITEMS,
  type DashboardSectionId,
} from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  ReportsIcon,
  WritingIcon,
  SpeakingIcon,
  ListeningIcon,
  ReadingIcon,
  SampleReportsIcon,
  LessonsIcon,
  LogoutIcon,
} from "./icons";

const NAV_ICONS: Record<DashboardSectionId, ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  reports: ReportsIcon,
  writing: WritingIcon,
  speaking: SpeakingIcon,
  listening: ListeningIcon,
  reading: ReadingIcon,
  "sample-reports": SampleReportsIcon,
  lessons: LessonsIcon,
};

interface DashboardSidebarProps {
  activeSection: DashboardSectionId;
  onSectionChange: (section: DashboardSectionId) => void;
}

export function DashboardSidebar({
  activeSection,
  onSectionChange,
}: DashboardSidebarProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  function handleLogout() {
    signOut();
    router.push("/auth/signin");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/25">
            N
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900">
            {siteConfig.name}
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.id];
            const isActive = activeSection === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "shrink-0",
                      isActive ? "text-indigo-600" : "text-slate-400"
                    )}
                  />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogoutIcon className="shrink-0 text-slate-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}
