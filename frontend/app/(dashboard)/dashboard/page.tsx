import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

function DashboardFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">Loading dashboard…</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardShell />
    </Suspense>
  );
}
