"use client";

import { useMemo, useState } from "react";
import { CalendarNav } from "./calendar-nav";
import { CalendarDayCell } from "./calendar-day";
import { daysInMonth, firstDayOfMonth, formatKey } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT } from "@/lib/constants";
import type { CalendarDay, LocalExpense, LocalIncome, LocalBill } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  expenses: LocalExpense[];
  incomes?: LocalIncome[];
  bills?: LocalBill[];
  onDayClick: (date: Date) => void;
}

export function CalendarGrid({ expenses, incomes = [], bills = [], onDayClick }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    const days: CalendarDay[] = [];

    // Filter expenses for current month
    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    // Pad beginning of month
    for (let i = 0; i < startOffset; i++) {
      days.push({
        day: 0,
        date: new Date(),
        key: `padding-${i}`,
        limit: 0,
        spent: 0,
        remaining: 0,
        isPadding: true,
      });
    }

    // Generate month days
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const key = formatKey(dateObj);

      const spent = monthExpenses
        .filter((e) => formatKey(new Date(e.date)) === key)
        .reduce((sum, e) => sum + e.amount, 0);

      const limit = DEFAULT_DAILY_LIMIT;
      const remaining = limit - spent;

      // Check for income on this day
      const dayIncomes = incomes.filter((inc) => inc.dayOfMonth === d);
      const incomeAmount = dayIncomes.reduce((sum, inc) => sum + inc.amount, 0);

      // Check for bills on this day (use dueDayOfMonth for recurring, or parse dueDate)
      const dayBills = bills.filter((bill) => {
        // For recurring bills, use dueDayOfMonth
        if (bill.dueDayOfMonth) {
          return bill.dueDayOfMonth === d;
        }
        // For specific date bills, parse the ISO date
        if (bill.dueDate) {
          const billDate = new Date(bill.dueDate);
          return billDate.getDate() === d &&
                 billDate.getMonth() === month &&
                 billDate.getFullYear() === year;
        }
        return false;
      });
      const billAmount = dayBills.reduce((sum, bill) => sum + bill.amount, 0);
      const billLabel = dayBills.length > 0 ? dayBills[0]?.label : undefined;

      days.push({
        day: d,
        date: dateObj,
        key,
        limit,
        spent,
        remaining,
        hasIncome: dayIncomes.length > 0,
        incomeAmount: incomeAmount > 0 ? incomeAmount : undefined,
        hasBill: dayBills.length > 0,
        billAmount: billAmount > 0 ? billAmount : undefined,
        billLabel,
      });
    }

    return days;
  }, [currentDate, expenses, incomes, bills]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white border border-stone-200 rounded-[2rem] shadow-sm overflow-hidden">
      <CalendarNav
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center border-b border-stone-50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-4 text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, i) => (
          <CalendarDayCell
            key={day.key}
            day={day}
            onClick={() => !day.isPadding && onDayClick(day.date)}
          />
        ))}
      </div>
    </div>
  );
}
