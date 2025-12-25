"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Loader2, ArrowUp, X, Command, Plus, HelpCircle, Lightbulb, ChevronUp } from "lucide-react";
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

// NLP syntax examples for power users
const SYNTAX_EXAMPLES = [
  { example: "coffee 120", desc: "Simple expense" },
  { example: "grab 180 and lunch 200", desc: "Multiple items" },
  { example: "@starbucks", desc: "Use saved shortcut" },
  { example: "groceries 1.5k", desc: "Use 'k' for thousands" },
];

// Quick suggestion chips for new users
const QUICK_SUGGESTIONS = [
  { label: "Coffee", amount: 120, icon: "☕" },
  { label: "Lunch", amount: 180, icon: "🍱" },
  { label: "Transport", amount: 50, icon: "🚌" },
  { label: "Grab", amount: 180, icon: "🛵" },
];

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showHotkeyHint, setShowHotkeyHint] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  // Global keyboard shortcut to focus input (/ or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsVisible(true);
        setShowHotkeyHint(false);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsVisible(true);
        setShowHotkeyHint(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Hide on scroll down, show on scroll up (desktop only)
  useEffect(() => {
    const handleScroll = () => {
      // Don't hide on mobile when expanded
      if (isExpanded) return;

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
  }, [isExpanded]);

  // Focus mobile input when expanded
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

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
    setIsExpanded(false);
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
        mobileInputRef.current?.blur();
        setIsExpanded(false);
      }
    },
    [handleSubmit, onInputChange]
  );

  const clearInput = useCallback(() => {
    setValue("");
    onInputChange("");
    inputRef.current?.focus();
    mobileInputRef.current?.focus();
  }, [onInputChange]);

  const handleQuickAdd = useCallback((label: string, amount: number) => {
    setValue(`${label} ${amount}`);
    onInputChange(`${label} ${amount}`);
  }, [onInputChange]);

  const totalPreview = preview.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      {/* Mobile FAB - Only show when not expanded */}
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "fixed bottom-6 right-4 z-50 sm:hidden",
          "w-14 h-14 rounded-2xl",
          "bg-gradient-to-br from-amber-500 to-amber-600",
          "shadow-lg shadow-amber-500/30",
          "flex items-center justify-center",
          "transition-all duration-300",
          "active:scale-90",
          isExpanded || !isVisible ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Expanded Input Sheet */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 sm:hidden" onClick={() => setIsExpanded(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-stone-300" />
            </div>

            {/* Mobile Input Area */}
            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {/* Preview chips */}
              {preview.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {preview.map((expense, index) => (
                    <div
                      key={`${expense.label}-${index}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/60 text-sm"
                    >
                      <span className="text-amber-700 font-medium">{expense.label}</span>
                      <span className="text-amber-500 text-xs">
                        {CURRENCY}{expense.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {preview.length > 1 && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-stone-100 text-xs font-semibold text-stone-500">
                      Total: {CURRENCY}{totalPreview.toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Input field - larger for mobile */}
              <div className="flex gap-2 mb-4">
                <div
                  className={cn(
                    "flex-1 relative",
                    "bg-stone-50",
                    "border-2 border-stone-200",
                    "rounded-2xl",
                    "transition-all duration-300",
                    isFocused && "border-amber-400 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3 p-3">
                    <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <input
                      ref={mobileInputRef}
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={value}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="coffee 120, grab and lunch..."
                      className="flex-1 bg-transparent text-stone-800 text-base outline-none placeholder:text-stone-400"
                    />
                    {value && (
                      <button onClick={clearInput} className="p-1 text-stone-400">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!value.trim() || isParsing}
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    value.trim() && !isParsing
                      ? "bg-stone-900 text-white active:scale-95"
                      : "bg-stone-200 text-stone-400"
                  )}
                >
                  {isParsing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Quick suggestions for mobile */}
              <div className="mb-4">
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Quick add
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {QUICK_SUGGESTIONS.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleQuickAdd(item.label, item.amount)}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 active:bg-amber-100 transition-colors"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-medium text-stone-700">{item.label}</span>
                      <span className="text-xs text-stone-400">{CURRENCY}{item.amount}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Help toggle for mobile */}
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="flex items-center gap-2 text-xs text-stone-400 mb-3"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showHelp ? "Hide tips" : "Show tips for faster input"}
                <ChevronUp className={cn("w-3 h-3 transition-transform", !showHelp && "rotate-180")} />
              </button>

              {/* Syntax help */}
              {showHelp && (
                <div className="bg-stone-50 rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Examples</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SYNTAX_EXAMPLES.map((item) => (
                      <button
                        key={item.example}
                        onClick={() => {
                          setValue(item.example);
                          onInputChange(item.example);
                        }}
                        className="text-left p-2 rounded-lg bg-white border border-stone-200 active:bg-amber-50 transition-colors"
                      >
                        <code className="text-xs font-mono text-amber-600">{item.example}</code>
                        <p className="text-[10px] text-stone-400 mt-0.5">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Input Bar */}
      <div
        data-onboarding-target="smart-input-bar"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "hidden sm:block",
          "transition-all duration-500 ease-out",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
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
                      "animate-in fade-in slide-in-from-bottom-2"
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
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl pointer-events-none",
                  "bg-gradient-to-b from-amber-50/0 to-amber-50/30",
                  "opacity-0 transition-opacity duration-300",
                  isFocused && "opacity-100"
                )}
              />

              <div className="relative flex items-center gap-2 p-2">
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

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      setIsFocused(true);
                      setShowHotkeyHint(false);
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder="coffee 120, grab and lunch, @starbucks..."
                    className={cn(
                      "w-full bg-transparent",
                      "text-stone-800 text-sm",
                      "placeholder:text-stone-400/70",
                      "outline-none",
                      "py-2.5 px-1",
                      "caret-amber-500"
                    )}
                  />
                  {value && (
                    <button
                      onClick={clearInput}
                      className={cn(
                        "absolute right-0 top-1/2 -translate-y-1/2",
                        "w-6 h-6 rounded-full",
                        "flex items-center justify-center",
                        "text-stone-400 hover:text-stone-600",
                        "hover:bg-stone-100",
                        "transition-all duration-200"
                      )}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Help button */}
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg",
                    "flex items-center justify-center",
                    "transition-all duration-200",
                    showHelp
                      ? "bg-amber-100 text-amber-600"
                      : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                  )}
                  title="Show input syntax help"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>

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

              {/* Desktop help panel */}
              {showHelp && (
                <div className="border-t border-stone-100 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                        Input Syntax
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {SYNTAX_EXAMPLES.map((item) => (
                          <button
                            key={item.example}
                            onClick={() => {
                              setValue(item.example);
                              onInputChange(item.example);
                              inputRef.current?.focus();
                            }}
                            className="text-left p-2 rounded-lg bg-stone-50 hover:bg-amber-50 border border-stone-100 hover:border-amber-200 transition-colors"
                          >
                            <code className="text-xs font-mono text-amber-600">{item.example}</code>
                            <p className="text-[10px] text-stone-400 mt-0.5">{item.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-stone-400 bg-stone-50 rounded-lg p-2 max-w-[180px]">
                      <p className="font-medium text-stone-500 mb-1">Pro tips</p>
                      <ul className="space-y-1 text-[10px]">
                        <li>• Use "and" to add multiple items</li>
                        <li>• Create shortcuts with @name</li>
                        <li>• Use "k" for thousands (1.5k = 1500)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Keyboard hints */}
            <div
              className={cn(
                "flex items-center justify-center gap-4 mt-2",
                "text-[10px] text-stone-400",
                "transition-opacity duration-300",
                isFocused || showHotkeyHint ? "opacity-100" : "opacity-0"
              )}
            >
              {!isFocused && showHotkeyHint ? (
                <span className="flex items-center gap-1.5 animate-pulse">
                  Press
                  <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-stone-500">
                    /
                  </kbd>
                  or
                  <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-stone-500 flex items-center gap-0.5">
                    <Command className="w-2.5 h-2.5" />K
                  </kbd>
                  to add expense
                </span>
              ) : (
                <>
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
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-stone-500">
                      ?
                    </kbd>
                    syntax help
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
