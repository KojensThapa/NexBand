"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-lg font-semibold text-slate-900">{title}</span>
        <span
          className={cn(
            "text-sm font-medium text-[#553285] transition-transform",
            isOpen && "rotate-180"
          )}
        >
          ▼
        </span>
      </button>
      {isOpen ? (
        <div className="border-t border-slate-100 px-6 py-4">{children}</div>
      ) : null}
    </section>
  );
}
