"use client";

import { Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SavingsCelebrationProps {
  amount: number;
  currency: string;
}

export function SavingsCelebration({ amount, currency }: SavingsCelebrationProps) {
  if (amount <= 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
      <Sparkles className="w-3 h-3" />
      <span>You saved {formatCurrency(amount, currency)} today!</span>
    </div>
  );
}
