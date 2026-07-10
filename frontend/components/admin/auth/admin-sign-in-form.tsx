"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminAuthError, loginAdmin } from "@/lib/admin/auth/local-admin-auth";
import { setAdminSessionCookie } from "@/lib/admin/auth/session";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

interface AdminSignInFormProps {
  callbackUrl?: string;
  registered?: boolean;
}

export function AdminSignInForm({
  callbackUrl = "/admin/dashboard",
  registered,
}: AdminSignInFormProps) {
  const router = useRouter();
  const { setAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const admin = loginAdmin({ email, password });
      setAdmin(admin);
      setAdminSessionCookie();
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof AdminAuthError ? err.message : "Sign in failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {registered ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Admin account created successfully. Please sign in with your credentials.
        </p>
      ) : null}

      <div>
        <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Admin email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@nexband.app"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          className={inputClass}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "flex h-12 w-full items-center justify-center rounded-xl bg-[#553285] text-sm font-medium text-white transition-colors hover:bg-[#432668] disabled:opacity-60"
        )}
      >
        {isSubmitting ? "Signing in…" : "Sign in to admin"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Need an admin account?{" "}
        <Link
          href="/admin/auth/signup"
          className="font-medium text-violet-600 hover:text-violet-500"
        >
          Create one
        </Link>
      </p>

      <p className="text-center text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-700">
          ← Back to student site
        </Link>
      </p>
    </form>
  );
}
