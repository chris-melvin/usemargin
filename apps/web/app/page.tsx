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
} from "lucide-react";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { DayTimelineModal } from "@/components/day-detail/day-timeline-modal";
import { SmartInputBar } from "@/components/expenses/smart-input-bar";
import { CreateShortcutModal } from "@/components/shortcuts/create-shortcut-modal";
import { ShortcutsSettingsPanel } from "@/components/shortcuts/shortcuts-settings-panel";
import { useExpenses } from "@/hooks/use-expenses";
import { useCalendar } from "@/hooks/use-calendar";
import { useAiParser, UnknownShortcut } from "@/hooks/use-ai-parser";
import { useWeeklyPatterns } from "@/hooks/use-weekly-patterns";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { WeeklyPatternCard } from "@/components/dashboard/weekly-pattern-card";
import { IncomeAllocationCard } from "@/components/dashboard/income-allocation-card";
import { formatKey, formatCurrency, cn } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT, CURRENCY } from "@/lib/constants";

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

// Quick add templates - compact
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("calendar");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [flexBucket] = useState(5000);
  const [incomes] = useState(DEMO_INCOMES);
  const [bills] = useState(DEMO_BILLS);
  const [pendingShortcutData, setPendingShortcutData] = useState<UnknownShortcut | null>(null);
  const [hideSavings, setHideSavings] = useState(false);

  // Demo allocation values
  const totalIncome = useMemo(() => incomes.reduce((sum, inc) => sum + inc.amount, 0), [incomes]);
  const totalBills = useMemo(() => bills.reduce((sum, bill) => sum + bill.amount, 0), [bills]);
  const dailyBudgetAllocation = DEFAULT_DAILY_LIMIT * 30;
  const savingsAllocation = 5000;

  const { expenses, addExpense } = useExpenses();
  const { todayStatus } = useCalendar(expenses);
  const weeklyPatterns = useWeeklyPatterns(expenses);
  const { shortcuts, addShortcut, updateShortcut, deleteShortcut } = useShortcuts();

  // AI Parser
  const handleAiAddExpenses = useCallback(
    (parsedExpenses: Array<{ amount: number; label: string }>) => {
      parsedExpenses.forEach((exp) => {
        addExpense(new Date(), exp.amount, exp.label);
      });
    },
    [addExpense]
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
    return expenses
      .filter((e) => formatKey(new Date(e.date)) === todayKey)
      .map((e) => ({ label: e.label, amount: e.amount }));
  }, [expenses]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleAddExpense = (amount: number, label: string) => {
    addExpense(selectedDate, amount, label);
  };

  const handleQuickAdd = (amount: number, label: string) => {
    addExpense(new Date(), amount, label);
  };

  const handleOpenCreateShortcut = () => {
    setPendingShortcutData({ trigger: "", amount: 0 });
    setIsShortcutModalOpen(true);
  };

  const handleSaveShortcut = (trigger: string, label: string, icon?: string) => {
    addShortcut(trigger, label, icon);
    clearPendingShortcut();
  };

  const handleSaveAndLogShortcut = (trigger: string, label: string, amount: number, icon?: string) => {
    addShortcut(trigger, label, icon);
    addExpense(new Date(), amount, label);
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
      {/* Top Navigation Bar */}
      <header className="flex-shrink-0 h-12 px-4 flex items-center justify-between border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-tight text-stone-900">usemargin</h1>
          <span className="text-stone-200">|</span>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest hidden sm:block">
            Command Center
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-stone-100/80 rounded-lg p-0.5">
          {[
            { id: "calendar" as TabType, icon: Calendar, label: "Calendar" },
            { id: "insights" as TabType, icon: PieChart, label: "Insights" },
            { id: "transactions" as TabType, icon: List, label: "List" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/analytics"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 text-xs font-medium transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>
          <button
            onClick={() => setIsSettingsPanelOpen(true)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - The HUD */}
        <aside className="w-64 lg:w-72 flex-shrink-0 border-r border-stone-200/60 bg-white/50 flex flex-col overflow-y-auto">
          {/* Today's Status - Circular Progress */}
          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center gap-4">
              {/* Circular Progress */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#e7e5e4"
                    strokeWidth="6"
                  />
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

              {/* Today Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long" })}
                </p>
                <p className="text-sm font-semibold text-stone-800 truncate">
                  {isOverBudget ? "Over Budget" : budgetPercent >= 80 ? "Almost There" : "On Track"}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Spent {formatCurrency(todayStatus.spent, CURRENCY)} of {formatCurrency(todayStatus.limit, CURRENCY)}
                </p>
              </div>
            </div>

            {/* Today's expenses mini list */}
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
                  <p className="text-[10px] text-stone-400">
                    +{todayExpenses.length - 3} more
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Flex Bucket - Compact */}
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

          {/* Quick Add - Compact Pills */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">Quick Add</p>
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

            {/* Custom Shortcuts */}
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

        {/* Main Viewport - Tabbed Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "calendar" && (
            <div className="flex-1 p-4 overflow-auto">
              <CalendarGrid
                expenses={expenses}
                incomes={incomes}
                bills={bills}
                onDayClick={handleDayClick}
              />
            </div>
          )}

          {activeTab === "insights" && (
            <div className="flex-1 p-4 overflow-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
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
            <div className="flex-1 p-4 overflow-auto">
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
                            className="px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors"
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

      {/* Day Timeline Modal */}
      <DayTimelineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        expenses={expenses}
        bills={bills}
        incomes={incomes}
        dailyLimit={DEFAULT_DAILY_LIMIT}
        onAddExpense={handleAddExpense}
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
      />

      {/* Smart Input Bar - Fixed at bottom */}
      <SmartInputBar
        onAddExpenses={handleAiAddExpenses}
        preview={preview}
        isParsing={isParsing}
        onInputChange={updatePreview}
        onSubmit={submit}
      />
    </div>
  );
}
