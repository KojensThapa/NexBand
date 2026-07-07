interface StrengthsListProps {
  title: string;
  items: string[];
  variant: "strength" | "weakness";
}

export function StrengthsList({ title, items, variant }: StrengthsListProps) {
  const isStrength = variant === "strength";

  return (
    <section
      className={
        isStrength
          ? "rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6"
          : "rounded-2xl border border-amber-200 bg-amber-50/50 p-6"
      }
    >
      <h3
        className={
          isStrength
            ? "text-lg font-semibold text-emerald-900"
            : "text-lg font-semibold text-amber-900"
        }
      >
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className={
              isStrength
                ? "flex items-start gap-2 text-sm text-emerald-800"
                : "flex items-start gap-2 text-sm text-amber-900"
            }
          >
            <span className={isStrength ? "mt-0.5 text-emerald-600" : "mt-0.5 text-amber-600"}>
              {isStrength ? "✓" : "→"}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
