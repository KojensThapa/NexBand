import { AdminForgotPasswordForm } from "@/components/admin/auth/admin-forgot-password-form";
import { siteConfig } from "@/config/site";

export default function AdminForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
          Admin portal
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Forgot admin password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Reset your {siteConfig.name} admin password in a few steps.
        </p>
        <div className="mt-8">
          <AdminForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
