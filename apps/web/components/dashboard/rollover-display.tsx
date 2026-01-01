"use client";

import { PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RolloverDisplayProps {
  amount: number;
  currency: string;
}

export function RolloverDisplay({ amount, currency }: RolloverDisplayProps) {
  if (amount <= 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100">
      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
        <PiggyBank className="w-3.5 h-3.5 text-teal-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-teal-600 font-medium">
          Extra from savings
        </p>
        <p className="text-sm font-semibold text-teal-700 tabular-nums">
          +{formatCurrency(amount, currency)}
        </p>
      </div>
    </div>
  );
}
