"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserIcon } from "@/components/dashboard/icons";

export function ProfileSection() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  function handleLogout() {
    signOut();
    router.push("/auth/signin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <UserIcon className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-500">Your account details</p>
          </div>
        </div>

        <dl className="mt-8 space-y-5">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Name
            </dt>
            <dd className="mt-1 text-base font-medium text-slate-900">
              {user?.name ?? "Guest"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </dt>
            <dd className="mt-1 text-base font-medium text-slate-900">
              {user?.email ?? "—"}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 flex w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
        >
          Logout
        </button>
      </section>
    </div>
  );
}
