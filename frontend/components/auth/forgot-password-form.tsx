"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createPasswordResetOtp,
  verifyPasswordResetOtp,
  clearPasswordResetOtp,
} from "@/lib/auth/otp";
import { AuthError, findUserByEmail, resetUserPassword } from "@/lib/auth/local-auth";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

type Step = "email" | "otp" | "password";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const user = findUserByEmail(email);
      if (!user) {
        throw new AuthError("No account found with this email address.");
      }

      const code = createPasswordResetOtp(email, "user");
      setDemoOtp(code);
      setSuccess(`A 6-digit verification code has been sent to ${user.email}.`);
      setStep("otp");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Failed to send verification code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const valid = verifyPasswordResetOtp(email, otp, "user");
      if (!valid) {
        throw new AuthError("Invalid or expired verification code.");
      }
      setSuccess("Code verified. Set your new password below.");
      setStep("password");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      resetUserPassword({ email, newPassword, confirmPassword });
      clearPasswordResetOtp();
      router.push("/auth/signin?reset=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        {(["email", "otp", "password"] as Step[]).map((item, index) => (
          <div key={item} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                step === item
                  ? "bg-indigo-600 text-white"
                  : index < ["email", "otp", "password"].indexOf(step)
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-100 text-slate-400"
              )}
            >
              {index + 1}
            </span>
            {index < 2 ? <span className="h-px w-8 bg-slate-200" /> : null}
          </div>
        ))}
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@gmail.com"
              className={inputClass}
            />
            <p className="mt-2 text-xs text-slate-500">
              Enter the email linked to your account. We&apos;ll send a verification code.
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
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#553285] text-sm font-medium text-white transition-colors hover:bg-[#432668] disabled:opacity-60"
          >
            {isSubmitting ? "Sending code…" : "Send verification code"}
          </button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          {success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          {demoOtp ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Demo mode: your verification code is <strong>{demoOtp}</strong>
            </p>
          ) : null}

          <div>
            <label htmlFor="reset-otp" className="mb-1.5 block text-sm font-medium text-slate-700">
              Verification code
            </label>
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              className={cn(inputClass, "tracking-[0.3em]")}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#553285] text-sm font-medium text-white transition-colors hover:bg-[#432668] disabled:opacity-60"
          >
            {isSubmitting ? "Verifying…" : "Verify code"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setDemoOtp(null);
              setError(null);
              setSuccess(null);
            }}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
          >
            Use a different email
          </button>
        </form>
      ) : null}

      {step === "password" ? (
        <form onSubmit={handleResetPassword} className="space-y-5">
          {success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
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
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#553285] text-sm font-medium text-white transition-colors hover:bg-[#432668] disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save new password"}
          </button>
        </form>
      ) : null}

      <p className="text-center text-sm text-slate-600">
        Remember your password?{" "}
        <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
