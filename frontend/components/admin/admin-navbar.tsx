import Link from "next/link";
import { siteConfig } from "@/config/site";

export function AdminNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white shadow-md shadow-violet-600/30">
            N
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            {siteConfig.name}
          </span>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
            Admin
          </span>
        </Link>

        <Link
          href="/"
          className="text-sm font-medium text-slate-600 transition-colors hover:text-violet-600"
        >
          Student site
        </Link>
      </div>
    </header>
  );
}
