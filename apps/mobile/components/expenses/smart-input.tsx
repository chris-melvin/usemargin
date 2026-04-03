import { useState, useCallback, useEffect } from "react";
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
import { CURRENCY } from "@repo/shared/constants";
import { getCurrentTimestamp } from "@repo/shared/date";
import {
  parseExpenseInput,
  type ParsedExpense,
  type ShortcutEntry,
} from "@/lib/parser/expense-parser";
import type { LocalShortcut } from "@/hooks/use-shortcuts";
import { useTheme } from "@/lib/theme/theme-context";
import { tapLight, notifySuccess } from "@/lib/haptics";
import { storage } from "@/lib/storage/mmkv";
import { ShortcutEditSheet } from "./shortcut-edit-sheet";

const HELP_SEEN_KEY = "has_seen_smart_input_help";

interface SmartInputProps {
  visible: boolean;
  timezone: string;
  categories: string[];
  shortcuts: LocalShortcut[];
  shortcutMap?: Map<string, ShortcutEntry>;
  onAddShortcut: (input: {
    trigger_word: string;
    label: string;
    category?: string;
    default_amount?: number;
  }) => Promise<void>;
  onUpdateShortcut: (id: string, input: {
    trigger_word?: string;
    label?: string;
    category?: string | null;
    default_amount?: number | null;
  }) => Promise<void>;
  onDeleteShortcut: (id: string) => Promise<void>;
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
  shortcuts,
  shortcutMap,
  onAddShortcut,
  onUpdateShortcut,
  onDeleteShortcut,
  onClose,
  onSubmit,
}: SmartInputProps) {
  const [nlpInput, setNlpInput] = useState("");
  const [preview, setPreview] = useState<ParsedExpense[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<LocalShortcut | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const { colors } = useTheme();

  const totalAmount = preview.reduce((sum, p) => sum + p.amount, 0);

  // First-time tooltip
  useEffect(() => {
    if (visible && storage.getString(HELP_SEEN_KEY) !== "1") {
      setShowTooltip(true);
    }
  }, [visible]);

  const dismissTooltip = () => {
    setShowTooltip(false);
    storage.set(HELP_SEEN_KEY, "1");
  };

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

  const handleChipPress = (shortcut: LocalShortcut) => {
    tapLight();
    if (shortcut.default_amount) {
      onSubmit({
        amount: shortcut.default_amount,
        label: shortcut.label,
        occurred_at: getCurrentTimestamp(timezone),
      });
      resetAndClose();
    }
  };

  const handleChipLongPress = (shortcut: LocalShortcut) => {
    tapLight();
    setEditingShortcut(shortcut);
    setShowEditSheet(true);
  };

  const handleAddChipPress = () => {
    tapLight();
    setEditingShortcut(null);
    setShowEditSheet(true);
  };

  const resetAndClose = () => {
    setNlpInput("");
    setPreview([]);
    setShowHelp(false);
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

          {/* Tooltip */}
          {showTooltip && (
            <TouchableOpacity
              onPress={dismissTooltip}
              style={[styles.tooltip, { backgroundColor: colors.textPrimary }]}
            >
              <Text style={styles.tooltipText}>
                Tap (i) to learn shortcuts and syntax
              </Text>
            </TouchableOpacity>
          )}

          {/* Input row */}
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
            {/* Help icon */}
            <TouchableOpacity
              onPress={() => { dismissTooltip(); setShowHelp((v) => !v); }}
              style={{ paddingHorizontal: 6 }}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={showHelp ? colors.primary : colors.textTertiary}
              />
            </TouchableOpacity>
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

          {/* Help cheatsheet */}
          {showHelp && (
            <View style={[styles.helpSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <HelpRow icon="create-outline" text={`"coffee 120" or "120 coffee"`} colors={colors} />
              <HelpRow icon="git-branch-outline" text={`"coffee 100 and lunch 150" for multiple`} colors={colors} />
              <HelpRow icon="flash-outline" text={`"@starbucks 150" or just "starbucks"`} colors={colors} />
              <HelpRow icon="pricetag-outline" text={`"coffee 120 #food" to tag a category`} colors={colors} />
              <HelpRow icon="time-outline" text={`"at 2pm", "yesterday", "last friday"`} colors={colors} />
            </View>
          )}

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

          {/* Quick entries from DB */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 16 }}
          >
            {shortcuts.map((shortcut) => (
              <TouchableOpacity
                key={shortcut.id}
                onPress={() => handleChipPress(shortcut)}
                onLongPress={() => handleChipLongPress(shortcut)}
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
                  {shortcut.label}
                </Text>
                {shortcut.default_amount != null && (
                  <Text
                    style={[
                      styles.templateAmount,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {CURRENCY}
                    {shortcut.default_amount}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
            {/* Add chip */}
            <TouchableOpacity
              onPress={handleAddChipPress}
              style={[
                styles.templateCard,
                styles.addChip,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="add" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Shortcut edit sheet */}
      <ShortcutEditSheet
        visible={showEditSheet}
        shortcut={editingShortcut}
        onSave={async (data) => {
          if (editingShortcut) {
            await onUpdateShortcut(editingShortcut.id, data);
          } else {
            await onAddShortcut({
              trigger_word: data.trigger_word ?? "",
              label: data.label ?? "",
              category: data.category ?? undefined,
              default_amount: data.default_amount ?? undefined,
            });
          }
          setShowEditSheet(false);
          setEditingShortcut(null);
        }}
        onDelete={async () => {
          if (editingShortcut) {
            await onDeleteShortcut(editingShortcut.id);
          }
          setShowEditSheet(false);
          setEditingShortcut(null);
        }}
        onClose={() => {
          setShowEditSheet(false);
          setEditingShortcut(null);
        }}
      />
    </Modal>
  );
}

function HelpRow({ icon, text, colors }: { icon: string; text: string; colors: Record<string, string> }) {
  return (
    <View className="flex-row items-center mb-2">
      <Ionicons name={icon as any} size={14} color={colors.textTertiary} style={{ marginRight: 8, width: 16 }} />
      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary }}>{text}</Text>
    </View>
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
  tooltip: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    alignSelf: "center",
  },
  tooltipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#FFFFFF",
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
  helpSection: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
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
  addChip: {
    justifyContent: "center",
    minWidth: 50,
    paddingHorizontal: 12,
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
