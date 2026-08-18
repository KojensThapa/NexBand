"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { OtpInput } from "@/components/ui/otp-input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN_SECONDS = 60;

interface AdminVerifyEmailFormProps {
  email: string;
}

export function AdminVerifyEmailForm({ email }: AdminVerifyEmailFormProps) {
  const router = useRouter();
  const { verifyEmail, resendOTP } = useAdminAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmail(email, otp);
      toast.success("Email verified. Your admin account is ready!");
      router.push("/admin/auth/signin?registered=1");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed. Please try again.";
      setError(message);
      toast.error(message);
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0 || isResending) return;

    setError(null);
    setIsResending(true);
    try {
      await resendOTP(email);
      toast.success("A new verification code has been sent.");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setOtp("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend the code.";
      setError(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="space-y-6">
      <p className="text-center text-sm text-slate-600">
        We sent a 6-digit code to <span className="font-medium text-slate-900">{email}</span>
      </p>

      <OtpInput value={otp} onChange={setOtp} disabled={isVerifying} />

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isVerifying || otp.length !== 6}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#553285] text-sm font-medium text-white transition-colors hover:bg-[#432668] disabled:opacity-60"
        )}
      >
        {isVerifying ? (
          <>
            <Spinner /> Verifying…
          </>
        ) : (
          "Verify email"
        )}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={secondsLeft > 0 || isResending}
        className="flex w-full items-center justify-center gap-2 text-center text-sm font-medium text-violet-600 hover:text-violet-500 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {isResending ? (
          <>
            <Spinner className="h-3.5 w-3.5" /> Resending…
          </>
        ) : secondsLeft > 0 ? (
          `Resend code in ${secondsLeft}s`
        ) : (
          "Resend code"
        )}
      </button>

      <p className="text-center text-sm text-slate-600">
        Wrong email?{" "}
        <Link href="/admin/auth/signup" className="font-medium text-violet-600 hover:text-violet-500">
          Start over
        </Link>
      </p>
    </form>
  );
}
