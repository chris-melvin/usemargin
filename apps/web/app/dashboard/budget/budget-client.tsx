"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { NotebookBudgetPage } from "@/components/budget/notebook";
import { useServerBudget } from "@/hooks/use-server-budget";
import type { Income, Debt, UserSettings, BudgetBucket } from "@repo/database";

interface BudgetClientProps {
  initialIncomes: Income[];
  initialBills: Debt[];
  userSettings: UserSettings;
  initialBuckets?: BudgetBucket[];
}

export function BudgetClient({
  initialIncomes,
  initialBills,
  userSettings,
  initialBuckets = [],
}: BudgetClientProps) {
  const router = useRouter();

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
    recordDebtPayment,
  } = useServerBudget({ incomes: initialIncomes, bills: initialBills });

  const currency = userSettings.currency;

  // Calculate totals and categorize bills
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
    <div className="min-h-screen bg-[#fffef9]">
      {/* Header */}
      <header className="sticky top-0 z-20 h-14 px-4 flex items-center justify-between border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-600" />
            <h1 className="text-lg font-semibold text-stone-900">Budget</h1>
          </div>
        </div>
      </header>

      {/* Main Content - Notebook View */}
      <main className="max-w-3xl mx-auto pb-20">
        <NotebookBudgetPage
          incomes={incomes}
          bills={bills}
          regularBills={totals.regularBills}
          debts={totals.debts}
          subscriptions={totals.subscriptions}
          plannedExpenses={totals.plannedExpenses}
          buckets={initialBuckets}
          currency={currency}
          isPending={isPending}
          totals={{
            totalIncome: totals.totalIncome,
            totalBills: totals.totalBills,
            totalDebtPayments: totals.totalDebtPayments,
            totalSubscriptions: totals.totalSubscriptions,
            totalExpenses: totals.totalExpenses,
            remaining: totals.remaining,
          }}
          onBucketsChange={() => router.refresh()}
          onAddIncome={addIncome}
          onUpdateIncome={updateIncome}
          onDeleteIncome={deleteIncome}
          onMarkIncomeReceived={markIncomeReceived}
          onResetIncomeStatus={resetIncomeStatus}
          onAddBill={addBill}
          onUpdateBill={updateBill}
          onDeleteBill={deleteBill}
          onMarkBillPaid={markBillPaid}
          onResetBillStatus={resetBillStatus}
          onMakeDebtPayment={makeDebtPayment}
          onRecordDebtPayment={recordDebtPayment}
        />
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
