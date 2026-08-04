import { redirect } from "next/navigation";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { siteConfig } from "@/config/site";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  if (!email) redirect("/auth/signup");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-slate-900">Verify your email</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter the code we sent to finish creating your {siteConfig.name} account.
        </p>
        <div className="mt-8">
          <VerifyEmailForm email={email} />
        </div>
      </div>
    </div>
  );
}
