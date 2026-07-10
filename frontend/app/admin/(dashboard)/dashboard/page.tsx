import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
          Loading admin dashboard…
        </div>
      }
    >
      <AdminShell />
    </Suspense>
  );
}
