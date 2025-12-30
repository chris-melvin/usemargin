"use client";

import { Wallet, Check } from "lucide-react";
import { CURRENCY } from "@/lib/constants";

interface StartingBalanceSectionProps {
  balance: string;
  onBalanceChange: (value: string) => void;
}

// Format number with commas
function formatNumber(value: string): string {
  const num = value.replace(/[^0-9.]/g, "");
  const parts = num.split(".");
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return parts.join(".");
}

export function StartingBalanceSection({
  balance,
  onBalanceChange,
}: StartingBalanceSectionProps) {
  const hasValue = balance.length > 0 && parseFloat(balance.replace(/,/g, "")) > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    onBalanceChange(formatted);
  };

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-stone-900">Starting Balance</h2>
          <p className="text-sm text-stone-500">How much money do you have right now?</p>
        </div>
        {hasValue && (
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 text-lg font-medium">
            {CURRENCY}
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="50,000"
            value={balance}
            onChange={handleChange}
            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-4 pl-12 pr-4 text-2xl font-semibold text-stone-900 placeholder-stone-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
          />
        </div>
        <p className="text-xs text-stone-400 px-1">
          Your current bank balance - money you can spend
        </p>
      </div>
    </div>
  );
}
