import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";

export function AdminPortalSection() {
  return (
    <section id="admin-portal" className="border-t border-slate-200 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-8 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700">
              Admin portal
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Manage exam content
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Admins can sign in to create IELTS writing, speaking, listening, and reading
              questions. Admin accounts are kept separate from student accounts and will use a
              dedicated database in the future.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col xl:flex-row">
            <ButtonLink href={siteConfig.links.adminSignIn} size="lg" className="min-w-[180px]">
              Admin sign in
            </ButtonLink>
            <ButtonLink
              href={siteConfig.links.adminSignUp}
              variant="outline"
              size="lg"
              className="min-w-[180px]"
            >
              Admin sign up
            </ButtonLink>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Students use{" "}
          <Link href={siteConfig.links.signIn} className="font-medium text-indigo-600 hover:text-indigo-500">
            student sign in
          </Link>{" "}
          instead.
        </p>
      </div>
    </section>
  );
}
