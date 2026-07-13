"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function ToolbarButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter passage text…",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <ToolbarButton label="Bold" onClick={() => exec("bold")} />
        <ToolbarButton label="Italic" onClick={() => exec("italic")} />
        <ToolbarButton label="Underline" onClick={() => exec("underline")} />
        <ToolbarButton label="• List" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton label="1. List" onClick={() => exec("insertOrderedList")} />
        <ToolbarButton label="Clear" onClick={() => exec("removeFormat")} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        className={cn(
          inputClass,
          "prose prose-sm max-w-none overflow-y-auto [&:empty]:before:pointer-events-none [&:empty]:before:text-slate-400 [&:empty]:before:content-[attr(data-placeholder)]"
        )}
        style={{ minHeight }}
      />
    </div>
  );
}
