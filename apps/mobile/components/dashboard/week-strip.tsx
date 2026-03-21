import { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  getStartOfWeek,
  addDaysToTimestamp,
  toDateString,
  formatDate,
  getTodayTimestamp,
} from "@repo/shared/date";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { selection as hapticSelection } from "@/lib/haptics";
import type { LocalExpense } from "@/lib/db/expense-dao";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function getSpendingDotColor(spent: number, limit: number, isFuture: boolean): string {
  if (isFuture || spent === 0) return "#E7E5E4";
  const pct = (spent / limit) * 100;
  if (pct > 100) return "#FB7185";
  if (pct >= 80) return "#FBBF24";
  return "#34D399";
}

interface WeekStripProps {
  selectedDate: string;
  timezone: string;
  onSelectDate: (dateTimestamp: string) => void;
  expenses: LocalExpense[];
  dailyLimit: number;
  onTodayPress: () => void;
}

export function WeekStrip({
  selectedDate,
  timezone,
  onSelectDate,
  expenses,
  dailyLimit,
  onTodayPress,
}: WeekStripProps) {
  const { settings } = useSettingsContext();
  const { colors } = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);

  const today = useMemo(() => getTodayTimestamp(timezone), [timezone]);
  const todayKey = useMemo(() => toDateString(today, timezone), [today, timezone]);
  const selectedKey = useMemo(() => toDateString(selectedDate, timezone), [selectedDate, timezone]);

  const weekDays = useMemo(() => {
    const baseWeekStart = getStartOfWeek(today, timezone, settings.week_starts_on);
    const offsetStart = addDaysToTimestamp(baseWeekStart, weekOffset * 7, timezone);
    return Array.from({ length: 7 }, (_, i) =>
      addDaysToTimestamp(offsetStart, i, timezone)
    );
  }, [today, timezone, weekOffset, settings.week_starts_on]);

  // Spending per day
  const spendingByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      const key = toDateString(exp.occurred_at, timezone);
      map.set(key, (map.get(key) ?? 0) + exp.amount);
    }
    return map;
  }, [expenses, timezone]);

  // Month/year label
  const monthLabel = useMemo(() => {
    const first = weekDays[0]!;
    const last = weekDays[6]!;
    const firstMonth = formatDate(first, timezone, "MMM");
    const lastMonth = formatDate(last, timezone, "MMM");
    const firstYear = formatDate(first, timezone, "yyyy");
    const lastYear = formatDate(last, timezone, "yyyy");

    if (firstYear !== lastYear) {
      return `${firstMonth} ${firstYear} \u2013 ${lastMonth} ${lastYear}`;
    }
    if (firstMonth !== lastMonth) {
      return `${firstMonth} \u2013 ${lastMonth} ${firstYear}`;
    }
    return `${firstMonth} ${firstYear}`;
  }, [weekDays, timezone]);

  const goToPrevWeek = useCallback(() => {
    hapticSelection();
    setWeekOffset((o) => o - 1);
  }, []);
  const goToNextWeek = useCallback(() => {
    hapticSelection();
    setWeekOffset((o) => o + 1);
  }, []);
  const goToToday = useCallback(() => {
    setWeekOffset(0);
    onTodayPress();
  }, [onTodayPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.textPrimary }]}>
      {/* Month header + nav */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity onPress={goToPrevWeek} className="p-1.5 rounded-lg">
          <Text style={[styles.navArrow, { color: colors.textTertiary }]}>{"\u2039"}</Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{monthLabel}</Text>
          {weekOffset !== 0 && (
            <TouchableOpacity onPress={goToToday} style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={goToNextWeek} className="p-1.5 rounded-lg">
          <Text style={[styles.navArrow, { color: colors.textTertiary }]}>{"\u203A"}</Text>
        </TouchableOpacity>
      </View>

      {/* 7-column day layout */}
      <View className="flex-row">
        {weekDays.map((day, i) => {
          const dayKey = toDateString(day, timezone);
          const isSelected = dayKey === selectedKey;
          const isTodayDate = dayKey === todayKey;
          const isFuture = dayKey > todayKey;
          const spent = spendingByDay.get(dayKey) ?? 0;
          const dayNum = formatDate(day, timezone, "d");

          return (
            <TouchableOpacity
              key={dayKey}
              onPress={() => { hapticSelection(); onSelectDate(day); }}
              className="flex-1 items-center py-2 rounded-xl"
              style={[
                isSelected && styles.selectedDay,
                isTodayDate && !isSelected && styles.todayDay,
              ]}
            >
              <Text
                style={[
                  styles.weekdayLetter,
                  { color: colors.textTertiary },
                  isSelected && { color: "rgba(255,255,255,0.6)" },
                  isTodayDate && !isSelected && { color: colors.primary },
                ]}
              >
                {WEEKDAY_LETTERS[i]}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  { color: colors.textSecondary },
                  isSelected && { color: "#FFFFFF" },
                  isTodayDate && !isSelected && { color: colors.primaryDark },
                ]}
              >
                {dayNum}
              </Text>
              <View
                className="w-1.5 h-1.5 rounded-full mt-0.5"
                style={{
                  backgroundColor: isSelected
                    ? spent > 0
                      ? "rgba(255,255,255,0.6)"
                      : "#57534E"
                    : getSpendingDotColor(spent, dailyLimit, isFuture),
                }}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(231,229,228,0.6)",
    padding: 12,
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  navArrow: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#A8A29E",
  },
  monthLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#44403C",
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: "rgba(26,158,158,0.1)",
  },
  todayBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#1A9E9E",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  weekdayLetter: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#A8A29E",
    textTransform: "uppercase",
  },
  dayNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#44403C",
  },
  selectedDay: {
    backgroundColor: "#292524",
    borderRadius: 12,
  },
  todayDay: {
    backgroundColor: "rgba(26,158,158,0.08)",
    borderRadius: 12,
  },
});
