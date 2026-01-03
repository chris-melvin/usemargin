"use client";

import { cn } from "@/lib/utils";

interface NotebookSectionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Section wrapper for notebook view
 * Groups related content with proper spacing
 */
export function NotebookSection({ children, className }: NotebookSectionProps) {
  return (
    <section className={cn("mb-8", className)}>
      {children}
    </section>
  );
}

/**
 * Section content area - contains the rows
 */
interface NotebookSectionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function NotebookSectionContent({ children, className }: NotebookSectionContentProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {children}
    </div>
  );
}

/**
 * Section divider with decorative element
 */
export function NotebookSectionDivider() {
  return (
    <div className="relative h-8 flex items-center justify-center my-4">
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
      <span className="relative px-4 bg-[#fffef9] font-handwriting text-neutral-400 text-sm">
        ~~~~~
      </span>
    </div>
  );
}
