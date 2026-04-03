import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useTheme } from "@/lib/theme/theme-context";
import { calculateSimpleDailyLimit, getDaysInCurrentMonth } from "@repo/shared/budget";
import { SettingsSection } from "./settings-section";
import { ToggleRow } from "@/components/ui/toggle-row";

export function BudgetSettings() {
  const { settings, updateSetting } = useSettingsContext();
  const { colors } = useTheme();
  const currency = settings.currency === "PHP" ? "\u20B1" : settings.currency;

  const hasCalculated = settings.calculated_daily_limit != null;
  const displayLimit = settings.calculated_daily_limit ?? settings.default_daily_limit;

  const canCalculate =
    settings.total_monthly_income != null &&
    settings.total_monthly_income > 0 &&
    settings.total_fixed_expenses != null;

  const [incomeText, setIncomeText] = useState(
    String(settings.total_monthly_income ?? "")
  );
  const [fixedText, setFixedText] = useState(
    String(settings.total_fixed_expenses ?? "")
  );
  const [limitText, setLimitText] = useState(
    String(settings.default_daily_limit ?? "")
  );
  const [useCustomLimit, setUseCustomLimit] = useState(!hasCalculated);

  const handleIncomeBlur = () => {
    const num = parseFloat(incomeText);
    if (!isNaN(num) && num > 0) {
      updateSetting("total_monthly_income", num);
    }
  };

  const handleFixedBlur = () => {
    const num = parseFloat(fixedText);
    if (!isNaN(num) && num >= 0) {
      updateSetting("total_fixed_expenses", num);
    }
  };

  const handleLimitBlur = () => {
    const num = parseFloat(limitText);
    if (!isNaN(num) && num > 0) {
      updateSetting("default_daily_limit", num);
    }
  };

  const handleToggleCustom = (value: boolean) => {
    setUseCustomLimit(value);
    if (value) {
      // Switch to custom — clear calculated_daily_limit so default_daily_limit is used
      updateSetting("calculated_daily_limit", null);
    } else {
      // Switch back to calculated — recalculate from stored income/expenses
      const income = settings.total_monthly_income;
      const fixed = settings.total_fixed_expenses;
      if (income != null && fixed != null) {
        const newLimit = calculateSimpleDailyLimit(income, fixed, getDaysInCurrentMonth());
        updateSetting("calculated_daily_limit", newLimit);
      }
    }
  };

  return (
    <>
      {/* Income & Expenses */}
      <SettingsSection title="INCOME & EXPENSES">
        <View style={styles.inputRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Monthly Income</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.currencyPrefix, { color: colors.textTertiary }]}>{currency}</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={incomeText}
              onChangeText={setIncomeText}
              onBlur={handleIncomeBlur}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <View style={styles.inputRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Fixed Expenses</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.currencyPrefix, { color: colors.textTertiary }]}>{currency}</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={fixedText}
              onChangeText={setFixedText}
              onBlur={handleFixedBlur}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
      </SettingsSection>

      {/* Daily Limit */}
      <SettingsSection title="DAILY LIMIT">
        {/* Calculated limit display */}
        {!useCustomLimit && hasCalculated && (
          <View style={styles.limitCard}>
            <Text style={[styles.calcLabel, { color: colors.textTertiary }]}>
              Calculated Daily Limit
            </Text>
            <Text style={[styles.limitValue, { color: colors.primary }]}>
              {currency}{displayLimit.toLocaleString()}
            </Text>
            <Text style={[styles.calcDescription, { color: colors.textTertiary }]}>
              Based on your income and fixed expenses
            </Text>
          </View>
        )}

        {/* No income/expenses set and no custom — show manual input */}
        {!useCustomLimit && !hasCalculated && (
          <>
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Daily Limit</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.currencyPrefix, { color: colors.textTertiary }]}>{currency}</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={limitText}
                  onChangeText={setLimitText}
                  onBlur={handleLimitBlur}
                  keyboardType="decimal-pad"
                  placeholder="300"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            <Text style={[styles.helperText, { color: colors.textTertiary }]}>
              Set your income and expenses above to auto-calculate, or enter a limit directly.
            </Text>
          </>
        )}

        {/* Custom override input */}
        {useCustomLimit && (
          <>
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Daily Limit</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.currencyPrefix, { color: colors.textTertiary }]}>{currency}</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={limitText}
                  onChangeText={setLimitText}
                  onBlur={handleLimitBlur}
                  keyboardType="decimal-pad"
                  placeholder="300"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </>
        )}

        {/* Toggle — only when there's data to calculate from */}
        {canCalculate && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow
              label="Set custom limit"
              description="Use your own daily limit instead of the calculated one"
              value={useCustomLimit}
              onToggle={handleToggleCustom}
            />
          </>
        )}
      </SettingsSection>
    </>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currencyPrefix: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    marginRight: 4,
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    minWidth: 80,
    textAlign: "right",
    padding: 0,
  },
  divider: {
    height: 1,
  },
  helperText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    paddingBottom: 4,
  },
  limitCard: {
    alignItems: "center",
    paddingVertical: 12,
  },
  calcLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  limitValue: {
    fontFamily: "Lora_700Bold",
    fontSize: 32,
    fontVariant: ["tabular-nums"],
    marginVertical: 4,
  },
  calcDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
