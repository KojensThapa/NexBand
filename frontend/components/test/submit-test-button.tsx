import { cn } from "@/lib/utils";

export const submitTestButtonClass =
  "rounded-xl bg-[#553285] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#432668] disabled:cursor-not-allowed disabled:opacity-50";

interface SubmitTestButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  fullWidth?: boolean;
}

export function SubmitTestButton({
  label = "Submit for AI feedback",
  fullWidth = true,
  className,
  ...props
}: SubmitTestButtonProps) {
  return (
    <button
      type="button"
      className={cn(submitTestButtonClass, fullWidth && "w-full", className)}
      {...props}
    >
      {label}
    </button>
  );
}
