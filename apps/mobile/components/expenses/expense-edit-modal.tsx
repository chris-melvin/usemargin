import { useState, useEffect } from "react";
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
import { formatDate } from "@repo/shared/date";
import { tapLight, tapHeavy, notifySuccess } from "@/lib/haptics";
import type { LocalExpense, UpdateExpenseInput } from "@/lib/db/expense-dao";

interface ExpenseEditModalProps {
  expense: LocalExpense | null;
  visible: boolean;
  timezone: string;
  existingCategories: string[];
  onClose: () => void;
  onSave: (id: string, updates: UpdateExpenseInput) => Promise<void>;
  onDelete: (id: string) => void;
}

export function ExpenseEditModal({
  expense,
  visible,
  timezone,
  existingCategories,
  onClose,
  onSave,
  onDelete,
}: ExpenseEditModalProps) {
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setLabel(expense.label);
      setCategory(expense.category || "");
    }
  }, [expense]);

  const handleSave = () => {
    if (!expense) return;

    const updates: UpdateExpenseInput = {};
    const newAmount = parseFloat(amount);
    if (!isNaN(newAmount) && newAmount > 0 && newAmount !== expense.amount) {
      updates.amount = newAmount;
    }
    if (label.trim() && label.trim() !== expense.label) {
      updates.label = label.trim();
    }
    if (category !== (expense.category || "")) {
      updates.category = category || undefined;
    }

    onClose();
    if (Object.keys(updates).length > 0) {
      notifySuccess();
      onSave(expense.id, updates);
    }
  };

  const handleDelete = () => {
    if (!expense) return;
    tapHeavy();
    onDelete(expense.id);
    onClose();
  };

  if (!expense) return null;

  const timeLabel = formatDate(expense.occurred_at, timezone, "h:mm a");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={editStyles.sheet}>
          <View style={editStyles.handle} />

          <View className="flex-row items-center justify-between mb-5">
            <Text style={editStyles.title}>Edit Expense</Text>
            <Text style={editStyles.time}>{timeLabel}</Text>
          </View>

          {/* Amount & Label */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text style={editStyles.fieldLabel}>Label</Text>
              <TextInput
                style={editStyles.input}
                value={label}
                onChangeText={setLabel}
                autoCapitalize="sentences"
              />
            </View>
            <View className="w-28">
              <Text style={editStyles.fieldLabel}>Amount</Text>
              <TextInput
                style={editStyles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Category chips */}
          <View className="mb-5">
            <Text style={editStyles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <TouchableOpacity
                onPress={() => { tapLight(); setCategory(""); }}
                style={[
                  editStyles.chip,
                  category === "" && editStyles.chipActive,
                ]}
              >
                <Text style={[editStyles.chipText, category === "" && editStyles.chipTextActive]}>
                  None
                </Text>
              </TouchableOpacity>
              {existingCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => { tapLight(); setCategory(cat); }}
                  style={[
                    editStyles.chip,
                    category === cat && editStyles.chipActive,
                  ]}
                >
                  <Text style={[editStyles.chipText, category === cat && editStyles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={handleDelete} style={editStyles.deleteButton}>
              <Text style={editStyles.deleteText}>Delete</Text>
            </TouchableOpacity>
            <View className="flex-1" />
            <TouchableOpacity onPress={onClose} style={editStyles.cancelButton}>
              <Text style={editStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!amount || !label.trim()}
              style={[
                editStyles.saveButton,
                (!amount || !label.trim()) && { backgroundColor: "#E7E5E4" },
              ]}
            >
              <Text
                style={[
                  editStyles.saveText,
                  (!amount || !label.trim()) && { color: "#A8A29E" },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const editStyles = StyleSheet.create({
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
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#A8A29E",
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#A8A29E",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#292524",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  chip: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    backgroundColor: "#1A9E9E",
    borderColor: "#1A9E9E",
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#78716C",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FFF1F2",
  },
  deleteText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#E11D48",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  cancelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#A8A29E",
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#1A9E9E",
  },
  saveText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
