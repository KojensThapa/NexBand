"use client";

import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
      <path d="M9.88 5.09A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a13.2 13.2 0 0 1-3.17 4.13M6.6 6.6C3.79 8.36 1.5 12 1.5 12s3.5 7 10.5 7a10.6 10.6 0 0 0 4.4-.94" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
}

/** Drop-in replacement for `<input type="password" .../>` with a show/hide toggle. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={cn(inputClass, className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
      >
        {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
}
