"use client";

import { useState } from "react";
import { Zap, Plus, Settings2 } from "lucide-react";
import { TEMPLATES, CURRENCY } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface QuickTemplatesProps {
  onSelect: (amount: number, label: string) => void;
  onCreateShortcut?: () => void;
  onOpenSettings?: () => void;
  customShortcuts?: Array<{ id: string; trigger: string; label: string; icon?: string }>;
}

export function QuickTemplates({
  onSelect,
  onCreateShortcut,
  onOpenSettings,
  customShortcuts = [],
}: QuickTemplatesProps) {
  const [pressedId, setPressedId] = useState<string | null>(null);

  const handlePress = (id: string, amount: number, label: string) => {
    setPressedId(id);
    onSelect(amount, label);
    // Reset after animation
    setTimeout(() => setPressedId(null), 200);
  };

  return (
    <section className="bg-white border border-stone-200 rounded-[1.5rem] overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2 text-stone-500">
          <Zap className="h-3.5 w-3.5" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em]">
            Quick Add
          </h2>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors text-stone-400 hover:text-stone-600"
            title="Manage shortcuts"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Compact Grid - 4 columns on desktop, 2 on mobile */}
      <div className="p-3">
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {/* Default Templates */}
          {TEMPLATES.map((t, index) => (
            <button
              key={t.id}
              onClick={() => handlePress(t.id, t.amount, t.label)}
              className={cn(
                "group relative p-2.5 bg-stone-50/80 hover:bg-stone-100 border border-stone-100 rounded-xl",
                "flex flex-col items-center gap-0.5 transition-all duration-200",
                "hover:shadow-sm hover:border-stone-200 hover:-translate-y-0.5",
                "active:scale-95 active:shadow-none",
                pressedId === t.id && "scale-95 bg-amber-50 border-amber-200"
              )}
              style={{
                animationDelay: `${index * 30}ms`,
              }}
            >
              {/* Icon with subtle bounce on hover */}
              <span className="text-lg transition-transform group-hover:scale-110">
                {t.icon}
              </span>
              {/* Label */}
              <span className="text-[10px] font-semibold text-stone-700 truncate max-w-full">
                {t.label}
              </span>
              {/* Amount - smaller and muted */}
              <span className="text-[9px] text-stone-400 font-medium tabular-nums">
                {CURRENCY}{t.amount}
              </span>
            </button>
          ))}

          {/* Custom Shortcuts */}
          {customShortcuts.map((shortcut, index) => (
            <button
              key={shortcut.id}
              onClick={() => handlePress(shortcut.id, 0, shortcut.label)}
              className={cn(
                "group relative p-2.5 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-100 rounded-xl",
                "flex flex-col items-center gap-0.5 transition-all duration-200",
                "hover:shadow-sm hover:border-amber-200 hover:-translate-y-0.5",
                "active:scale-95 active:shadow-none",
                pressedId === shortcut.id && "scale-95 bg-amber-100 border-amber-300"
              )}
            >
              <span className="text-lg transition-transform group-hover:scale-110">
                {shortcut.icon || "⚡"}
              </span>
              <span className="text-[10px] font-semibold text-amber-800 truncate max-w-full">
                @{shortcut.trigger}
              </span>
            </button>
          ))}
        </div>

        {/* Add Custom Button - Separate row for visibility */}
        {onCreateShortcut && (
          <button
            onClick={onCreateShortcut}
            className={cn(
              "mt-3 w-full p-2.5 border-2 border-dashed border-stone-200 rounded-xl",
              "flex items-center justify-center gap-2 transition-all duration-200",
              "text-stone-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/50",
              "active:scale-[0.98]"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Create @shortcut
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
