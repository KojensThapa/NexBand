"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

export function AdminForgotPasswordForm() {
  const { forgotPassword } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
      toast.success("Password reset email sent.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send the reset email. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          If an admin account exists for <strong>{email}</strong>, a password reset link has been sent. The
          link expires in 20 minutes.
        </p>
        <p className="text-center text-sm text-slate-600">
          Remember your password?{" "}
          <Link href="/admin/auth/signin" className="font-medium text-violet-600 hover:text-violet-500">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="admin-reset-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Admin email
          </label>
          <input
            id="admin-reset-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@nexband.app"
            className={inputClass}
          />
          <p className="mt-2 text-xs text-slate-500">
            Enter the email linked to your admin account. We&apos;ll send you a password reset link.
          </p>
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
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Remember your password?{" "}
        <Link href="/admin/auth/signin" className="font-medium text-violet-600 hover:text-violet-500">
          Back to sign in
        </Link>
      </p>

      <p className="text-center text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-700">
          ← Back to student site
        </Link>
      </p>
    </div>
  );
}
