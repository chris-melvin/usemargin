"use client";

import { useState, useEffect } from "react";
import { Check, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency } from "@/lib/utils";

interface NotebookRowProps {
  label: string;
  amount: number;
  currency: string;
  icon?: string;
  status?: "pending" | "paid" | "received" | "overdue" | "expected" | "partially_paid";
  dueDate?: number | null;
  colorScheme?: "emerald" | "amber" | "rose" | "violet" | "blue" | "neutral";
  isVariable?: boolean;
  isPending?: boolean;
  animationIndex?: number;
  onMarkComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAmountChange?: (amount: number) => void;
}

/**
 * Single row component for notebook view
 * Displays an item on a ruled line with checkbox, label, and amount
 */
export function NotebookRow({
  label,
  amount,
  currency,
  icon,
  status,
  dueDate,
  colorScheme = "neutral",
  isVariable = false,
  isPending = false,
  animationIndex = 0,
  onMarkComplete,
  onEdit,
  onDelete,
  onAmountChange,
}: NotebookRowProps) {
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editedAmount, setEditedAmount] = useState(amount.toString());
  const [justCompleted, setJustCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isComplete = status === "paid" || status === "received";

  // Trigger mount animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Handle checkbox animation
  const handleMarkComplete = () => {
    if (onMarkComplete) {
      setJustCompleted(true);
      onMarkComplete();
      setTimeout(() => setJustCompleted(false), 300);
    }
  };

  // Animation delay class based on index
  const delayIndex = Math.min(animationIndex + 1, 10);
  const animationClass = mounted
    ? `notebook-row-animate notebook-delay-${delayIndex}`
    : "opacity-0";

  const amountColors = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    violet: "text-violet-600",
    blue: "text-blue-600",
    neutral: "text-neutral-700",
  };

  const handleAmountSubmit = () => {
    const newAmount = parseFloat(editedAmount);
    if (!isNaN(newAmount) && newAmount > 0 && onAmountChange) {
      onAmountChange(newAmount);
    }
    setIsEditingAmount(false);
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAmountSubmit();
    } else if (e.key === "Escape") {
      setEditedAmount(amount.toString());
      setIsEditingAmount(false);
    }
  };

  const getOrdinalSuffix = (n: number): string => {
    if (n >= 11 && n <= 13) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between",
        "min-h-[32px] leading-8", // Match ruled line height
        "hover:bg-amber-50/30 transition-colors",
        "border-b border-transparent", // Ruled line from background handles this
        isPending && "opacity-60",
        animationClass
      )}
    >
      {/* Left side: checkbox + icon + label */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        {/* Status checkbox */}
        {onMarkComplete && (
          <button
            onClick={handleMarkComplete}
            className={cn(
              "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center",
              "transition-all duration-200",
              isComplete
                ? "bg-emerald-500 border-emerald-500"
                : "border-neutral-300 hover:border-teal-500",
              justCompleted && "checkbox-animate"
            )}
            disabled={isPending}
          >
            {isComplete && <Check className="w-3 h-3 text-white" />}
          </button>
        )}

        {/* Icon */}
        {icon && <span className="text-base flex-shrink-0">{icon}</span>}

        {/* Label - handwriting style */}
        <span
          className={cn(
            "font-handwriting text-base md:text-lg text-neutral-700 truncate",
            isComplete && "line-through opacity-60"
          )}
        >
          {label}
        </span>

        {/* Due date annotation */}
        {dueDate && (
          <span className="hidden sm:inline text-xs font-handwriting text-neutral-400 ml-1">
            ({dueDate}{getOrdinalSuffix(dueDate)})
          </span>
        )}

        {/* Variable badge */}
        {isVariable && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">
            varies
          </span>
        )}
      </div>

      {/* Right side: amount + actions */}
      <div className="flex items-center gap-2">
        {/* Amount - editable for variable debts */}
        {isVariable && isEditingAmount ? (
          <Input
            type="number"
            value={editedAmount}
            onChange={(e) => setEditedAmount(e.target.value)}
            onBlur={handleAmountSubmit}
            onKeyDown={handleAmountKeyDown}
            className="w-24 h-7 text-right font-handwriting text-lg"
            autoFocus
            min="0"
            step="0.01"
          />
        ) : (
          <button
            onClick={() => isVariable && onAmountChange && setIsEditingAmount(true)}
            className={cn(
              "font-handwriting text-lg md:text-xl tabular-nums",
              amountColors[colorScheme],
              isVariable && onAmountChange && "hover:underline hover:decoration-dashed cursor-pointer",
              isComplete && "line-through opacity-60"
            )}
            disabled={!isVariable || !onAmountChange}
          >
            {formatCurrency(amount, currency)}
          </button>
        )}

        {/* Hover actions */}
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4 text-neutral-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-rose-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state row for when a section has no items
 */
interface NotebookEmptyRowProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function NotebookEmptyRow({ message, actionLabel, onAction }: NotebookEmptyRowProps) {
  return (
    <div className="min-h-[32px] leading-8 flex items-center justify-center">
      <span className="font-handwriting text-neutral-400 italic">{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="ml-2 font-handwriting text-teal-600 hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Add row button that appears inline
 */
interface NotebookAddRowProps {
  onAdd: () => void;
  label?: string;
}

export function NotebookAddRow({ onAdd, label = "Add item" }: NotebookAddRowProps) {
  return (
    <button
      onClick={onAdd}
      className={cn(
        "w-full min-h-[32px] leading-8",
        "flex items-center justify-center gap-2",
        "font-handwriting text-teal-600/70 hover:text-teal-600",
        "border-b border-dashed border-teal-200/50 hover:border-teal-300",
        "transition-colors"
      )}
    >
      <span className="text-lg">+</span>
      <span>{label}</span>
    </button>
  );
}
