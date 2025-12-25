"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  PieChart,
  List,
  Plus,
  Wallet,
  Settings,
  ChevronRight,
  X,
} from "lucide-react";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { DayDetailPanel } from "@/components/day-detail/day-detail-panel";
import { DayDetailSheet } from "@/components/day-detail/day-detail-sheet";
import { SmartInputBar } from "@/components/expenses/smart-input-bar";
import { CreateShortcutModal } from "@/components/shortcuts/create-shortcut-modal";
import { ShortcutsSettingsPanel } from "@/components/shortcuts/shortcuts-settings-panel";
import { SuccessFlash } from "@/components/ui/success-flash";
import { useServerExpenses } from "@/hooks/use-server-expenses";
import { useCalendar } from "@/hooks/use-calendar";
import { useAiParser, UnknownShortcut } from "@/hooks/use-ai-parser";
import { useWeeklyPatterns } from "@/hooks/use-weekly-patterns";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useMicroInteractions } from "@/hooks/use-micro-interactions";
import { useOnboarding } from "@/components/onboarding";
import { WeeklyPatternCard } from "@/components/dashboard/weekly-pattern-card";
import { IncomeAllocationCard } from "@/components/dashboard/income-allocation-card";
import { formatKey, formatCurrency, cn } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT, CURRENCY } from "@/lib/constants";
import type { Expense } from "@repo/database";
import type { LocalIncome, LocalBill } from "@/lib/types";

// Demo data for income and bills
const DEMO_INCOMES: LocalIncome[] = [
  {
    id: "i1",
    label: "Salary",
    amount: 25000,
    dayOfMonth: 15,
    isRecurring: true,
    recurringPattern: { frequency: "monthly" },
    status: "expected",
  },
  {
    id: "i2",
    label: "Freelance",
    amount: 5000,
    dayOfMonth: 28,
    isRecurring: true,
    recurringPattern: { frequency: "monthly" },
    status: "expected",
  },
];

const DEMO_BILLS: LocalBill[] = [
  {
    id: "b1",
    label: "Credit Card",
    amount: 5000,
    dueDate: "2024-12-05",
    dueDayOfMonth: 5,
    icon: "💳",
    isRecurring: true,
    recurringPattern: { frequency: "monthly", dayOfMonth: 5 },
    status: "pending",
  },
  {
    id: "b2",
    label: "Rent",
    amount: 8000,
    dueDate: "2024-12-01",
    dueDayOfMonth: 1,
    icon: "🏠",
    isRecurring: true,
    recurringPattern: { frequency: "monthly", dayOfMonth: 1 },
    status: "pending",
  },
  {
    id: "b3",
    label: "Internet",
    amount: 1500,
    dueDate: "2024-12-10",
    dueDayOfMonth: 10,
    icon: "📶",
    isRecurring: true,
    recurringPattern: { frequency: "monthly", dayOfMonth: 10 },
    status: "pending",
  },
];

// Quick add templates
const QUICK_TEMPLATES = [
  { icon: "☕", label: "Coffee", amount: 120 },
  { icon: "🚌", label: "Commute", amount: 45 },
  { icon: "🍱", label: "Lunch", amount: 180 },
  { icon: "🍽️", label: "Dinner", amount: 250 },
  { icon: "🍿", label: "Snack", amount: 60 },
  { icon: "🛵", label: "Grab", amount: 180 },
  { icon: "🛒", label: "Groceries", amount: 500 },
  { icon: "🛍️", label: "Shopping", amount: 300 },
];

type TabType = "calendar" | "insights" | "transactions";

interface DashboardClientProps {
  initialExpenses: Expense[];
}

export function DashboardClient({ initialExpenses }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("calendar");
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMobileDaySheetOpen, setIsMobileDaySheetOpen] = useState(false);
  const [flexBucket] = useState(5000);
  const [incomes] = useState(DEMO_INCOMES);
  const [bills] = useState(DEMO_BILLS);
  const [pendingShortcutData, setPendingShortcutData] = useState<UnknownShortcut | null>(null);
  const [hideSavings, setHideSavings] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Added!");

  // Demo allocation values
  const totalIncome = useMemo(() => incomes.reduce((sum, inc) => sum + inc.amount, 0), [incomes]);
  const totalBills = useMemo(() => bills.reduce((sum, bill) => sum + bill.amount, 0), [bills]);
  const dailyBudgetAllocation = DEFAULT_DAILY_LIMIT * 30;
  const savingsAllocation = 5000;

  // Server-backed expenses with optimistic updates
  const { expenses, addExpense, addExpenses, removeExpense, isPending } = useServerExpenses(initialExpenses);

  // Onboarding
  const { restartTour, onExpenseAdded } = useOnboarding();

  // Micro-interactions for Duolingo-style feedback
  const { quickWin, playSound } = useMicroInteractions();

  // Convert to LocalExpense format for existing components
  const localExpenses = useMemo(() =>
    expenses.map(e => ({
      id: e.id,
      date: e.date,
      amount: e.amount,
      label: e.label,
      category: e.category ?? undefined,
    })),
    [expenses]
  );

  const { todayStatus } = useCalendar(localExpenses);
  const weeklyPatterns = useWeeklyPatterns(localExpenses);
  const { shortcuts, addShortcut, updateShortcut, deleteShortcut } = useShortcuts();

  // AI Parser - Updated to use batch add with success animation
  const handleAiAddExpenses = useCallback(
    async (parsedExpenses: Array<{ amount: number; label: string }>) => {
      await addExpenses(parsedExpenses, new Date());

      // Trigger success feedback
      quickWin();

      // Show success flash
      const firstExpense = parsedExpenses[0];
      setSuccessMessage(
        parsedExpenses.length === 1 && firstExpense
          ? `${firstExpense.label} added!`
          : `${parsedExpenses.length} expenses added!`
      );
      setShowSuccessFlash(true);

      // Notify onboarding
      onExpenseAdded?.();
    },
    [addExpenses, quickWin, onExpenseAdded]
  );

  const handleUnknownShortcut = useCallback((unknown: UnknownShortcut) => {
    setPendingShortcutData(unknown);
    setIsShortcutModalOpen(true);
  }, []);

  const { preview, isParsing, updatePreview, submit, clearPendingShortcut } = useAiParser({
    onSuccess: handleAiAddExpenses,
    onUnknownShortcut: handleUnknownShortcut,
    shortcuts,
  });

  // Today's expenses
  const todayExpenses = useMemo(() => {
    const todayKey = formatKey(new Date());
    return localExpenses
      .filter((e) => formatKey(new Date(e.date)) === todayKey)
      .map((e) => ({ label: e.label, amount: e.amount }));
  }, [localExpenses]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileDaySheetOpen(true);
    }
  };

  const handleAddExpense = async (amount: number, label: string) => {
    if (selectedDate) {
      await addExpense(selectedDate, amount, label);
      quickWin();
      setSuccessMessage(`${label} added!`);
      setShowSuccessFlash(true);
    }
  };

  const handleQuickAdd = async (amount: number, label: string) => {
    await addExpense(new Date(), amount, label);
    quickWin();
    setSuccessMessage(`${label} added!`);
    setShowSuccessFlash(true);
  };

  const handleDeleteExpense = async (id: string) => {
    await removeExpense(id);
  };

  const handleOpenCreateShortcut = () => {
    setPendingShortcutData({ trigger: "", amount: 0 });
    setIsShortcutModalOpen(true);
  };

  const handleSaveShortcut = (trigger: string, label: string, icon?: string) => {
    addShortcut(trigger, label, icon);
    clearPendingShortcut();
  };

  const handleSaveAndLogShortcut = async (trigger: string, label: string, amount: number, icon?: string) => {
    addShortcut(trigger, label, icon);
    await addExpense(new Date(), amount, label);
    clearPendingShortcut();
  };

  const handleCloseShortcutModal = () => {
    setIsShortcutModalOpen(false);
    setPendingShortcutData(null);
    clearPendingShortcut();
  };

  // Calculate budget status
  const budgetPercent = Math.min((todayStatus.spent / todayStatus.limit) * 100, 100);
  const isOverBudget = todayStatus.remaining < 0;
  const statusColor = isOverBudget
    ? "text-rose-600"
    : budgetPercent >= 80
    ? "text-amber-600"
    : "text-emerald-600";

  return (
    <div className="h-screen bg-[#fafaf9] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-14 sm:h-12 px-3 sm:px-4 flex items-center justify-between border-b border-stone-200/60 bg-white/80 backdrop-blur-sm safe-area-top">
        {/* Today's Status */}
        <button
          data-onboarding-target="header-status"
          onClick={() => setIsQuickActionsOpen(true)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
            "bg-gradient-to-r",
            isOverBudget
              ? "from-rose-50 to-rose-100/50 border border-rose-200"
              : budgetPercent >= 80
              ? "from-amber-50 to-amber-100/50 border border-amber-200"
              : "from-emerald-50 to-emerald-100/50 border border-emerald-200",
            "active:scale-95 sm:hover:shadow-md"
          )}
        >
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              isPending ? "animate-pulse" : "",
              isOverBudget ? "bg-rose-500" : budgetPercent >= 80 ? "bg-amber-500" : "bg-emerald-500"
            )}
          />
          <span className={cn("text-sm font-bold tabular-nums", statusColor)}>
            {formatCurrency(Math.abs(todayStatus.remaining), CURRENCY)}
          </span>
          <span className="text-[10px] text-stone-400 uppercase hidden min-[400px]:inline">
            {isOverBudget ? "over" : "left"}
          </span>
        </button>

        {/* Tab Navigation */}
        <div className="flex items-center bg-stone-100/80 rounded-xl p-1">
          {[
            { id: "calendar" as TabType, icon: Calendar, label: "Calendar" },
            { id: "insights" as TabType, icon: PieChart, label: "Insights" },
            { id: "transactions" as TabType, icon: List, label: "List" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 p-2.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              <tab.icon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/analytics"
            className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 text-xs font-medium transition-colors"
          >
            <BarChart3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline sm:ml-1">Analytics</span>
          </Link>
          <button
            onClick={() => setIsSettingsPanelOpen(true)}
            className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-stone-200/60 bg-white/50 flex-col overflow-y-auto">
          {/* Today's Status - Circular Progress */}
          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e7e5e4" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke={isOverBudget ? "#ef4444" : budgetPercent >= 80 ? "#f59e0b" : "#10b981"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${budgetPercent * 2.136} 213.6`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-lg font-bold tabular-nums", statusColor)}>
                    {formatCurrency(Math.abs(todayStatus.remaining), CURRENCY)}
                  </span>
                  <span className="text-[9px] text-stone-400 uppercase tracking-wider">
                    {isOverBudget ? "Over" : "Left"}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long" })}
                </p>
                <p className="text-sm font-semibold text-stone-800 truncate">
                  {isOverBudget ? "Over Budget" : budgetPercent >= 80 ? "Almost There" : "On Track"}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Spent {formatCurrency(todayStatus.spent, CURRENCY)} of{" "}
                  {formatCurrency(todayStatus.limit, CURRENCY)}
                </p>
              </div>
            </div>
            {todayExpenses.length > 0 && (
              <div className="mt-3 space-y-1">
                {todayExpenses.slice(0, 3).map((exp, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 truncate">{exp.label}</span>
                    <span className="text-stone-700 font-medium tabular-nums">
                      -{formatCurrency(exp.amount, CURRENCY)}
                    </span>
                  </div>
                ))}
                {todayExpenses.length > 3 && (
                  <p className="text-[10px] text-stone-400">+{todayExpenses.length - 3} more</p>
                )}
              </div>
            )}
          </div>

          {/* Flex Bucket */}
          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">Flex Bucket</p>
                  <p className="text-sm font-semibold text-stone-800 tabular-nums">
                    {formatCurrency(flexBucket, CURRENCY)}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </div>
          </div>

          {/* Quick Add Grid */}
          <div data-onboarding-target="quick-add-grid" className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">
                Quick Add
              </p>
              <button
                onClick={handleOpenCreateShortcut}
                className="p-1 rounded text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  onClick={() => handleQuickAdd(template.amount, template.label)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-stone-50 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all group"
                  title={`${template.label}: ${formatCurrency(template.amount, CURRENCY)}`}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {template.icon}
                  </span>
                  <span className="text-[9px] text-stone-500 group-hover:text-amber-700 truncate w-full text-center">
                    {template.label}
                  </span>
                </button>
              ))}
            </div>
            {shortcuts.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium mb-2">
                  Your Shortcuts
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {shortcuts.slice(0, 4).map((shortcut) => (
                    <button
                      key={shortcut.id}
                      onClick={() => handleQuickAdd(100, shortcut.label)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-amber-50/50 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 transition-all group"
                    >
                      <span className="text-lg">{shortcut.icon || "📌"}</span>
                      <span className="text-[9px] text-amber-700 truncate w-full text-center">
                        @{shortcut.trigger}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "calendar" && (
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 lg:flex-initial lg:w-[68%] xl:w-[65%] p-2 sm:p-4 overflow-auto">
                <CalendarGrid
                  expenses={localExpenses}
                  incomes={incomes}
                  bills={bills}
                  onDayClick={handleDayClick}
                  selectedDate={selectedDate}
                />
              </div>

              <div className="hidden lg:flex lg:w-[32%] xl:w-[35%] border-l border-stone-200/60 bg-white/50 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <DayDetailPanel
                    selectedDate={selectedDate}
                    expenses={localExpenses}
                    bills={bills}
                    incomes={incomes}
                    dailyLimit={DEFAULT_DAILY_LIMIT}
                    onAddExpense={handleAddExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "insights" && (
            <div className="flex-1 p-3 sm:p-4 overflow-auto">
              <div className="grid grid-cols-1 gap-4 max-w-5xl mx-auto">
                <WeeklyPatternCard
                  weeklyTotal={weeklyPatterns.weeklyTotal}
                  previousWeekTotal={weeklyPatterns.previousWeekTotal}
                  categoryBreakdown={weeklyPatterns.categoryBreakdown}
                  highestDay={weeklyPatterns.highestDay}
                  suggestion={weeklyPatterns.suggestion}
                />
                <IncomeAllocationCard
                  totalIncome={totalIncome}
                  dailyBudgetAllocation={dailyBudgetAllocation}
                  billsAllocation={totalBills}
                  flexBucketAllocation={flexBucket}
                  savingsAllocation={savingsAllocation}
                  hideSavings={hideSavings}
                  onToggleSavings={setHideSavings}
                />
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="flex-1 p-3 sm:p-4 overflow-auto">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-stone-800">Recent Transactions</h3>
                    <span className="text-xs text-stone-400">{expenses.length} total</span>
                  </div>
                  <div className="divide-y divide-stone-100 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {expenses.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-stone-400 text-sm">No transactions yet</p>
                        <p className="text-stone-300 text-xs mt-1">Add your first expense above</p>
                      </div>
                    ) : (
                      expenses
                        .slice()
                        .reverse()
                        .slice(0, 50)
                        .map((expense) => (
                          <div
                            key={expense.id}
                            className={cn(
                              "px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors active:bg-stone-100",
                              expense.id.startsWith("temp-") && "opacity-60"
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium text-stone-800">{expense.label}</p>
                              <p className="text-xs text-stone-400">
                                {new Date(expense.date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-stone-700 tabular-nums">
                              -{formatCurrency(expense.amount, CURRENCY)}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Quick Actions Bottom Sheet */}
      {isQuickActionsOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setIsQuickActionsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-stone-300" />
            </div>

            <div className="px-4 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e7e5e4" strokeWidth="8" />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke={isOverBudget ? "#ef4444" : budgetPercent >= 80 ? "#f59e0b" : "#10b981"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${budgetPercent * 2.136} 213.6`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-base font-bold tabular-nums", statusColor)}>
                      {Math.round(budgetPercent)}%
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-stone-400 uppercase tracking-wider">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                  <p className={cn("text-xl font-bold tabular-nums", statusColor)}>
                    {formatCurrency(Math.abs(todayStatus.remaining), CURRENCY)}{" "}
                    <span className="text-sm font-normal text-stone-400">
                      {isOverBudget ? "over" : "left"}
                    </span>
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Spent {formatCurrency(todayStatus.spent, CURRENCY)} of{" "}
                    {formatCurrency(todayStatus.limit, CURRENCY)}
                  </p>
                </div>
                <button
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="p-2 rounded-full bg-stone-100 text-stone-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {todayExpenses.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {todayExpenses.map((exp, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full bg-stone-100 text-xs"
                    >
                      <span className="text-stone-600">{exp.label}</span>
                      <span className="text-stone-400 ml-1">
                        {formatCurrency(exp.amount, CURRENCY)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">Flex Bucket</p>
                  <p className="text-base font-semibold text-stone-800 tabular-nums">
                    {formatCurrency(flexBucket, CURRENCY)}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300" />
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">
                  Quick Add
                </p>
                <button
                  onClick={() => {
                    setIsQuickActionsOpen(false);
                    handleOpenCreateShortcut();
                  }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {QUICK_TEMPLATES.map((template) => (
                  <button
                    key={template.label}
                    onClick={() => {
                      handleQuickAdd(template.amount, template.label);
                      setIsQuickActionsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-stone-50 active:bg-amber-100 active:scale-95 border border-stone-100 transition-all"
                  >
                    <span className="text-2xl">{template.icon}</span>
                    <span className="text-[10px] text-stone-600 truncate w-full text-center">
                      {template.label}
                    </span>
                  </button>
                ))}
              </div>
              {shortcuts.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-stone-500 uppercase tracking-wider font-medium mb-3">
                    Your Shortcuts
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {shortcuts.slice(0, 4).map((shortcut) => (
                      <button
                        key={shortcut.id}
                        onClick={() => {
                          handleQuickAdd(100, shortcut.label);
                          setIsQuickActionsOpen(false);
                        }}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-amber-50 active:bg-amber-200 active:scale-95 border border-amber-100 transition-all"
                      >
                        <span className="text-2xl">{shortcut.icon || "📌"}</span>
                        <span className="text-[10px] text-amber-700 truncate w-full text-center">
                          @{shortcut.trigger}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Day Detail Sheet */}
      <DayDetailSheet
        isOpen={isMobileDaySheetOpen}
        onClose={() => setIsMobileDaySheetOpen(false)}
        selectedDate={selectedDate}
        expenses={localExpenses}
        bills={bills}
        incomes={incomes}
        dailyLimit={DEFAULT_DAILY_LIMIT}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* Create Shortcut Modal */}
      <CreateShortcutModal
        isOpen={isShortcutModalOpen}
        onClose={handleCloseShortcutModal}
        trigger={pendingShortcutData?.trigger || ""}
        amount={pendingShortcutData?.amount || 0}
        onSave={handleSaveShortcut}
        onSaveAndLog={handleSaveAndLogShortcut}
      />

      {/* Shortcuts Settings Panel */}
      <ShortcutsSettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => setIsSettingsPanelOpen(false)}
        shortcuts={shortcuts}
        onDelete={deleteShortcut}
        onUpdate={updateShortcut}
        onCreateNew={handleOpenCreateShortcut}
        onRestartTutorial={restartTour}
      />

      {/* Smart Input Bar */}
      <SmartInputBar
        onAddExpenses={handleAiAddExpenses}
        preview={preview}
        isParsing={isParsing}
        onInputChange={updatePreview}
        onSubmit={submit}
      />

      {/* Success Animation */}
      <SuccessFlash
        show={showSuccessFlash}
        message={successMessage}
        position="top"
        size="medium"
        onComplete={() => setShowSuccessFlash(false)}
      />
    </div>
  );
}
