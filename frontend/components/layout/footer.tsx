import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                N
              </span>
              <span className="font-semibold text-slate-900">{siteConfig.name}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500">{siteConfig.tagline}</p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="font-medium text-slate-900">Product</p>
              <ul className="mt-3 space-y-2 text-slate-500">
                <li>
                  <a href="#features" className="hover:text-indigo-600">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#exams" className="hover:text-indigo-600">
                    Exams
                  </a>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-indigo-600">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-slate-900">Account</p>
              <ul className="mt-3 space-y-2 text-slate-500">
                <li>
                  <Link href="/auth/signin" className="hover:text-indigo-600">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-indigo-600">
                    Profile
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {siteConfig.name}. University final year project.
        </p>
      </div>
    </footer>
  );
}
