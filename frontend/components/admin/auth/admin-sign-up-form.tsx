"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminAuthError, registerAdmin } from "@/lib/admin/auth/local-admin-auth";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

export function AdminSignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      registerAdmin({ name, email, password, confirmPassword });
      router.push("/admin/auth/signin?registered=1");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof AdminAuthError ? err.message : "Sign up failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="admin-name" className="mb-1.5 block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="admin-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Admin name"
          className={inputClass}
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 6 characters"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="admin-confirm-password"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Confirm password
        </label>
        <input
          id="admin-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter your password"
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
        {isSubmitting ? "Creating admin account…" : "Create admin account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an admin account?{" "}
        <Link
          href="/admin/auth/signin"
          className="font-medium text-violet-600 hover:text-violet-500"
        >
          Sign in
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
