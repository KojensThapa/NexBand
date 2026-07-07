import { cn } from "@/lib/utils";

interface CircularProgressProps {
  /** Current value. */
  value: number;
  /** Maximum value (the ring is full at max). */
  max: number;
  /** Size in pixels. */
  size?: number;
  /** Stroke width in pixels. */
  stroke?: number;
  /** Center content. */
  children?: React.ReactNode;
  /** Track (background) stroke class. */
  trackClassName?: string;
  /** Progress stroke class. */
  progressClassName?: string;
  className?: string;
}

/**
 * A lightweight SVG circular progress ring. Used for the Part 2 preparation
 * countdown, speaking timers, and animated band-score rings in the AI report.
 *
 * Pure SVG + CSS transition — no animation library.
 */
export function CircularProgress({
  value,
  max,
  size = 120,
  stroke = 8,
  children,
  trackClassName = "text-slate-200",
  progressClassName = "text-indigo-600",
  className,
}: CircularProgressProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const offset = circumference * (1 - ratio);
  const center = size / 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn(progressClassName, "transition-[stroke-dashoffset] duration-500 ease-linear")}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
