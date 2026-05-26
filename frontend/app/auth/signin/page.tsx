import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { siteConfig } from "@/config/site";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to continue your IELTS practice on {siteConfig.name}.
        </p>
        <div className="mt-8">
          <GoogleSignInButton redirectTo={callbackUrl ?? "/dashboard"} />
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Google OAuth will be connected when backend auth is ready. For now, this
          signs you in for development.
        </p>
      </div>
    </div>
  );
}
