"use client";

import { cn } from "@/lib/utils";
import type { IeltsSkill } from "@/types/exam";

const SKILLS: { id: IeltsSkill; label: string }[] = [
  { id: "writing", label: "Writing" },
  { id: "reading", label: "Reading" },
  { id: "listening", label: "Listening" },
  { id: "speaking", label: "Speaking" },
];

interface SkillTabsProps {
  activeSkill: IeltsSkill;
  onSkillChange: (skill: IeltsSkill) => void;
}

export function SkillTabs({ activeSkill, onSkillChange }: SkillTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SKILLS.map((skill) => (
        <button
          key={skill.id}
          type="button"
          onClick={() => onSkillChange(skill.id)}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-medium transition-colors",
            activeSkill === skill.id
              ? "bg-[#553285] text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          {skill.label}
        </button>
      ))}
    </div>
  );
}
