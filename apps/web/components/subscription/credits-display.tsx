"use client";

import { Sparkles, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCreditsState } from "@/hooks/use-subscription";

interface CreditsDisplayProps {
  className?: string;
  showLabel?: boolean;
  showBuyButton?: boolean;
  size?: "sm" | "md";
}

/**
 * Display user's credit balance
 */
export function CreditsDisplay({
  className,
  showLabel = true,
  showBuyButton = false,
  size = "md",
}: CreditsDisplayProps) {
  const router = useRouter();
  const { balance, hasCredits, isLoading } = useCreditsState();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center rounded-lg",
          sizeClasses[size],
          hasCredits
            ? "bg-amber-50 text-amber-700"
            : "bg-stone-100 text-stone-500"
        )}
      >
        <Sparkles className={iconSizes[size]} />
        <span className="font-medium tabular-nums">
          {isLoading ? "..." : balance}
        </span>
        {showLabel && (
          <span className="text-stone-400 hidden sm:inline">credits</span>
        )}
      </div>

      {showBuyButton && (
        <button
          onClick={() => router.push("/credits")}
          className={cn(
            "flex items-center rounded-lg",
            sizeClasses[size],
            "bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
          )}
        >
          <Plus className={iconSizes[size]} />
          <span className="font-medium">Buy</span>
        </button>
      )}
    </div>
  );
}

/**
 * Compact credit badge for navigation/header
 */
export function CreditsBadge({ className }: { className?: string }) {
  const { balance, hasCredits, isLoading } = useCreditsState();

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        hasCredits
          ? "bg-amber-100 text-amber-700"
          : "bg-stone-100 text-stone-500",
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      <span className="tabular-nums">{isLoading ? "..." : balance}</span>
    </div>
  );
}

/**
 * Credit cost indicator shown before AI operations
 */
export function CreditCost({
  cost,
  className,
}: {
  cost: number;
  className?: string;
}) {
  const { balance, hasCredits } = useCreditsState();
  const canAfford = balance >= cost;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs",
        canAfford ? "text-amber-600" : "text-red-500",
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      <span>
        {cost} credit{cost !== 1 ? "s" : ""}
      </span>
      {!canAfford && (
        <span className="text-red-400">(insufficient)</span>
      )}
    </div>
  );
}
