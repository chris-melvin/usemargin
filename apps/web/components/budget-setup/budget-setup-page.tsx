"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartingBalanceSection } from "./sections/starting-balance-section";
import { IncomeSetupSection } from "./sections/income-setup-section";
import { BillsSetupSection } from "./sections/bills-setup-section";
import { DebtSetupSection, type WizardDebt } from "./sections/debt-setup-section";
import { BucketsSetupSection } from "./sections/buckets-setup-section";
import {
  DEFAULT_BUCKETS,
  calculateTotalMonthlyIncome,
  calculateTotalMonthlyExpenses,
  calculateAvailableForBudget,
  calculateDailyLimit,
  getDaysInCurrentMonth,
  type WizardIncome,
  type WizardBill,
  type WizardBucket,
} from "@/lib/budget-setup";
import { completeBudgetSetup } from "@/actions/budget-setup/complete-setup";
import { CURRENCY } from "@/lib/constants";

export function BudgetSetupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [startingBalance, setStartingBalance] = useState("");
  const [incomes, setIncomes] = useState<WizardIncome[]>([]);
  const [bills, setBills] = useState<WizardBill[]>([]);
  const [debts, setDebts] = useState<WizardDebt[]>([]);
  const [buckets, setBuckets] = useState<WizardBucket[]>(
    DEFAULT_BUCKETS.map((b) => ({ ...b, allocatedAmount: 0 }))
  );

  // Calculate summary
  const summary = useMemo(() => {
    const parsedBalance = parseFloat(startingBalance.replace(/,/g, "")) || 0;
    const totalMonthlyIncome = calculateTotalMonthlyIncome(incomes);
    const totalMonthlyBills = calculateTotalMonthlyExpenses(bills);
    const totalDebtPayments = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
    const totalFixedExpenses = totalMonthlyBills + totalDebtPayments;
    const availableForBudgeting = calculateAvailableForBudget(totalMonthlyIncome, totalFixedExpenses);
    const daysInMonth = getDaysInCurrentMonth();
    const dailyLimit = calculateDailyLimit(buckets, availableForBudgeting, daysInMonth);

    return {
      startingBalance: parsedBalance,
      totalMonthlyIncome,
      totalMonthlyBills,
      totalDebtPayments,
      totalFixedExpenses,
      availableForBudgeting,
      dailyLimit,
      daysInMonth,
    };
  }, [startingBalance, incomes, bills, debts, buckets]);

  // Validation
  const isValid = useMemo(() => {
    const hasBalance = summary.startingBalance > 0;
    const hasIncome = incomes.length > 0;
    const bucketsValid = Math.abs(buckets.reduce((sum, b) => sum + b.percentage, 0) - 100) < 0.01;
    return hasBalance && hasIncome && bucketsValid;
  }, [summary.startingBalance, incomes.length, buckets]);

  // Handle skip
  const handleSkip = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  // Handle complete
  const handleComplete = useCallback(async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Convert debts to bills format for the existing completeBudgetSetup action
      const debtBills: WizardBill[] = debts.map((debt) => ({
        id: debt.id,
        label: debt.label,
        amount: debt.monthlyPayment,
        frequency: "monthly" as const,
        category: "loans" as const,
        dueDate: debt.dueDate,
      }));

      const allBills = [...bills, ...debtBills];

      await completeBudgetSetup({
        incomes,
        bills: allBills,
        buckets,
        dailyLimit: summary.dailyLimit,
        totalMonthlyIncome: summary.totalMonthlyIncome,
        totalFixedExpenses: summary.totalFixedExpenses,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to complete setup:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, incomes, bills, debts, buckets, summary, router]);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-stone-900">Welcome to usemargin</h1>
              <p className="text-sm text-stone-500">Let's set up your budget</p>
            </div>
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Skip for now
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-6">
        {/* Starting Balance */}
        <StartingBalanceSection
          balance={startingBalance}
          onBalanceChange={setStartingBalance}
        />

        {/* Income */}
        <IncomeSetupSection
          incomes={incomes}
          onIncomesChange={setIncomes}
        />

        {/* Bills */}
        <BillsSetupSection
          bills={bills}
          onBillsChange={setBills}
        />

        {/* Debt */}
        <DebtSetupSection
          debts={debts}
          onDebtsChange={setDebts}
        />

        {/* Buckets */}
        <BucketsSetupSection
          buckets={buckets}
          onBucketsChange={setBuckets}
          availableAmount={summary.availableForBudgeting}
        />
      </main>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Summary */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-stone-500">Available after expenses</p>
              <p className="text-xl font-bold text-stone-900">
                {CURRENCY}{Math.round(summary.availableForBudgeting).toLocaleString()}/month
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500">Daily limit</p>
              <p className="text-xl font-bold text-emerald-600">
                {CURRENCY}{summary.dailyLimit.toLocaleString()}/day
              </p>
            </div>
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 text-base gap-2 bg-stone-900 hover:bg-stone-800"
          >
            {isSubmitting ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Setting up...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Start Budgeting
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>

          {/* Validation Hints */}
          {!isValid && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {summary.startingBalance <= 0 && (
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-full">
                  Enter starting balance
                </span>
              )}
              {incomes.length === 0 && (
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-full">
                  Add at least one income
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
