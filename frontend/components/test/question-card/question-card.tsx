import type { Question } from "@/types/question";

interface QuestionCardProps {
  question: Question;
  index: number;
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
        Question {index + 1}
      </p>
      <p className="mt-3 text-slate-800">{question.prompt}</p>
    </article>
  );
}
