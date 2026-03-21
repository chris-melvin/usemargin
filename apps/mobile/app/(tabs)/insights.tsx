import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInsightsData } from "@/hooks/use-insights-data";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useTheme } from "@/lib/theme/theme-context";
import type { ThemeColors } from "@/lib/theme/colors";
import type { InsightsPeriod } from "@repo/shared/insights/types";

function PeriodToggle({
  period,
  onChange,
  colors,
}: {
  period: InsightsPeriod;
  onChange: (p: InsightsPeriod) => void;
  colors: ThemeColors;
}) {
  return (
    <View style={[toggleStyles.container, { backgroundColor: colors.surface }]}>
      {(["week", "month"] as const).map((p) => (
        <TouchableOpacity
          key={p}
          onPress={() => onChange(p)}
          style={[
            toggleStyles.option,
            period === p && [toggleStyles.optionActive, { backgroundColor: colors.card, shadowColor: colors.textPrimary }],
          ]}
        >
          <Text
            style={[
              toggleStyles.optionText,
              { color: colors.textTertiary },
              period === p && { color: colors.textPrimary },
            ]}
          >
            {p === "week" ? "Week" : "Month"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  optionActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  optionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});

function InsightCard({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
}) {
  return (
    <View style={[cardStyles.container, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.textPrimary }]}>
      <Text style={[cardStyles.title, { color: colors.textTertiary }]}>{title}</Text>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
});

export default function InsightsScreen() {
  const [period, setPeriod] = useState<InsightsPeriod>("month");
  const { settings } = useSettingsContext();
  const { colors } = useTheme();
  const currency = settings.currency === "PHP" ? "\u20B1" : settings.currency;

  const {
    isLoading,
    dailySpending,
    categoryBreakdown,
    streaks,
    periodTotals,
    monthComparison,
    weekdayWeekend,
    completeness,
    topDays,
    timeOfDay,
  } = useInsightsData(period);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textTertiary }}>
          Loading insights...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="px-4 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[insightStyles.screenTitle, { color: colors.textPrimary }]}>Insights</Text>

        <PeriodToggle period={period} onChange={setPeriod} colors={colors} />

        {/* Period Totals */}
        <InsightCard title={periodTotals.periodLabel} colors={colors}>
          <Text style={[insightStyles.bigAmount, { color: colors.textPrimary }]}>
            {currency}
            {periodTotals.total.toLocaleString()}
          </Text>
          <Text style={[insightStyles.subtitle, { color: colors.textSecondary }]}>
            {currency}
            {periodTotals.avg.toLocaleString()} avg/day
          </Text>
        </InsightCard>

        {/* Spending Trend (bar chart) */}
        <InsightCard title="Spending Trend" colors={colors}>
          <View className="flex-row items-end justify-between h-24">
            {dailySpending.slice(-14).map((day) => {
              const maxAmt = Math.max(
                ...dailySpending.slice(-14).map((d) => d.amount),
                1
              );
              const height = Math.max((day.amount / maxAmt) * 80, 2);
              return (
                <View key={day.date} className="items-center flex-1 mx-0.5">
                  <View
                    className="w-full rounded-t"
                    style={{
                      height,
                      backgroundColor: day.isToday ? colors.primary : "rgba(26,158,158,0.25)",
                    }}
                  />
                </View>
              );
            })}
          </View>
        </InsightCard>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <InsightCard title="Categories" colors={colors}>
            {categoryBreakdown.map((cat) => (
              <View key={cat.category} className="mb-2.5">
                <View className="flex-row justify-between mb-1">
                  <Text style={[insightStyles.categoryLabel, { color: colors.textSecondary }]}>{cat.category}</Text>
                  <Text style={[insightStyles.categoryAmount, { color: colors.textPrimary }]}>
                    {currency}
                    {cat.amount.toLocaleString()} ({cat.percentage}%)
                  </Text>
                </View>
                <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.surface }}>
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </View>
              </View>
            ))}
          </InsightCard>
        )}

        {/* Streak */}
        <InsightCard title="Streak" colors={colors}>
          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text style={[insightStyles.streakNumber, { color: colors.primary }]}>
                {streaks.current}
              </Text>
              <Text style={[insightStyles.streakLabel, { color: colors.textTertiary }]}>Current</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.divider }} />
            <View className="flex-1 items-center">
              <Text style={[insightStyles.streakNumber, { color: colors.textMuted }]}>
                {streaks.longest}
              </Text>
              <Text style={[insightStyles.streakLabel, { color: colors.textTertiary }]}>Best</Text>
            </View>
          </View>
          <Text style={[insightStyles.streakSubtext, { color: colors.textTertiary }]}>
            {streaks.type === "under_budget" ? "Days under budget" : "Days tracked"}
          </Text>
        </InsightCard>

        {/* Month Comparison */}
        {monthComparison && (
          <InsightCard title="Month Comparison" colors={colors}>
            <View className="flex-row justify-between mb-2">
              <View>
                <Text style={[insightStyles.comparisonLabel, { color: colors.textTertiary }]}>
                  {monthComparison.currentMonthLabel}
                </Text>
                <Text style={[insightStyles.comparisonAmount, { color: colors.textPrimary }]}>
                  {currency}
                  {monthComparison.currentTotal.toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text style={[insightStyles.comparisonLabel, { color: colors.textTertiary }]}>
                  {monthComparison.previousMonthLabel}
                </Text>
                <Text style={[insightStyles.comparisonAmount, { color: colors.textTertiary }]}>
                  {currency}
                  {monthComparison.previousTotal.toLocaleString()}
                </Text>
              </View>
            </View>
            <Text
              style={[
                insightStyles.deltaText,
                { color: monthComparison.delta > 0 ? colors.coral : colors.success },
              ]}
            >
              {monthComparison.delta > 0 ? "+" : ""}
              {monthComparison.percentChange}% vs last month
            </Text>
          </InsightCard>
        )}

        {/* Weekday vs Weekend */}
        <InsightCard title="Weekday vs Weekend" colors={colors}>
          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text style={[insightStyles.comparisonAmount, { color: colors.textPrimary }]}>
                {currency}
                {weekdayWeekend.weekdayAvg.toLocaleString()}
              </Text>
              <Text style={[insightStyles.streakLabel, { color: colors.textTertiary }]}>Weekday avg</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.divider }} />
            <View className="flex-1 items-center">
              <Text style={[insightStyles.comparisonAmount, { color: colors.textPrimary }]}>
                {currency}
                {weekdayWeekend.weekendAvg.toLocaleString()}
              </Text>
              <Text style={[insightStyles.streakLabel, { color: colors.textTertiary }]}>Weekend avg</Text>
            </View>
          </View>
          {weekdayWeekend.higherOn !== "equal" && (
            <Text style={[insightStyles.streakSubtext, { color: colors.textTertiary }]}>
              {weekdayWeekend.percentDiff}% more on {weekdayWeekend.higherOn}s
            </Text>
          )}
        </InsightCard>

        {/* Tracking Completeness */}
        <InsightCard title="Tracking Completeness" colors={colors}>
          <View className="items-center">
            <Text style={[insightStyles.completenessNumber, { color: colors.primary }]}>
              {completeness.percentage}%
            </Text>
            <Text style={[insightStyles.subtitle, { color: colors.textSecondary }]}>
              {completeness.trackedDays} of {completeness.totalDays} days tracked
            </Text>
          </View>
        </InsightCard>

        {/* Time of Day */}
        <InsightCard title="Time of Day" colors={colors}>
          {timeOfDay.map((bucket) => (
            <View key={bucket.label} className="flex-row items-center mb-2">
              <Text style={[insightStyles.timeLabel, { color: colors.textSecondary }]}>{bucket.label}</Text>
              <View className="flex-1 h-5 rounded-full overflow-hidden mx-2" style={{ backgroundColor: colors.surface }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${bucket.percentage}%`, backgroundColor: colors.primary }}
                />
              </View>
              <Text style={[insightStyles.timePercentage, { color: colors.textSecondary }]}>
                {bucket.percentage}%
              </Text>
            </View>
          ))}
        </InsightCard>

        {/* Top Spending Days */}
        {topDays.length > 0 && (
          <InsightCard title="Top Spending Days" colors={colors}>
            {topDays.map((day, i) => (
              <View
                key={day.date}
                className="flex-row items-center justify-between py-2"
                style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
              >
                <View className="flex-row items-center">
                  <Text style={[insightStyles.rankNumber, { color: colors.textMuted }]}>
                    {i + 1}
                  </Text>
                  <View className="ml-2">
                    <Text style={[insightStyles.categoryLabel, { color: colors.textSecondary }]}>{day.dateLabel}</Text>
                    {day.topExpense && (
                      <Text style={[insightStyles.streakLabel, { color: colors.textTertiary }]}>
                        {day.topExpense.description}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[insightStyles.categoryAmount, { color: colors.textPrimary }]}>
                  {currency}
                  {day.total.toLocaleString()}
                </Text>
              </View>
            ))}
          </InsightCard>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

const insightStyles = StyleSheet.create({
  screenTitle: {
    fontFamily: "Lora_700Bold",
    fontSize: 28,
    marginBottom: 16,
  },
  bigAmount: {
    fontFamily: "Lora_700Bold",
    fontSize: 32,
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  categoryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  categoryAmount: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  streakNumber: {
    fontFamily: "Lora_700Bold",
    fontSize: 32,
  },
  streakLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  streakSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  comparisonLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  comparisonAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    fontVariant: ["tabular-nums"],
  },
  deltaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  completenessNumber: {
    fontFamily: "Lora_700Bold",
    fontSize: 40,
  },
  timeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    width: 72,
  },
  timePercentage: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    width: 40,
    textAlign: "right",
  },
  rankNumber: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    width: 20,
  },
});
