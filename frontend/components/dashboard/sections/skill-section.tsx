import type { DashboardSectionId } from "@/lib/dashboard/nav";
import { WritingTaskBoard } from "@/components/test/writing/writing-task-board";
import { ReadingTaskBoard } from "@/components/test/reading/reading-task-board";
import { ListeningTaskBoard } from "@/components/test/listening/listening-task-board";
import { SpeakingTaskBoard } from "@/components/test/speaking/speaking-task-board";

interface SkillSectionProps {
  sectionId: Extract<DashboardSectionId, "writing" | "speaking" | "listening" | "reading">;
}

export function SkillSection({ sectionId }: SkillSectionProps) {
  if (sectionId === "writing") {
    return <WritingTaskBoard backHref="/dashboard?section=writing" />;
  }

  if (sectionId === "reading") {
    return <ReadingTaskBoard backHref="/dashboard?section=reading" />;
  }

  if (sectionId === "listening") {
    return <ListeningTaskBoard backHref="/dashboard?section=listening" />;
  }

  return <SpeakingTaskBoard backHref="/dashboard?section=speaking" />;
}
