"use client";

import { useState } from "react";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { ExpenseModal } from "@/components/expenses/expense-modal";
import { QuickTemplates } from "@/components/expenses/quick-templates";
import { DayStatus } from "@/components/dashboard/day-status";
import { FlexBucket } from "@/components/dashboard/flex-bucket";
import { useExpenses } from "@/hooks/use-expenses";
import { useCalendar } from "@/hooks/use-calendar";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [flexBucket] = useState(5000); // Static for now

  const { expenses, addExpense } = useExpenses();
  const { todayStatus } = useCalendar(expenses);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleAddExpense = (amount: number, label: string) => {
    addExpense(selectedDate, amount, label);
  };

  const handleTemplateSelect = (amount: number, label: string) => {
    // Add to today's date
    addExpense(new Date(), amount, label);
  };

  return (
    <div className="min-h-screen bg-[var(--color-margin-bg)] text-stone-800 p-4 md:p-8 flex flex-col items-center">
      <DayStatus remaining={todayStatus.remaining} />

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          <FlexBucket balance={flexBucket} />
          <QuickTemplates onSelect={handleTemplateSelect} />
        </div>

        {/* Calendar (8 cols) */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <CalendarGrid expenses={expenses} onDayClick={handleDayClick} />
        </div>
      </main>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onAddExpense={handleAddExpense}
      />
    </div>
  );
}
