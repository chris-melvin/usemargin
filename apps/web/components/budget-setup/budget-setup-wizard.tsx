"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X, Zap, Settings, Wallet, PiggyBank, Gift } from "lucide-react";
import { IncomeStep } from "./steps/income-step";
import { BillsStep } from "./steps/bills-step";
import { BucketsStep } from "./steps/buckets-step";
import { SummaryStep } from "./steps/summary-step";
import {
  WIZARD_STEPS,
  DEFAULT_BUCKETS,
  type WizardIncome,
  type WizardBill,
  type WizardBucket,
  calculateBudgetSummary,
} from "@/lib/budget-setup";
import { completeBudgetSetup } from "@/actions/budget-setup/complete-setup";
import { createDefaultBucketsWithFlex } from "@/actions/buckets";

type SetupMode = "select" | "quick" | "custom";

export function BudgetSetupWizard() {
  const router = useRouter();
  const [mode, setMode] = useState<SetupMode>("select");
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard state
  const [incomes, setIncomes] = useState<WizardIncome[]>([]);
  const [bills, setBills] = useState<WizardBill[]>([]);
  const [buckets, setBuckets] = useState<WizardBucket[]>(
    DEFAULT_BUCKETS.map((b) => ({ ...b, allocatedAmount: 0 }))
  );
  const [dailyLimitOverride, setDailyLimitOverride] = useState<number | null>(
    null
  );

  // Calculate summary
  const summary = calculateBudgetSummary(incomes, bills, buckets);

  const handleNext = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    // Skip to dashboard with default settings
    router.push("/");
  }, [router]);

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const finalDailyLimit = dailyLimitOverride ?? summary.calculatedDailyLimit;

      await completeBudgetSetup({
        incomes,
        bills,
        buckets,
        dailyLimit: finalDailyLimit,
        totalMonthlyIncome: summary.totalMonthlyIncome,
        totalFixedExpenses: summary.totalFixedExpenses,
      });

      router.push("/");
    } catch (error) {
      console.error("Failed to complete setup:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [incomes, bills, buckets, dailyLimitOverride, summary, router]);

  // Quick start handler - create default buckets and go to dashboard
  const handleQuickStart = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Create default buckets (includes flex)
      await createDefaultBucketsWithFlex();

      // Update user settings to mark setup as complete (without re-creating buckets)
      const response = await fetch("/api/settings/quick-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyLimit: 500,
          budgetSetupCompleted: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      router.push("/");
    } catch (error) {
      console.error("Failed to quick start:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  const renderModeSelection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-stone-800">
          Welcome to usemargin
        </h1>
        <p className="text-stone-500 max-w-md mx-auto">
          Let&apos;s set up your budget. Choose how you&apos;d like to get started.
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        {/* Quick Start */}
        <button
          onClick={handleQuickStart}
          disabled={isSubmitting}
          className="group relative p-6 text-left rounded-2xl border-2 border-stone-200 bg-gradient-to-br from-amber-50 to-orange-50 transition-all hover:border-amber-400 hover:shadow-lg disabled:opacity-50"
        >
          <div className="absolute top-4 right-4">
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 rounded-full">
              Recommended
            </span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">Quick Start</h3>
          </div>
          <p className="text-sm text-stone-600 mb-4">
            Start with sensible defaults. You can customize everything later.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <PiggyBank className="w-3.5 h-3.5 text-green-500" />
              <span>Savings (20%)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Wallet className="w-3.5 h-3.5 text-blue-500" />
              <span>Daily Spending (60%)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Gift className="w-3.5 h-3.5 text-violet-500" />
              <span>Flex (20%)</span>
            </div>
          </div>
          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          )}
        </button>

        {/* Custom Setup */}
        <button
          onClick={() => setMode("custom")}
          disabled={isSubmitting}
          className="group p-6 text-left rounded-2xl border-2 border-stone-200 bg-white transition-all hover:border-stone-400 hover:shadow-lg disabled:opacity-50"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-stone-100 text-stone-600">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">Custom Setup</h3>
          </div>
          <p className="text-sm text-stone-600 mb-4">
            Set your income, bills, and create custom budget buckets.
          </p>
          <div className="space-y-2 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span>Add income sources</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span>Track recurring bills</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span>Create custom buckets</span>
            </div>
          </div>
        </button>
      </div>

      {/* Skip link */}
      <div className="text-center">
        <button
          onClick={handleSkip}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          Skip setup for now
        </button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <IncomeStep incomes={incomes} onIncomesChange={setIncomes} />;
      case 2:
        return <BillsStep bills={bills} onBillsChange={setBills} />;
      case 3:
        return (
          <BucketsStep
            buckets={buckets}
            onBucketsChange={setBuckets}
            availableAmount={summary.availableForBudgeting}
          />
        );
      case 4:
        return (
          <SummaryStep
            summary={summary}
            dailyLimitOverride={dailyLimitOverride}
            onDailyLimitOverrideChange={setDailyLimitOverride}
          />
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return incomes.length > 0;
      case 2:
        return true; // Bills are optional
      case 3:
        const totalPercent = buckets.reduce((sum, b) => sum + b.percentage, 0);
        return Math.abs(totalPercent - 100) < 0.01;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const stepInfo = WIZARD_STEPS[currentStep - 1];

  // Show mode selection first
  if (mode === "select") {
    return renderModeSelection();
  }

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">
              {stepInfo?.title}
            </h1>
            <p className="text-sm text-stone-500">{stepInfo?.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-stone-600">
              Step {currentStep} of {WIZARD_STEPS.length}
            </span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2">
          {WIZARD_STEPS.map((step) => (
            <div
              key={step.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step.id < currentStep
                  ? "bg-green-500"
                  : step.id === currentStep
                    ? "bg-amber-500"
                    : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-stone-200 pt-6">
        <div className="flex gap-3">
          {currentStep === 1 ? (
            <button
              onClick={() => setMode("select")}
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-700"
          >
            <X className="h-4 w-4" />
            Skip for now
          </button>
        </div>

        {currentStep < WIZARD_STEPS.length ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-lg bg-stone-800 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={isSubmitting || !canProceed()}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Start Budgeting
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
