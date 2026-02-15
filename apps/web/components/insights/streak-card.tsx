"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { StreakInfo } from "@/lib/insights/types";

interface StreakCardProps {
  streak: StreakInfo;
}

export function StreakCard({ streak }: StreakCardProps) {
  const title =
    streak.type === "under_budget" ? "Under-Budget Streak" : "Tracking Streak";

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="p-4 text-center">
        {streak.current > 0 ? (
          <>
            <div className="flex items-baseline justify-center gap-1">
              <AnimatedNumber
                value={streak.current}
                className="text-4xl font-serif font-bold text-neutral-900"
              />
              <span className="text-sm text-neutral-500">
                {streak.current === 1 ? "day" : "days"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Longest: {streak.longest} {streak.longest === 1 ? "day" : "days"}
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-400">Start your streak today!</p>
        )}
      </div>
    </div>
  );
}
