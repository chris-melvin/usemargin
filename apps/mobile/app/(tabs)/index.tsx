import { useState, useCallback } from "react";
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  getTodayTimestamp,
  getStartOfDay,
  getEndOfDay,
} from "@repo/shared/date";
import { useTimezone } from "@/components/providers/timezone-provider";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { useExpenses } from "@/hooks/use-expenses";
import { useSyncStatus } from "@/hooks/use-sync";
import { useCategories } from "@/hooks/use-categories";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { HeroDailyCard } from "@/components/dashboard/hero-daily-card";
import { WeekStrip } from "@/components/dashboard/week-strip";
import { ExpenseList } from "@/components/expenses/expense-list";
import { SmartInput } from "@/components/expenses/smart-input";
import { ExpenseEditModal } from "@/components/expenses/expense-edit-modal";
import { tapMedium } from "@/lib/haptics";
import { usePullToSync } from "@/components/ui/pull-to-sync";
import { LedgrLogo } from "@/components/brand/logo";
import type { LocalExpense } from "@/lib/db/expense-dao";

export default function TodayScreen() {
  const timezone = useTimezone();
  const { settings } = useSettingsContext();
  const [selectedDate, setSelectedDate] = useState(() => getTodayTimestamp(timezone));
  const [showInput, setShowInput] = useState(false);
  const [editingExpense, setEditingExpense] = useState<LocalExpense | null>(null);
  const { status } = useSyncStatus();
  const { categories } = useCategories();
  const { shortcutMap } = useShortcuts();
  const { refreshControl } = usePullToSync();
  const { colors } = useTheme();

  const startOfDay = getStartOfDay(selectedDate, timezone);
  const endOfDay = getEndOfDay(selectedDate, timezone);

  const { expenses, total, addExpense, updateExpense, deleteExpense } =
    useExpenses(startOfDay, endOfDay);

  const limit = settings.calculated_daily_limit ?? settings.default_daily_limit;
  const isBudgetMode = settings.tracking_mode === "budget_enabled";
  const remaining = limit - total;

  const heroExpenses = expenses.map((e) => ({
    label: e.label,
    amount: e.amount,
  }));

  const handleAddExpense = useCallback(
    async (expense: { amount: number; label: string; category?: string; occurred_at: string }) => {
      await addExpense(expense);
    },
    [addExpense]
  );

  const handleTodayPress = useCallback(() => {
    setSelectedDate(getTodayTimestamp(timezone));
  }, [timezone]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="h-14 px-4 flex-row items-center justify-between" style={{ backgroundColor: colors.background }}>
        <LedgrLogo size="sm" />
        <View className="flex-row items-center">
          {status === "syncing" && (
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textTertiary }}>syncing...</Text>
          )}
          {status === "offline" && (
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.warning }}>offline</Text>
          )}
          {status === "error" && (
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.danger }}>sync error</Text>
          )}
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, gap: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <WeekStrip
          selectedDate={selectedDate}
          timezone={timezone}
          onSelectDate={setSelectedDate}
          expenses={expenses}
          dailyLimit={limit}
          onTodayPress={handleTodayPress}
        />

        <HeroDailyCard
          spent={total}
          remaining={remaining}
          limit={limit}
          expenses={heroExpenses}
          selectedDate={selectedDate}
          timezone={timezone}
          isBudgetMode={isBudgetMode}
        />

        <ExpenseList
          expenses={expenses}
          timezone={timezone}
          onDelete={deleteExpense}
          onEdit={setEditingExpense}
        />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => { tapMedium(); setShowInput(true); }}
        className="absolute bottom-24 right-4 w-14 h-14 rounded-2xl items-center justify-center overflow-hidden"
        style={styles.fab}
      >
        <LinearGradient
          colors={["#1A9E9E", "#0F6B6B"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.fabBorder} />
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>

      {/* Smart input modal */}
      <SmartInput
        visible={showInput}
        timezone={timezone}
        categories={categories}
        shortcutMap={shortcutMap}
        onClose={() => setShowInput(false)}
        onSubmit={handleAddExpense}
      />

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

const styles = StyleSheet.create({
  fab: {
    shadowColor: "#1A9E9E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
});
