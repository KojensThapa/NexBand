"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ADMIN_NAV_ITEMS, type AdminSectionId } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeSection: AdminSectionId;
  onSectionChange: (section: AdminSectionId) => void;
}

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
}

function WritingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function SkillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

const SECTION_ICONS: Record<AdminSectionId, typeof OverviewIcon> = {
  overview: OverviewIcon,
  writing: WritingIcon,
  speaking: SkillIcon,
  listening: SkillIcon,
  reading: SkillIcon,
  profile: ProfileIcon,
};

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const router = useRouter();
  const { admin, signOut } = useAdminAuth();

  function handleLogout() {
    signOut();
    router.push("/admin/auth/signin");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-5">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white shadow-sm shadow-violet-600/25">
            N
          </span>
          <div>
            <span className="block text-base font-semibold tracking-tight text-slate-900">
              NexBand
            </span>
            <span className="text-xs font-medium text-violet-600">Admin</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = SECTION_ICONS[item.id];
            const isActive = activeSection === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!item.available}
                  onClick={() => item.available && onSectionChange(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-50 text-violet-700"
                      : item.available
                        ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        : "cursor-not-allowed text-slate-400"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-violet-600" : "text-slate-400"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {!item.available ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Soon
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-4">
        {admin ? (
          <button
            type="button"
            onClick={() => onSectionChange("profile")}
            className={cn(
              "mb-3 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
              activeSection === "profile"
                ? "bg-violet-50"
                : "bg-slate-50 hover:bg-violet-50"
            )}
          >
            <ProfileAvatar
              name={admin.name}
              image={admin.image}
              size="sm"
              theme="violet"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{admin.name}</p>
              <p className="truncate text-xs text-slate-500">{admin.email}</p>
            </div>
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
