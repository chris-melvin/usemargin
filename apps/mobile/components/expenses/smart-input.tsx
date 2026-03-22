import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TEMPLATES, CURRENCY } from "@repo/shared/constants";
import { getCurrentTimestamp } from "@repo/shared/date";
import {
  parseExpenseInput,
  type ParsedExpense,
  type ShortcutEntry,
} from "@/lib/parser/expense-parser";
import { useTheme } from "@/lib/theme/theme-context";
import { tapLight, notifySuccess } from "@/lib/haptics";

interface SmartInputProps {
  visible: boolean;
  timezone: string;
  categories: string[];
  shortcutMap?: Map<string, ShortcutEntry>;
  onClose: () => void;
  onSubmit: (expense: {
    amount: number;
    label: string;
    category?: string;
    occurred_at: string;
  }) => void;
}

export function SmartInput({
  visible,
  timezone,
  categories,
  shortcutMap,
  onClose,
  onSubmit,
}: SmartInputProps) {
  const [nlpInput, setNlpInput] = useState("");
  const [preview, setPreview] = useState<ParsedExpense[]>([]);
  const { colors } = useTheme();

  const totalAmount = preview.reduce((sum, p) => sum + p.amount, 0);

  const handleNlpChange = useCallback(
    (text: string) => {
      setNlpInput(text);
      if (!text.trim()) {
        setPreview([]);
        return;
      }
      const result = parseExpenseInput(text, shortcutMap);
      setPreview(result || []);
    },
    [shortcutMap]
  );

  const handleSubmit = () => {
    if (preview.length === 0) return;
    notifySuccess();

    const now = getCurrentTimestamp(timezone);
    for (const expense of preview) {
      let occurredAt = now;

      if (expense.parsedTime) {
        const d = expense.parsedTime.date
          ? new Date(expense.parsedTime.date)
          : new Date();
        if (expense.parsedTime.hours !== undefined) {
          d.setHours(
            expense.parsedTime.hours,
            expense.parsedTime.minutes ?? 0,
            0,
            0
          );
        }
        occurredAt = d.toISOString();
      }

      onSubmit({
        amount: expense.amount,
        label: expense.label,
        category: expense.category,
        occurred_at: occurredAt,
      });
    }
    resetAndClose();
  };

  const handleTemplatePress = (template: (typeof TEMPLATES)[number]) => {
    tapLight();
    onSubmit({
      amount: template.amount,
      label: template.label,
      occurred_at: getCurrentTimestamp(timezone),
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setNlpInput("");
    setPreview([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={resetAndClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              shadowColor: colors.textPrimary,
            },
          ]}
        >
          <View
            style={[styles.handle, { backgroundColor: colors.textMuted }]}
          />

          {/* Unified input row */}
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.card,
                borderColor: preview.length > 0 ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={'Try "coffee 120"'}
              placeholderTextColor={colors.textTertiary}
              value={nlpInput}
              onChangeText={handleNlpChange}
              autoCapitalize="none"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {totalAmount > 0 && (
              <Text style={[styles.inlineAmount, { color: colors.primary }]}>
                {CURRENCY}
                {totalAmount.toLocaleString()}
              </Text>
            )}
            <TouchableOpacity
              onPress={preview.length > 0 ? handleSubmit : undefined}
              style={[
                styles.submitArrow,
                {
                  backgroundColor:
                    preview.length > 0 ? colors.textPrimary : colors.surface,
                },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={
                  preview.length > 0 ? "#FFFFFF" : colors.textMuted
                }
              />
            </TouchableOpacity>
          </View>

          {/* Parsed preview */}
          {preview.length > 0 && (
            <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
              {preview.map((p, i) => (
                <View
                  key={i}
                  className="flex-row items-center justify-between py-1.5"
                >
                  <Text
                    style={[styles.previewLabel, { color: colors.textSecondary }]}
                  >
                    {p.label}
                    {p.category ? ` · ${p.category}` : ""}
                  </Text>
                  <Text
                    style={[styles.previewAmount, { color: colors.primary }]}
                  >
                    {CURRENCY}
                    {p.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick templates */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 16 }}
          >
            {TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                onPress={() => handleTemplatePress(template)}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.templateLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {template.label}
                </Text>
                <Text
                  style={[
                    styles.templateAmount,
                    { color: colors.textPrimary },
                  ]}
                >
                  {CURRENCY}
                  {template.amount}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    paddingVertical: 8,
  },
  inlineAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    marginRight: 8,
  },
  submitArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  previewAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  templateCard: {
    alignItems: "center",
    marginRight: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 76,
  },
  templateLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  templateAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
});
