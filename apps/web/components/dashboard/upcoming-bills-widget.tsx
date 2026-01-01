"use client";

import Link from "next/link";
import { Receipt, ChevronRight, AlertCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { DueBadge } from "@/components/budget/due-badge";
import { getDaysUntilDue } from "@/lib/utils/bill-due";
import type { Debt } from "@repo/database";

interface UpcomingBillsWidgetProps {
  bills: Debt[];
  currency: string;
  maxItems?: number;
}

export function UpcomingBillsWidget({
  bills,
  currency,
  maxItems = 4,
}: UpcomingBillsWidgetProps) {
  // Filter to pending bills and sort by days until due
  const upcomingBills = bills
    .filter((b) => b.status === "pending" && b.is_active)
    .map((bill) => ({
      ...bill,
      daysUntil: getDaysUntilDue(bill.due_date),
    }))
    .filter((b) => b.daysUntil !== null && b.daysUntil <= 7)
    .sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999))
    .slice(0, maxItems);

  const totalUpcoming = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
  const hasOverdue = bills.some((b) => b.status === "overdue");

  // Don't show widget if no upcoming bills and nothing overdue
  if (upcomingBills.length === 0 && !hasOverdue) {
    return null;
  }

  return (
    <div className="p-4 border-b border-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
              This Week
            </p>
            <p className="text-sm font-semibold text-neutral-800">
              Upcoming Bills
            </p>
          </div>
        </div>
        {hasOverdue && (
          <div className="flex items-center gap-1 text-rose-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Overdue</span>
          </div>
        )}
      </div>

      {/* Bills List */}
      {upcomingBills.length > 0 ? (
        <>
          <div className="space-y-2">
            {upcomingBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-neutral-50/50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-base flex-shrink-0">
                    {bill.icon || "📋"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-700 truncate">
                      {bill.label}
                    </p>
                    <DueBadge
                      dueDate={bill.due_date}
                      status={bill.status || "pending"}
                      size="sm"
                      showIcon={false}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-amber-600 tabular-nums">
                  {formatCurrency(bill.amount, currency)}
                </span>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Total due this week
            </span>
            <span className="text-sm font-semibold text-neutral-700 tabular-nums">
              {formatCurrency(totalUpcoming, currency)}
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-neutral-400 text-center py-2">
          No bills due this week
        </p>
      )}

      {/* View All Link */}
      <Link
        href="/dashboard/budget"
        className="mt-3 flex items-center justify-center gap-1 text-xs text-teal-600 hover:text-teal-700 transition-colors"
      >
        View all bills
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
