import { SignInForm } from "@/components/auth/sign-in-form";
import { siteConfig } from "@/config/site";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>;
}) {
  const { callbackUrl, registered } = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to continue your IELTS practice on {siteConfig.name}.
        </p>
        <div className="mt-8">
          <SignInForm
            callbackUrl={callbackUrl ?? "/dashboard"}
            registered={registered === "1"}
          />
        </div>
      </div>
    </div>
  );
}
