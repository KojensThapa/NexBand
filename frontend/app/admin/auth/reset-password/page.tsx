import { redirect } from "next/navigation";
import { AdminResetPasswordForm } from "@/components/admin/auth/admin-reset-password-form";
import { siteConfig } from "@/config/site";

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/admin/auth/forgot-password");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
          Admin portal
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Reset admin password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a new password for your {siteConfig.name} admin account.
        </p>
        <div className="mt-8">
          <AdminResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
