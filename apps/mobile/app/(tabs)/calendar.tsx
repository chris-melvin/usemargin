import { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, type DateData } from "react-native-calendars";
import { useSQLiteContext } from "expo-sqlite";
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  formatDate,
  toDateString,
  DATE_FORMATS,
} from "@repo/shared/date";
import { useTimezone } from "@/components/providers/timezone-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { useExpenses } from "@/hooks/use-expenses";
import { ExpenseDao } from "@/lib/db/expense-dao";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpenseEditModal } from "@/components/expenses/expense-edit-modal";
import { useCategories } from "@/hooks/use-categories";
import type { LocalExpense } from "@/lib/db/expense-dao";

export default function CalendarScreen() {
  const timezone = useTimezone();
  const db = useSQLiteContext();
  const { user } = useAuth();
  const { categories } = useCategories();
  const { colors } = useTheme();

  const today = toDateString(new Date().toISOString(), timezone);
  const [selectedDate, setSelectedDate] = useState(today);
  const [markedDates, setMarkedDates] = useState<
    Record<string, { marked: boolean; dotColor: string }>
  >({});
  const [currentMonth, setCurrentMonth] = useState(today);
  const [editingExpense, setEditingExpense] = useState<LocalExpense | null>(null);

  const dao = useMemo(() => new ExpenseDao(db), [db]);

  // Date range for selected day's expenses
  const selectedTimestamp = `${selectedDate}T00:00:00.000Z`;
  const startOfDay = getStartOfDay(selectedTimestamp, timezone);
  const endOfDay = getEndOfDay(selectedTimestamp, timezone);

  const { expenses, total, updateExpense, deleteExpense } = useExpenses(
    startOfDay,
    endOfDay
  );

  // Load marked dates for the visible month
  const loadMarkedDates = useCallback(async () => {
    if (!user) return;
    const monthTimestamp = `${currentMonth}T00:00:00.000Z`;
    const monthStart = getStartOfMonth(monthTimestamp, timezone);
    const monthEnd = getEndOfMonth(monthTimestamp, timezone);

    const dates = await dao.findDatesWithExpenses(user.id, monthStart, monthEnd);
    const marks: Record<string, { marked: boolean; dotColor: string }> = {};
    for (const d of dates) {
      marks[d] = { marked: true, dotColor: "#1A9E9E" };
    }
    setMarkedDates(marks);
  }, [dao, user, currentMonth, timezone]);

  useEffect(() => {
    loadMarkedDates();
  }, [loadMarkedDates]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString);
  };

  // Combine marked dates with selected date highlight
  const calendarMarks = useMemo(() => {
    const marks = { ...markedDates };
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      marked: marks[selectedDate]?.marked || false,
      dotColor: "#1A9E9E",
      selected: true,
      selectedColor: "#1A9E9E",
    } as any;
    return marks;
  }, [markedDates, selectedDate]);

  const dateLabel = formatDate(
    `${selectedDate}T12:00:00.000Z`,
    timezone,
    DATE_FORMATS.WEEKDAY_SHORT
  );

  const currency = "\u20B1";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="px-5 pt-2 pb-3">
        <Text style={[calStyles.screenTitle, { color: colors.textPrimary }]}>Calendar</Text>
      </View>

      <Calendar
        current={currentMonth}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        markedDates={calendarMarks}
        theme={{
          calendarBackground: colors.background,
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#FFFFFF",
          arrowColor: colors.primary,
          dotColor: colors.primary,
          textDayFontFamily: "Inter_400Regular",
          textMonthFontFamily: "Inter_600SemiBold",
          textDayHeaderFontFamily: "Inter_500Medium",
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
          monthTextColor: colors.textPrimary,
          dayTextColor: colors.textSecondary,
          textDisabledColor: colors.textMuted,
        }}
      />

      {/* Selected day info */}
      <View className="px-5 py-3 flex-row items-center justify-between">
        <Text style={[calStyles.dateLabel, { color: colors.textSecondary }]}>{dateLabel}</Text>
        {total > 0 && (
          <Text style={[calStyles.totalLabel, { color: colors.textPrimary }]}>
            Total: {currency}{total.toLocaleString()}
          </Text>
        )}
      </View>

      {/* Expenses for selected day */}
      <View className="flex-1 px-3">
        <ExpenseList
          expenses={expenses}
          timezone={timezone}
          onDelete={deleteExpense}
          onEdit={setEditingExpense}
        />
      </View>

      {/* Edit modal */}
      <ExpenseEditModal
        expense={editingExpense}
        visible={!!editingExpense}
        timezone={timezone}
        existingCategories={categories}
        onClose={() => setEditingExpense(null)}
        onSave={updateExpense}
        onDelete={deleteExpense}
      />
    </SafeAreaView>
  );
}

const calStyles = StyleSheet.create({
  screenTitle: {
    fontFamily: "Lora_700Bold",
    fontSize: 28,
    color: "#1C1917",
  },
  dateLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#57534E",
  },
  totalLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#292524",
    fontVariant: ["tabular-nums"],
  },
});
