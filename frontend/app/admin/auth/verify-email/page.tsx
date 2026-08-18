import { redirect } from "next/navigation";
import { AdminVerifyEmailForm } from "@/components/admin/auth/admin-verify-email-form";
import { siteConfig } from "@/config/site";

export default async function AdminVerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  if (!email) redirect("/admin/auth/signup");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
          Admin portal
        </span>
        <h1 className="mt-4 text-center text-2xl font-bold text-slate-900">Verify your email</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter the code we sent to finish creating your {siteConfig.name} admin account.
        </p>
        <div className="mt-8">
          <AdminVerifyEmailForm email={email} />
        </div>
      </div>
    </div>
  );
}
