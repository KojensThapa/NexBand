import Link from "next/link";
import { siteConfig } from "@/config/site";
import { IELTS_SECTIONS } from "@/lib/exams/ielts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            N
          </span>
          <span className="font-semibold text-slate-900">{siteConfig.name}</span>
        </div>
        <nav className="space-y-1 p-4">
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Overview
          </Link>
          <Link
            href="/profile"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Profile
          </Link>
          <p className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            IELTS
          </p>
          {IELTS_SECTIONS.map((section) => (
            <Link
              key={section.skill}
              href={section.path}
              className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-slate-200 bg-white px-6 lg:hidden">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            {siteConfig.name}
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
