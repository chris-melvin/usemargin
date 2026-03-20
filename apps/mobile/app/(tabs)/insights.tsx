import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInsightsData } from "@/hooks/use-insights-data";
import { useSettingsContext } from "@/components/providers/settings-provider";
import type { InsightsPeriod } from "@repo/shared/insights/types";

function PeriodToggle({
  period,
  onChange,
}: {
  period: InsightsPeriod;
  onChange: (p: InsightsPeriod) => void;
}) {
  return (
    <View style={toggleStyles.container}>
      {(["week", "month"] as const).map((p) => (
        <TouchableOpacity
          key={p}
          onPress={() => onChange(p)}
          style={[
            toggleStyles.option,
            period === p && toggleStyles.optionActive,
          ]}
        >
          <Text
            style={[
              toggleStyles.optionText,
              period === p && toggleStyles.optionTextActive,
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
    backgroundColor: "#F5F5F4",
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
    backgroundColor: "#FFFFFF",
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  optionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#A8A29E",
  },
  optionTextActive: {
    color: "#292524",
  },
});

function InsightCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={cardStyles.container}>
      <Text style={cardStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(231,229,228,0.6)",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#A8A29E",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
});

export default function InsightsScreen() {
  const [period, setPeriod] = useState<InsightsPeriod>("month");
  const { settings } = useSettingsContext();
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
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: "#FDFBF7" }}>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#A8A29E" }}>
          Loading insights...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FDFBF7" }}>
      <ScrollView className="px-4 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={insightStyles.screenTitle}>Insights</Text>

        <PeriodToggle period={period} onChange={setPeriod} />

        {/* Period Totals */}
        <InsightCard title={periodTotals.periodLabel}>
          <Text style={insightStyles.bigAmount}>
            {currency}
            {periodTotals.total.toLocaleString()}
          </Text>
          <Text style={insightStyles.subtitle}>
            {currency}
            {periodTotals.avg.toLocaleString()} avg/day
          </Text>
        </InsightCard>

        {/* Spending Trend (bar chart) */}
        <InsightCard title="Spending Trend">
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
                      backgroundColor: day.isToday ? "#1A9E9E" : "rgba(26,158,158,0.25)",
                    }}
                  />
                </View>
              );
            })}
          </View>
        </InsightCard>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <InsightCard title="Categories">
            {categoryBreakdown.map((cat) => (
              <View key={cat.category} className="mb-2.5">
                <View className="flex-row justify-between mb-1">
                  <Text style={insightStyles.categoryLabel}>{cat.category}</Text>
                  <Text style={insightStyles.categoryAmount}>
                    {currency}
                    {cat.amount.toLocaleString()} ({cat.percentage}%)
                  </Text>
                </View>
                <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F5F5F4" }}>
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
        <InsightCard title="Streak">
          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text style={insightStyles.streakNumber}>
                {streaks.current}
              </Text>
              <Text style={insightStyles.streakLabel}>Current</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#F5F5F4" }} />
            <View className="flex-1 items-center">
              <Text style={[insightStyles.streakNumber, { color: "#D6D3D1" }]}>
                {streaks.longest}
              </Text>
              <Text style={insightStyles.streakLabel}>Best</Text>
            </View>
          </View>
          <Text style={insightStyles.streakSubtext}>
            {streaks.type === "under_budget" ? "Days under budget" : "Days tracked"}
          </Text>
        </InsightCard>

        {/* Month Comparison */}
        {monthComparison && (
          <InsightCard title="Month Comparison">
            <View className="flex-row justify-between mb-2">
              <View>
                <Text style={insightStyles.comparisonLabel}>
                  {monthComparison.currentMonthLabel}
                </Text>
                <Text style={insightStyles.comparisonAmount}>
                  {currency}
                  {monthComparison.currentTotal.toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text style={insightStyles.comparisonLabel}>
                  {monthComparison.previousMonthLabel}
                </Text>
                <Text style={[insightStyles.comparisonAmount, { color: "#A8A29E" }]}>
                  {currency}
                  {monthComparison.previousTotal.toLocaleString()}
                </Text>
              </View>
            </View>
            <Text
              style={[
                insightStyles.deltaText,
                { color: monthComparison.delta > 0 ? "#E87356" : "#10B981" },
              ]}
            >
              {monthComparison.delta > 0 ? "+" : ""}
              {monthComparison.percentChange}% vs last month
            </Text>
          </InsightCard>
        )}

        {/* Weekday vs Weekend */}
        <InsightCard title="Weekday vs Weekend">
          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text style={insightStyles.comparisonAmount}>
                {currency}
                {weekdayWeekend.weekdayAvg.toLocaleString()}
              </Text>
              <Text style={insightStyles.streakLabel}>Weekday avg</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#F5F5F4" }} />
            <View className="flex-1 items-center">
              <Text style={insightStyles.comparisonAmount}>
                {currency}
                {weekdayWeekend.weekendAvg.toLocaleString()}
              </Text>
              <Text style={insightStyles.streakLabel}>Weekend avg</Text>
            </View>
          </View>
          {weekdayWeekend.higherOn !== "equal" && (
            <Text style={insightStyles.streakSubtext}>
              {weekdayWeekend.percentDiff}% more on {weekdayWeekend.higherOn}s
            </Text>
          )}
        </InsightCard>

        {/* Tracking Completeness */}
        <InsightCard title="Tracking Completeness">
          <View className="items-center">
            <Text style={insightStyles.completenessNumber}>
              {completeness.percentage}%
            </Text>
            <Text style={insightStyles.subtitle}>
              {completeness.trackedDays} of {completeness.totalDays} days tracked
            </Text>
          </View>
        </InsightCard>

        {/* Time of Day */}
        <InsightCard title="Time of Day">
          {timeOfDay.map((bucket) => (
            <View key={bucket.label} className="flex-row items-center mb-2">
              <Text style={insightStyles.timeLabel}>{bucket.label}</Text>
              <View className="flex-1 h-5 rounded-full overflow-hidden mx-2" style={{ backgroundColor: "#F5F5F4" }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${bucket.percentage}%`, backgroundColor: "#1A9E9E" }}
                />
              </View>
              <Text style={insightStyles.timePercentage}>
                {bucket.percentage}%
              </Text>
            </View>
          ))}
        </InsightCard>

        {/* Top Spending Days */}
        {topDays.length > 0 && (
          <InsightCard title="Top Spending Days">
            {topDays.map((day, i) => (
              <View
                key={day.date}
                className="flex-row items-center justify-between py-2"
                style={{ borderBottomWidth: 1, borderBottomColor: "#FAFAF9" }}
              >
                <View className="flex-row items-center">
                  <Text style={insightStyles.rankNumber}>
                    {i + 1}
                  </Text>
                  <View className="ml-2">
                    <Text style={insightStyles.categoryLabel}>{day.dateLabel}</Text>
                    {day.topExpense && (
                      <Text style={insightStyles.streakLabel}>
                        {day.topExpense.description}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={insightStyles.categoryAmount}>
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
    color: "#1C1917",
    marginBottom: 16,
  },
  bigAmount: {
    fontFamily: "Lora_700Bold",
    fontSize: 32,
    color: "#1C1917",
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#78716C",
  },
  categoryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#44403C",
  },
  categoryAmount: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#292524",
    fontVariant: ["tabular-nums"],
  },
  streakNumber: {
    fontFamily: "Lora_700Bold",
    fontSize: 32,
    color: "#1A9E9E",
  },
  streakLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#A8A29E",
    marginTop: 4,
  },
  streakSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#A8A29E",
    textAlign: "center",
    marginTop: 8,
  },
  comparisonLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#A8A29E",
  },
  comparisonAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#292524",
    fontVariant: ["tabular-nums"],
  },
  deltaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  completenessNumber: {
    fontFamily: "Lora_700Bold",
    fontSize: 40,
    color: "#1A9E9E",
  },
  timeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#78716C",
    width: 72,
  },
  timePercentage: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#44403C",
    fontVariant: ["tabular-nums"],
    width: 40,
    textAlign: "right",
  },
  rankNumber: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#D6D3D1",
    width: 20,
  },
});
