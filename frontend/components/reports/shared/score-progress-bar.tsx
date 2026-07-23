import { cn } from "@/lib/utils";

interface ScoreProgressBarProps {
  label: string;
  score: number;
  maxScore?: number;
  color?: string;
  showValue?: boolean;
  valueSuffix?: string;
  className?: string;
}

export function ScoreProgressBar({
  label,
  score,
  maxScore = 9,
  color = "bg-[#553285]",
  showValue = true,
  valueSuffix = "",
  className,
}: ScoreProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {showValue ? (
          <span className="text-sm font-semibold text-slate-900">
            {score.toFixed(1)}{valueSuffix}
          </span>
        ) : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
