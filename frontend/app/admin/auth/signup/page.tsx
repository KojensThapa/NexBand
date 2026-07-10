import { AdminSignUpForm } from "@/components/admin/auth/admin-sign-up-form";
import { siteConfig } from "@/config/site";

export default function AdminSignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
          Admin portal
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Create admin account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Register as an admin to manage exam content on {siteConfig.name}. Admin accounts use a
          separate database from student accounts.
        </p>
        <div className="mt-8">
          <AdminSignUpForm />
        </div>
      </div>
    </div>
  );
}
