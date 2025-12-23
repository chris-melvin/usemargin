"use client";

import { Zap } from "lucide-react";
import { TEMPLATES, CURRENCY } from "@/lib/constants";

interface QuickTemplatesProps {
  onSelect: (amount: number, label: string) => void;
}

export function QuickTemplates({ onSelect }: QuickTemplatesProps) {
  return (
    <section className="bg-white border border-stone-200 p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-4 text-stone-500">
        <Zap className="h-4 w-4" />
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          Templates
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.amount, t.label)}
            className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-100 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-95"
          >
            <span className="text-xl">{t.icon}</span>
            <span className="text-xs font-semibold">{t.label}</span>
            <span className="text-[10px] text-stone-400">
              {CURRENCY}
              {t.amount}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
