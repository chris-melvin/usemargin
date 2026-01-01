"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { BudgetSummary } from "@/components/budget/budget-summary";
import { IncomeSection } from "@/components/budget/income-section";
import { BillsSection } from "@/components/budget/bills-section";
import { DebtSection } from "@/components/budget/debt-section";
import { SubscriptionsSection, PlannedExpensesSection } from "@/components/budget/subscriptions-section";
import { BudgetListView } from "@/components/budget/budget-list-view";
import { useServerBudget } from "@/hooks/use-server-budget";
import type { Income, Debt, UserSettings } from "@repo/database";

interface BudgetClientProps {
  initialIncomes: Income[];
  initialBills: Debt[];
  userSettings: UserSettings;
}

export function BudgetClient({
  initialIncomes,
  initialBills,
  userSettings,
}: BudgetClientProps) {
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  // Use the optimistic budget hook
  const {
    incomes,
    bills,
    isPending,
    addIncome,
    updateIncome,
    deleteIncome,
    markIncomeReceived,
    resetIncomeStatus,
    addBill,
    updateBill,
    deleteBill,
    markBillPaid,
    resetBillStatus,
    makeDebtPayment,
  } = useServerBudget({ incomes: initialIncomes, bills: initialBills });

  const currency = userSettings.currency;

  // Calculate totals
  const totals = useMemo(() => {
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    // Separate bills, debt, and subscriptions
    const regularBills = bills.filter(
      (b) => b.is_recurring && !b.total_amount && !isSubscription(b.label)
    );
    const debts = bills.filter((b) => b.total_amount !== null);
    const subscriptions = bills.filter(
      (b) => b.is_recurring && !b.total_amount && isSubscription(b.label)
    );
    const plannedExpenses = bills.filter((b) => !b.is_recurring && !b.total_amount);

    const totalBills = regularBills.reduce((sum, b) => sum + b.amount, 0);
    const totalDebtPayments = debts.reduce((sum, b) => sum + (b.minimum_payment ?? b.amount), 0);
    const totalSubscriptions = subscriptions.reduce((sum, b) => sum + b.amount, 0);
    const totalDebtBalance = debts.reduce((sum, b) => sum + (b.remaining_balance ?? b.total_amount ?? 0), 0);

    return {
      totalIncome,
      totalBills,
      totalDebtPayments,
      totalDebtBalance,
      totalSubscriptions,
      totalExpenses: totalBills + totalDebtPayments + totalSubscriptions,
      remaining: totalIncome - (totalBills + totalDebtPayments + totalSubscriptions),
      regularBills,
      debts,
      subscriptions,
      plannedExpenses,
    };
  }, [incomes, bills]);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="sticky top-0 z-10 h-14 px-4 flex items-center justify-between border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            <h1 className="text-lg font-semibold text-stone-900">Budget</h1>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-100">
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "cards"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
            title="Card view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 pb-20">
        {viewMode === "cards" ? (
          /* Bento Grid Content */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-5">
            {/* Summary - 2x2 */}
            <div className="md:col-span-2 md:row-span-2">
              <BudgetSummary
                totalIncome={totals.totalIncome}
                totalExpenses={totals.totalExpenses}
                totalDebt={totals.totalDebtBalance}
                remaining={totals.remaining}
                currency={currency}
              />
            </div>

            {/* Income - 1x1 */}
            <IncomeSection
              incomes={incomes}
              currency={currency}
              isPending={isPending}
              onAdd={addIncome}
              onUpdate={updateIncome}
              onDelete={deleteIncome}
              onMarkReceived={markIncomeReceived}
              onResetStatus={resetIncomeStatus}
            />

            {/* Bills - 1x1 */}
            <BillsSection
              bills={totals.regularBills}
              currency={currency}
              isPending={isPending}
              onAdd={addBill}
              onUpdate={updateBill}
              onDelete={deleteBill}
              onMarkPaid={markBillPaid}
              onResetStatus={resetBillStatus}
            />

            {/* Debt - 2x1 */}
            <div className="md:col-span-2">
              <DebtSection
                debts={totals.debts}
                currency={currency}
                isPending={isPending}
                onAdd={addBill}
                onUpdate={updateBill}
                onDelete={deleteBill}
                onMakePayment={makeDebtPayment}
              />
            </div>

            {/* Subscriptions - 2x1 */}
            <div className="md:col-span-2">
              <SubscriptionsSection
                subscriptions={totals.subscriptions}
                currency={currency}
                isPending={isPending}
                onAdd={addBill}
                onUpdate={updateBill}
                onDelete={deleteBill}
                onMarkPaid={markBillPaid}
                onResetStatus={resetBillStatus}
              />
            </div>

            {/* Planned Expenses - 2x1 */}
            <div className="md:col-span-2">
              <PlannedExpensesSection
                expenses={totals.plannedExpenses}
                currency={currency}
                isPending={isPending}
                onAdd={addBill}
                onUpdate={updateBill}
                onDelete={deleteBill}
                onMarkPaid={markBillPaid}
                onResetStatus={resetBillStatus}
              />
            </div>
          </div>
        ) : (
          /* List View */
          <BudgetListView
            incomes={incomes}
            bills={totals.regularBills}
            debts={totals.debts}
            subscriptions={totals.subscriptions}
            currency={currency}
            totals={{
              totalIncome: totals.totalIncome,
              totalBills: totals.totalBills,
              totalDebtPayments: totals.totalDebtPayments,
              totalSubscriptions: totals.totalSubscriptions,
            }}
          />
        )}
      </main>

      <Toaster position="bottom-center" />
    </div>
  );
}

// Helper to detect subscriptions by label
function isSubscription(label: string): boolean {
  const subscriptionKeywords = [
    "netflix", "spotify", "youtube", "disney", "hbo", "amazon prime",
    "apple", "google", "microsoft", "adobe", "canva", "figma",
    "gym", "fitness", "membership", "subscription", "premium",
    "hulu", "paramount", "peacock", "crunchyroll",
  ];
  const lowerLabel = label.toLowerCase();
  return subscriptionKeywords.some((keyword) => lowerLabel.includes(keyword));
}
