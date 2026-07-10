interface AdminTopbarProps {
  title: string;
  description: string;
}

export function AdminTopbar({ title, description }: AdminTopbarProps) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </header>
  );
}
