interface ScoreStat {
  label: string;
  value: string;
  sublabel?: string;
}

interface ScoreStatGridProps {
  stats: ScoreStat[];
}

export function ScoreStatGrid({ stats }: ScoreStatGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {stat.label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          {stat.sublabel ? (
            <p className="mt-0.5 text-xs text-slate-500">{stat.sublabel}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
