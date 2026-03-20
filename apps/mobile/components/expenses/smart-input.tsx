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
import { TEMPLATES, CURRENCY } from "@repo/shared/constants";
import { getCurrentTimestamp } from "@repo/shared/date";
import {
  parseExpenseInput,
  type ParsedExpense,
  type ShortcutEntry,
} from "@/lib/parser/expense-parser";
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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  const handleNlpChange = useCallback((text: string) => {
    setNlpInput(text);
    if (!text.trim()) {
      setPreview([]);
      return;
    }
    const result = parseExpenseInput(text, shortcutMap);
    setPreview(result || []);
  }, []);

  const handleNlpSubmit = () => {
    if (preview.length === 0) return;
    notifySuccess();

    const now = getCurrentTimestamp(timezone);
    for (const expense of preview) {
      let occurredAt = now;

      // Apply parsed time if present
      if (expense.parsedTime) {
        const d = expense.parsedTime.date ? new Date(expense.parsedTime.date) : new Date();
        if (expense.parsedTime.hours !== undefined) {
          d.setHours(expense.parsedTime.hours, expense.parsedTime.minutes ?? 0, 0, 0);
        }
        occurredAt = d.toISOString();
      }

      onSubmit({
        amount: expense.amount,
        label: expense.label,
        category: selectedCategory || expense.category,
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
      category: selectedCategory || undefined,
      occurred_at: getCurrentTimestamp(timezone),
    });
    resetAndClose();
  };

  const handleManualSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || !label.trim()) return;
    notifySuccess();

    onSubmit({
      amount: parsedAmount,
      label: label.trim(),
      category: selectedCategory || undefined,
      occurred_at: getCurrentTimestamp(timezone),
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setNlpInput("");
    setPreview([]);
    setSelectedCategory("");
    setAmount("");
    setLabel("");
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
        <View style={inputStyles.sheet}>
          <View style={inputStyles.handle} />

          <Text style={inputStyles.title}>Add Expense</Text>

          {/* NLP Input */}
          <View className="mb-3">
            <TextInput
              style={inputStyles.nlpInput}
              placeholder='Try "coffee 120" or "lunch at 2pm"'
              placeholderTextColor="#A8A29E"
              value={nlpInput}
              onChangeText={handleNlpChange}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleNlpSubmit}
            />
            {/* Preview */}
            {preview.length > 0 && (
              <View className="mt-2 px-2">
                {preview.map((p, i) => (
                  <View
                    key={i}
                    className="flex-row items-center justify-between py-1"
                  >
                    <Text style={inputStyles.previewLabel}>
                      {p.label}
                      {p.category ? ` \u00B7 ${p.category}` : ""}
                    </Text>
                    <Text style={inputStyles.previewAmount}>
                      {CURRENCY}
                      {p.amount}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={handleNlpSubmit}
                  style={inputStyles.submitButton}
                >
                  <Text style={inputStyles.submitButtonText}>
                    Add {preview.length > 1 ? `${preview.length} expenses` : "expense"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Category chips */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() =>
                    setSelectedCategory((prev) =>
                      prev === cat ? "" : cat
                    )
                  }
                  style={[
                    inputStyles.categoryChip,
                    selectedCategory === cat && inputStyles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      inputStyles.categoryChipText,
                      selectedCategory === cat && inputStyles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Quick templates */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            {TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                onPress={() => handleTemplatePress(template)}
                style={inputStyles.templateCard}
              >
                <Text style={inputStyles.templateLabel}>{template.label}</Text>
                <Text style={inputStyles.templateAmount}>
                  {CURRENCY}
                  {template.amount}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Manual entry */}
          <View className="flex-row gap-3 mb-4">
            <TextInput
              style={[inputStyles.manualInput, { flex: 1 }]}
              placeholder="Label"
              placeholderTextColor="#A8A29E"
              value={label}
              onChangeText={setLabel}
              autoCapitalize="sentences"
            />
            <TextInput
              style={[inputStyles.manualInput, { width: 112 }]}
              placeholder="Amount"
              placeholderTextColor="#A8A29E"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            onPress={handleManualSubmit}
            style={inputStyles.submitButton}
          >
            <Text style={inputStyles.submitButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const inputStyles = StyleSheet.create({
  sheet: {
    backgroundColor: "#FDFBF7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D6D3D1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#1C1917",
    marginBottom: 16,
  },
  nlpInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#292524",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E7E5E4",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  previewLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#57534E",
  },
  previewAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#1A9E9E",
    fontVariant: ["tabular-nums"],
  },
  submitButton: {
    backgroundColor: "#292524",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  categoryChip: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    backgroundColor: "#FFFFFF",
  },
  categoryChipActive: {
    backgroundColor: "#1A9E9E",
    borderColor: "#1A9E9E",
  },
  categoryChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#78716C",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  templateCard: {
    alignItems: "center",
    marginRight: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(231,229,228,0.6)",
    minWidth: 76,
  },
  templateLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#78716C",
  },
  templateAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#292524",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  manualInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#292524",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
