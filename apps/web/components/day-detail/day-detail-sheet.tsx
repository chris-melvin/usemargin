"use client";

import { X } from "lucide-react";
import { DayDetailPanel } from "./day-detail-panel";
import { cn } from "@/lib/utils";
import type { LocalExpense, LocalBill, LocalIncome } from "@/lib/types";

interface DayDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  expenses: LocalExpense[];
  bills: LocalBill[];
  incomes: LocalIncome[];
  dailyLimit: number;
  onAddExpense: (amount: number, label: string) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onMarkBillPaid?: (billId: string) => void;
}

export function DayDetailSheet({
  isOpen,
  onClose,
  selectedDate,
  expenses,
  bills,
  incomes,
  dailyLimit,
  onAddExpense,
  onDeleteExpense,
  onMarkBillPaid,
}: DayDetailSheetProps) {
  if (!isOpen || !selectedDate) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0",
          "bg-white rounded-t-3xl shadow-2xl",
          "max-h-[85vh] flex flex-col",
          "animate-in slide-in-from-bottom duration-300",
          "safe-area-bottom"
        )}
      >
        {/* Handle + Close */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex-1" />
          <div className="w-10 h-1 rounded-full bg-stone-300" />
          <div className="flex-1 flex justify-end">
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden">
          <DayDetailPanel
            selectedDate={selectedDate}
            expenses={expenses}
            bills={bills}
            incomes={incomes}
            dailyLimit={dailyLimit}
            onAddExpense={onAddExpense}
            onDeleteExpense={onDeleteExpense}
            onMarkBillPaid={onMarkBillPaid}
          />
        </div>
      </div>
    </div>
  );
}
