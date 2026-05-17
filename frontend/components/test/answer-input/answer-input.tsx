"use client";

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AnswerInput({
  value,
  onChange,
  placeholder = "Type your answer here...",
}: AnswerInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={8}
      className="w-full resize-y rounded-xl border border-slate-200 p-4 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
  );
}
