import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/theme-context";
import { validateTriggerWord } from "@/hooks/use-shortcuts";
import type { LocalShortcut } from "@/hooks/use-shortcuts";
import { tapLight } from "@/lib/haptics";

interface ShortcutEditSheetProps {
  visible: boolean;
  shortcut: LocalShortcut | null; // null = create mode
  onSave: (data: {
    trigger_word?: string;
    label?: string;
    category?: string | null;
    default_amount?: number | null;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export function ShortcutEditSheet({
  visible,
  shortcut,
  onSave,
  onDelete,
  onClose,
}: ShortcutEditSheetProps) {
  const { colors } = useTheme();
  const isEditing = shortcut != null;

  const [trigger, setTrigger] = useState("");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTrigger(shortcut?.trigger_word ?? "");
      setLabel(shortcut?.label ?? "");
      setAmount(shortcut?.default_amount != null ? String(shortcut.default_amount) : "");
      setError(null);
    }
  }, [visible, shortcut]);

  const handleSave = async () => {
    const triggerError = validateTriggerWord(trigger);
    if (triggerError) {
      setError(triggerError);
      return;
    }
    if (!label.trim()) {
      setError("Label is required");
      return;
    }

    const parsedAmount = parseFloat(amount);
    await onSave({
      trigger_word: trigger.toLowerCase().trim(),
      label: label.trim(),
      default_amount: !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
    });
  };

  const handleDelete = async () => {
    tapLight();
    await onDelete();
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
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: colors.background, shadowColor: colors.textPrimary }]}>
          <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isEditing ? "Edit Quick Entry" : "New Quick Entry"}
          </Text>

          {/* Trigger word */}
          <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Trigger Word</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.textPrimary, backgroundColor: colors.surface }]}
            value={trigger}
            onChangeText={(t) => { setTrigger(t); setError(null); }}
            placeholder="e.g. starbucks"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoFocus={!isEditing}
          />

          {/* Label */}
          <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Label</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.textPrimary, backgroundColor: colors.surface }]}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Starbucks Coffee"
            placeholderTextColor={colors.textMuted}
          />

          {/* Amount */}
          <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Default Amount (optional)</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.textPrimary, backgroundColor: colors.surface }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 200"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />

          {/* Error */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {isEditing && (
              <TouchableOpacity onPress={handleDelete} style={[styles.deleteButton, { borderColor: colors.border }]}>
                <Ionicons name="trash-outline" size={18} color="#E11D48" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, { flex: isEditing ? 1 : undefined }]}
            >
              <Text style={styles.saveText}>{isEditing ? "Save" : "Add"}</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#E11D48",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#E11D48",
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1A9E9E",
  },
  saveText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
