interface ComingSoonSectionProps {
  skill: string;
}

export function ComingSoonSection({ skill }: ComingSoonSectionProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Coming soon
      </span>
      <h2 className="mt-4 text-xl font-semibold text-slate-900">{skill} management</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The {skill.toLowerCase()} section will let you add questions and answers matching the
        student frontend. Writing is available now — other skills are on the way.
      </p>
    </div>
  );
}
