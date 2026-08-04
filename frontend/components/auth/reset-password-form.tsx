"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

const PASSWORD_RULES: { label: string; test: (value: string) => boolean }[] = [
  { label: "At least 8 characters", test: (value) => value.length >= 8 },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "One number", test: (value) => /[0-9]/.test(value) },
];

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const failedRules = PASSWORD_RULES.filter((rule) => !rule.test(password));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (failedRules.length > 0) {
      setError("Your password does not meet the requirements below.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      toast.success("Password updated successfully.");
      router.push("/auth/signin?reset=1");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-700">
          New password
        </label>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a new password"
        />
        <ul className="mt-2 space-y-1 text-xs">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.label} className={met ? "text-emerald-600" : "text-slate-400"}>
                {met ? "✓" : "•"} {rule.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <label htmlFor="confirm-new-password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Confirm new password
        </label>
        <PasswordInput
          id="confirm-new-password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter your password"
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
        {isSubmitting ? "Saving…" : "Save new password"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Remember your password?{" "}
        <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
