export function ReportsSection() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-slate-500">No reports yet</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">My Reports</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Your completed test reports and band score history will appear here after
          you finish your first practice session.
        </p>
      </section>
    </div>
  );
}
