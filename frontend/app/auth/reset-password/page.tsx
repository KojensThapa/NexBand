import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { siteConfig } from "@/config/site";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/auth/forgot-password");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a new password for your {siteConfig.name} account.
        </p>
        <div className="mt-8">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
