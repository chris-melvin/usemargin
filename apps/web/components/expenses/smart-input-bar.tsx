"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Loader2, ArrowUp, X } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";

interface ExpensePreview {
  amount: number;
  label: string;
}

interface SmartInputBarProps {
  onAddExpenses: (expenses: ExpensePreview[]) => void;
  preview: ExpensePreview[];
  isParsing: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export function SmartInputBar({
  onAddExpenses,
  preview,
  isParsing,
  onInputChange,
  onSubmit,
}: SmartInputBarProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 10) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onInputChange(newValue);
    },
    [onInputChange]
  );

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isParsing) return;
    onSubmit(value);
    setValue("");
  }, [value, isParsing, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        setValue("");
        onInputChange("");
        inputRef.current?.blur();
      }
    },
    [handleSubmit, onInputChange]
  );

  const clearInput = useCallback(() => {
    setValue("");
    onInputChange("");
    inputRef.current?.focus();
  }, [onInputChange]);

  const totalPreview = preview.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "transition-all duration-500 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Gradient fade overlay */}
      <div className="absolute inset-x-0 bottom-full h-20 bg-gradient-to-t from-[#FDFCFB] to-transparent pointer-events-none" />

      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="max-w-2xl mx-auto">
          {/* Preview chips */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              preview.length > 0 ? "max-h-24 opacity-100 mb-3" : "max-h-0 opacity-0 mb-0"
            )}
          >
            <div className="flex flex-wrap gap-2 items-center">
              {preview.map((expense, index) => (
                <div
                  key={`${expense.label}-${index}`}
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    "px-3 py-1.5 rounded-full",
                    "bg-amber-50 border border-amber-200/60",
                    "text-sm font-medium text-amber-800",
                    "animate-in fade-in slide-in-from-bottom-2 zoom-in-95",
                    "shadow-sm"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <span className="text-amber-600">{expense.label}</span>
                  <span className="text-amber-500/80 text-xs">
                    {CURRENCY}{expense.amount.toLocaleString()}
                  </span>
                </div>
              ))}

              {preview.length > 1 && (
                <div
                  className={cn(
                    "inline-flex items-center gap-1",
                    "px-2.5 py-1 rounded-full",
                    "bg-stone-100 border border-stone-200/60",
                    "text-xs font-semibold text-stone-500",
                    "animate-in fade-in slide-in-from-bottom-2",
                  )}
                  style={{
                    animationDelay: `${preview.length * 50}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  Total: {CURRENCY}{totalPreview.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Main input container */}
          <div
            className={cn(
              "relative",
              "bg-white/80 backdrop-blur-xl",
              "border border-stone-200/60",
              "rounded-2xl",
              "shadow-[0_-4px_30px_-10px_rgba(0,0,0,0.1)]",
              "transition-all duration-300",
              isFocused && "border-amber-300/60 shadow-[0_-4px_40px_-10px_rgba(245,158,11,0.15)]"
            )}
          >
            {/* Subtle inner glow when focused */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl pointer-events-none",
                "bg-gradient-to-b from-amber-50/0 to-amber-50/30",
                "opacity-0 transition-opacity duration-300",
                isFocused && "opacity-100"
              )}
            />

            <div className="relative flex items-center gap-2 p-2">
              {/* Sparkle indicator */}
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-xl",
                  "flex items-center justify-center",
                  "bg-gradient-to-br from-amber-100 to-amber-50",
                  "border border-amber-200/50",
                  "transition-all duration-300",
                  isFocused && "from-amber-200 to-amber-100"
                )}
              >
                <Sparkles
                  className={cn(
                    "w-4 h-4 text-amber-500",
                    "transition-transform duration-300",
                    isFocused && "scale-110"
                  )}
                />
              </div>

              {/* Input field */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Type 'coffee 120' or 'grab and lunch'..."
                  className={cn(
                    "w-full bg-transparent",
                    "text-stone-800 text-sm",
                    "placeholder:text-stone-400/70",
                    "outline-none",
                    "py-2.5 px-1",
                    "caret-amber-500"
                  )}
                />

                {/* Clear button */}
                {value && (
                  <button
                    onClick={clearInput}
                    className={cn(
                      "absolute right-0 top-1/2 -translate-y-1/2",
                      "w-6 h-6 rounded-full",
                      "flex items-center justify-center",
                      "text-stone-400 hover:text-stone-600",
                      "hover:bg-stone-100",
                      "transition-all duration-200",
                      "animate-in fade-in zoom-in duration-150"
                    )}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || isParsing}
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-xl",
                  "flex items-center justify-center",
                  "transition-all duration-300",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  value.trim() && !isParsing
                    ? "bg-stone-900 text-stone-50 hover:bg-stone-800 active:scale-95 shadow-lg shadow-stone-900/20"
                    : "bg-stone-100 text-stone-400"
                )}
              >
                {isParsing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Keyboard hint */}
          <div
            className={cn(
              "flex items-center justify-center gap-4 mt-2",
              "text-[10px] text-stone-400",
              "transition-opacity duration-300",
              isFocused ? "opacity-100" : "opacity-0"
            )}
          >
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-stone-500">
                ↵
              </kbd>
              to add
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-stone-500">
                esc
              </kbd>
              to clear
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
