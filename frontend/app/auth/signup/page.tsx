import { SignUpForm } from "@/components/auth/sign-up-form";
import { siteConfig } from "@/config/site";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Join {siteConfig.name} to start your IELTS practice with AI feedback.
        </p>
        <div className="mt-8">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
