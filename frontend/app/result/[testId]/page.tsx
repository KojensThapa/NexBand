export default async function ResultPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Test result</h1>
      <p className="mt-2 text-slate-600">Result ID: {testId}</p>
      <p className="mt-4 text-sm text-slate-500">
        AI feedback and band score will appear here after submission.
      </p>
    </div>
  );
}
