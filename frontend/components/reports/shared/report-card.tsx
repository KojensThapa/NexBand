import { cn } from "@/lib/utils";

interface ReportCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning";
}

const variantStyles = {
  default: "border-slate-200 bg-white",
  success: "border-emerald-200 bg-emerald-50/40",
  warning: "border-amber-200 bg-amber-50/40",
};

export function ReportCard({
  title,
  children,
  className,
  variant = "default",
}: ReportCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-6 shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      {title ? (
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      ) : null}
      {title ? <div className="mt-4">{children}</div> : children}
    </section>
  );
}
