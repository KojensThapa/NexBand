"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled, autoFocus = true }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();

    const next = digits.slice();
    for (let i = 0; i < pasted.length && index + i < length; i++) {
      next[index + i] = pasted[i];
    }
    onChange(next.join("").slice(0, length));

    const focusIndex = Math.min(index + pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={cn(
            "h-12 w-10 rounded-xl border border-slate-200 bg-white text-center text-xl font-semibold text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 sm:h-14 sm:w-12"
          )}
        />
      ))}
    </div>
  );
}
