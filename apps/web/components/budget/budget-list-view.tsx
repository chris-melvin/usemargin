"use client";

import { Receipt, CreditCard, Repeat, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { Income, Debt } from "@repo/database";

interface BudgetListViewProps {
  incomes: Income[];
  bills: Debt[];
  debts: Debt[];
  subscriptions: Debt[];
  currency: string;
  totals: {
    totalIncome: number;
    totalBills: number;
    totalDebtPayments: number;
    totalSubscriptions: number;
  };
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function formatDueDate(day: number | null): string {
  if (!day) return "-";
  return `${day}${getOrdinalSuffix(day)}`;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    partially_paid: "bg-blue-100 text-blue-700",
    expected: "bg-stone-100 text-stone-600",
    received: "bg-green-100 text-green-700",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", styles[status] || styles.pending)}>
      {status.replace("_", " ")}
    </span>
  );
}

export function BudgetListView({
  incomes,
  bills,
  debts,
  subscriptions,
  currency,
  totals,
}: BudgetListViewProps) {
  const totalMonthly = totals.totalBills + totals.totalDebtPayments + totals.totalSubscriptions;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">
          Monthly Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-stone-400">Income</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(totals.totalIncome, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Bills</p>
            <p className="text-lg font-semibold text-stone-900">{formatCurrency(totals.totalBills, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Debt Payments</p>
            <p className="text-lg font-semibold text-stone-900">{formatCurrency(totals.totalDebtPayments, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">Subscriptions</p>
            <p className="text-lg font-semibold text-stone-900">{formatCurrency(totals.totalSubscriptions, currency)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
          <span className="text-sm text-stone-500">Total Monthly Expenses</span>
          <span className="text-xl font-bold text-stone-900">{formatCurrency(totalMonthly, currency)}</span>
        </div>
      </div>

      {/* Income Section */}
      <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <h3 className="font-medium text-stone-900">Income</h3>
          <span className="ml-auto text-sm text-stone-500">{incomes.length} sources</span>
        </div>
        {incomes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Pay Day</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-900">{income.label}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">
                      {formatCurrency(income.amount, currency)}
                    </td>
                    <td className="px-4 py-3 text-stone-600 capitalize">{income.frequency}</td>
                    <td className="px-4 py-3 text-stone-600">{formatDueDate(income.day_of_month)}</td>
                    <td className="px-4 py-3">{getStatusBadge(income.status || "expected")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-stone-400">No income sources added</div>
        )}
      </section>

      {/* Bills Section */}
      <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-amber-600" />
          <h3 className="font-medium text-stone-900">Bills</h3>
          <span className="ml-auto text-sm text-stone-500">{bills.length} bills</span>
        </div>
        {bills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {bill.icon && <span>{bill.icon}</span>}
                        <span className="font-medium text-stone-900">{bill.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-900 font-medium">
                      {formatCurrency(bill.amount, currency)}
                    </td>
                    <td className="px-4 py-3 text-stone-600 capitalize">{bill.frequency}</td>
                    <td className="px-4 py-3 text-stone-600">{formatDueDate(bill.due_date)}</td>
                    <td className="px-4 py-3">{getStatusBadge(bill.status || "pending")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-stone-400">No bills added</div>
        )}
      </section>

      {/* Debts Section */}
      <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-red-600" />
          <h3 className="font-medium text-stone-900">Debts</h3>
          <span className="ml-auto text-sm text-stone-500">{debts.length} debts</span>
        </div>
        {debts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">APR</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 min-w-[120px]">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {debts.map((debt) => {
                  const total = debt.total_amount || 0;
                  const remaining = debt.remaining_balance ?? total;
                  const paid = total - remaining;
                  const progress = total > 0 ? (paid / total) * 100 : 0;

                  return (
                    <tr key={debt.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {debt.icon && <span>{debt.icon}</span>}
                          <span className="font-medium text-stone-900">{debt.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {formatCurrency(total, currency)}
                      </td>
                      <td className="px-4 py-3 text-red-600 font-medium">
                        {formatCurrency(remaining, currency)}
                      </td>
                      <td className="px-4 py-3 text-stone-900 font-medium">
                        {formatCurrency(debt.minimum_payment ?? debt.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {debt.interest_rate ? `${(debt.interest_rate * 100).toFixed(1)}%` : "-"}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{formatDueDate(debt.due_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-2 flex-1" />
                          <span className="text-xs text-stone-500 w-10 text-right">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-stone-400">No debts added</div>
        )}
      </section>

      {/* Subscriptions Section */}
      <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
          <Repeat className="w-4 h-4 text-purple-600" />
          <h3 className="font-medium text-stone-900">Subscriptions</h3>
          <span className="ml-auto text-sm text-stone-500">{subscriptions.length} active</span>
        </div>
        {subscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Renewal Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {sub.icon && <span>{sub.icon}</span>}
                        <span className="font-medium text-stone-900">{sub.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-900 font-medium">
                      {formatCurrency(sub.amount, currency)}
                    </td>
                    <td className="px-4 py-3 text-stone-600 capitalize">{sub.frequency}</td>
                    <td className="px-4 py-3 text-stone-600">{formatDueDate(sub.due_date)}</td>
                    <td className="px-4 py-3">{getStatusBadge(sub.status || "pending")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-stone-400">No subscriptions added</div>
        )}
      </section>
    </div>
  );
}
