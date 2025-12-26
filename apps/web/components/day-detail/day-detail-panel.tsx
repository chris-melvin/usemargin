"use client";

import { useMemo, useCallback } from "react";
import { Calendar, Clock, CreditCard, Banknote, Receipt, Check, CalendarDays, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { CompactSmartInput } from "@/components/expenses/compact-smart-input";
import type { LocalExpense, LocalBill, LocalIncome, TimelineEvent } from "@/lib/types";
import type { BudgetBucket } from "@repo/database";

interface ExpensePreview {
  amount: number;
  label: string;
  category?: string;
  bucketId?: string;
  bucketSlug?: string;
}

interface DayDetailPanelProps {
  selectedDate: Date | null;
  expenses: LocalExpense[];
  bills: LocalBill[];
  incomes: LocalIncome[];
  dailyLimit: number;
  onAddExpense: (amount: number, label: string) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onMarkBillPaid?: (billId: string) => void;
  onMarkIncomeReceived?: (incomeId: string) => void;
  // Smart input props
  preview?: ExpensePreview[];
  isParsing?: boolean;
  onInputChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  // Bucket/category props
  buckets?: BudgetBucket[];
  categories?: string[];
  onPreviewUpdate?: (index: number, updates: Partial<ExpensePreview>) => void;
}

// Event type colors and icons
const EVENT_CONFIG = {
  expense: {
    bgColor: "bg-stone-50",
    borderColor: "border-stone-200",
    iconBg: "bg-stone-100",
    textColor: "text-stone-700",
    icon: Receipt,
    prefix: "-",
  },
  bill: {
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    iconBg: "bg-rose-100",
    textColor: "text-rose-600",
    icon: CreditCard,
    prefix: "-",
  },
  bill_due: {
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    iconBg: "bg-rose-100",
    textColor: "text-rose-600",
    icon: CreditCard,
    prefix: "-",
  },
  bill_received: {
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconBg: "bg-orange-100",
    textColor: "text-orange-600",
    icon: CreditCard,
    prefix: "",
  },
  income: {
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    iconBg: "bg-emerald-100",
    textColor: "text-emerald-600",
    icon: Banknote,
    prefix: "+",
  },
};

// Helper function to get category icon
function getCategoryIcon(category: string): string | undefined {
  const icons: Record<string, string> = {
    coffee: "☕",
    food: "🍱",
    transport: "🚌",
    shopping: "🛍️",
    entertainment: "🎬",
    groceries: "🛒",
  };
  return icons[category.toLowerCase()];
}

// Helper function to format ISO timestamp to time (e.g., "2:30 PM")
function formatOccurredAt(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DayDetailPanel({
  selectedDate,
  expenses,
  bills,
  incomes,
  dailyLimit,
  onAddExpense,
  onDeleteExpense,
  onMarkBillPaid,
  preview = [],
  isParsing = false,
  onInputChange,
  onSubmit,
  buckets = [],
  categories = [],
  onPreviewUpdate,
}: DayDetailPanelProps) {
  // Check if smart input is available
  const hasSmartInput = onInputChange && onSubmit;

  // Helper to get bucket name by ID
  const getBucketName = useCallback((bucketId: string | null | undefined): string => {
    if (!bucketId) return '';
    const bucket = buckets.find(b => b.id === bucketId);
    return bucket?.name ?? '';
  }, [buckets]);

  // Helper to get bucket color by ID
  const getBucketColor = useCallback((bucketId: string | null | undefined): string => {
    if (!bucketId) return '#78716c'; // stone-500 default
    const bucket = buckets.find(b => b.id === bucketId);
    return bucket?.color ?? '#78716c';
  }, [buckets]);

  // Build timeline events
  const { timelineEvents, remaining } = useMemo(() => {
    if (!selectedDate) {
      return { timelineEvents: [], totalSpent: 0, remaining: dailyLimit };
    }

    const events: TimelineEvent[] = [];
    const dateKey = selectedDate.toISOString().split("T")[0];
    const dayOfMonth = selectedDate.getDate();
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();

    // Add expenses for this day
    expenses
      .filter((e) => e.date.startsWith(dateKey || ""))
      .forEach((expense) => {
        events.push({
          id: expense.id,
          type: "expense",
          label: expense.label,
          amount: expense.amount,
          time: expense.occurred_at ? formatOccurredAt(expense.occurred_at) : undefined,
          icon: expense.category ? getCategoryIcon(expense.category) : undefined,
          originalData: expense,
        });
      });

    // Add bills due on this day
    bills.forEach((bill) => {
      let isDueToday = false;

      if (bill.dueDayOfMonth) {
        isDueToday = bill.dueDayOfMonth === dayOfMonth;
      } else if (bill.dueDate) {
        const dueDate = new Date(bill.dueDate);
        isDueToday =
          dueDate.getDate() === dayOfMonth &&
          dueDate.getMonth() === month &&
          dueDate.getFullYear() === year;
      }

      if (isDueToday) {
        events.push({
          id: `${bill.id}-due`,
          type: "bill_due",
          label: `${bill.label} Due`,
          amount: bill.amount,
          icon: bill.icon,
          status: bill.status,
          originalData: bill,
        });
      }

      // Check if bill was received today
      if (bill.receiveDate) {
        const receiveDate = new Date(bill.receiveDate);
        if (
          receiveDate.getDate() === dayOfMonth &&
          receiveDate.getMonth() === month &&
          receiveDate.getFullYear() === year
        ) {
          events.push({
            id: `${bill.id}-received`,
            type: "bill_received",
            label: `${bill.label} Received`,
            amount: bill.amount,
            icon: bill.icon,
            originalData: bill,
          });
        }
      }
    });

    // Add income expected/received on this day
    incomes.forEach((income) => {
      if (income.dayOfMonth === dayOfMonth) {
        events.push({
          id: income.id,
          type: "income",
          label: income.label,
          amount: income.amount,
          status: income.status,
          originalData: income,
        });
      }
    });

    // Sort by time (events without time go at the end)
    events.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

    // Calculate totals
    const spent = events
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      timelineEvents: events,
      totalSpent: spent,
      remaining: dailyLimit - spent,
    };
  }, [selectedDate, expenses, bills, incomes, dailyLimit]);

  // Handler for smart input submission
  const handleSmartInputSubmit = (expenses: Array<{ amount: number; label: string }>) => {
    expenses.forEach((exp) => {
      onAddExpense(exp.amount, exp.label);
    });
  };

  // Empty state when no date selected
  if (!selectedDate) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-stone-100 flex items-center justify-center">
          <CalendarDays className="w-8 h-8 text-stone-300" />
        </div>
        <p className="text-stone-500 text-sm font-medium">No date selected</p>
        <p className="text-stone-400 text-xs mt-1">Click on a day to view details</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-br from-stone-50 to-stone-100/50 border-b border-stone-200">
        <div className="flex items-center gap-2 text-stone-500 mb-1">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Day Details</span>
        </div>

        <div className="flex items-end justify-between">
          <h2 className="text-base font-semibold text-stone-800">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </h2>
          <div className="text-right">
            <span
              className={cn(
                "text-lg font-bold tabular-nums",
                remaining >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {formatCurrency(Math.abs(remaining), CURRENCY)}
            </span>
            <p className="text-[10px] text-stone-400">{remaining >= 0 ? "remaining" : "over"}</p>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {timelineEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-stone-300" />
            </div>
            <p className="text-stone-500 text-sm">No events for this day</p>
            <p className="text-stone-400 text-xs mt-1">Add an expense below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {timelineEvents.map((event) => {
              const config = EVENT_CONFIG[event.type];
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all group",
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  {/* Icon */}
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", config.iconBg)}>
                    {event.icon ? (
                      <span className="text-base">{event.icon}</span>
                    ) : (
                      <Icon className={cn("h-4 w-4", config.textColor)} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{event.label}</p>

                    {/* Time, Category, and Bucket row for expenses */}
                    {event.type === "expense" && (
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {event.time && (
                          <span className="text-[10px] text-stone-400">{event.time}</span>
                        )}
                        {(event.originalData as LocalExpense)?.category && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                            {(event.originalData as LocalExpense).category}
                          </span>
                        )}
                        {(event.originalData as LocalExpense)?.bucket_id && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: getBucketColor((event.originalData as LocalExpense).bucket_id) + '20',
                              color: getBucketColor((event.originalData as LocalExpense).bucket_id)
                            }}
                          >
                            {getBucketName((event.originalData as LocalExpense).bucket_id)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Time for non-expense events */}
                    {event.type !== "expense" && event.time && (
                      <p className="text-[10px] text-stone-400">{event.time}</p>
                    )}

                    {event.status && event.type === "bill_due" && (
                      <span
                        className={cn(
                          "inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5",
                          event.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : event.status === "overdue"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {event.status}
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <span className={cn("text-sm font-bold tabular-nums", config.textColor)}>
                      {config.prefix}
                      {formatCurrency(event.amount, CURRENCY)}
                    </span>
                  </div>

                  {/* Actions */}
                  {event.type === "expense" && onDeleteExpense && (
                    <button
                      onClick={() => {
                        const expense = event.originalData as LocalExpense;
                        onDeleteExpense(expense.id);
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                      title="Delete expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {event.type === "bill_due" && event.status === "pending" && onMarkBillPaid && (
                    <button
                      onClick={() => {
                        const bill = event.originalData as LocalBill;
                        onMarkBillPaid(bill.id);
                      }}
                      className="p-1.5 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0"
                      title="Mark as paid"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Section */}
      <div className="flex-shrink-0 border-t border-stone-100 p-4 bg-stone-50/50">
        {hasSmartInput ? (
          <CompactSmartInput
            onAddExpenses={handleSmartInputSubmit}
            preview={preview}
            isParsing={isParsing}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            placeholder="coffee 120, lunch..."
            buckets={buckets}
            categories={categories}
            onPreviewUpdate={onPreviewUpdate}
          />
        ) : (
          <p className="text-center text-xs text-stone-400">
            Select a date to add expenses
          </p>
        )}
      </div>
    </div>
  );
}
