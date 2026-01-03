"use client";

import { cn } from "@/lib/utils";

interface NotebookPaperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main notebook paper container with ruled lines and margin
 * Provides the base visual structure for the notebook UI
 */
export function NotebookPaper({ children, className }: NotebookPaperProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen",
        "bg-[#fffef9]", // Warm paper white
        className
      )}
    >
      {/* Paper texture overlay */}
      <div className="absolute inset-0 texture-paper pointer-events-none" />

      {/* Red margin line */}
      <div className="absolute left-12 md:left-16 top-0 bottom-0 w-0.5 bg-rose-300/40 z-10" />

      {/* Hole punches (decorative) - hidden on mobile */}
      <div className="hidden md:block absolute left-4 top-20 z-10">
        <div className="space-y-48">
          <div className="w-3 h-3 rounded-full bg-neutral-200/80 border border-neutral-300/50 shadow-inner" />
          <div className="w-3 h-3 rounded-full bg-neutral-200/80 border border-neutral-300/50 shadow-inner" />
          <div className="w-3 h-3 rounded-full bg-neutral-200/80 border border-neutral-300/50 shadow-inner" />
        </div>
      </div>

      {/* Main content area with ruled lines */}
      <div className="notebook-ruled relative">
        {/* Content wrapper with margin padding */}
        <div className="pl-14 md:pl-20 pr-4 md:pr-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Margin annotation component for left margin notes
 */
interface MarginNoteProps {
  children: React.ReactNode;
  className?: string;
  color?: "teal" | "rose" | "amber" | "emerald" | "violet" | "blue";
}

export function MarginNote({ children, className, color = "teal" }: MarginNoteProps) {
  const colorClasses = {
    teal: "text-teal-600",
    rose: "text-rose-500",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    blue: "text-blue-600",
  };

  return (
    <div
      className={cn(
        "absolute -left-12 md:-left-16 w-10 md:w-14",
        "font-handwriting text-xs md:text-sm",
        "text-right pr-2",
        "-rotate-3",
        colorClasses[color],
        className
      )}
    >
      {children}
    </div>
  );
}
