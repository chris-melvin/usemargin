import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useTheme } from "@/lib/theme/theme-context";
import { CURRENCY } from "@repo/shared/constants";
import { SettingsSection } from "./settings-section";
import { ShortcutEditSheet } from "@/components/expenses/shortcut-edit-sheet";
import type { LocalShortcut } from "@/hooks/use-shortcuts";
import { selection } from "@/lib/haptics";

export function ShortcutsSettings() {
  const { shortcuts, addShortcut, updateShortcut, deleteShortcut } = useShortcuts();
  const { colors } = useTheme();
  const [editingShortcut, setEditingShortcut] = useState<LocalShortcut | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);

  const handleAdd = () => {
    selection();
    setEditingShortcut(null);
    setShowEditSheet(true);
  };

  const handleEdit = (shortcut: LocalShortcut) => {
    selection();
    setEditingShortcut(shortcut);
    setShowEditSheet(true);
  };

  const handleDelete = async (shortcut: LocalShortcut) => {
    await deleteShortcut(shortcut.id);
  };

  return (
    <>
      <SettingsSection title="QUICK ENTRIES">
        <Text style={[styles.description, { color: colors.textTertiary }]}>
          Quick entries appear as chips in Smart Input. Type the trigger word to auto-fill.
        </Text>

        {shortcuts.map((shortcut) => (
          <TouchableOpacity
            key={shortcut.id}
            onPress={() => handleEdit(shortcut)}
            style={[styles.row, { borderBottomColor: colors.divider }]}
          >
            <View className="flex-1">
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                {shortcut.label}
              </Text>
              <Text style={[styles.rowTrigger, { color: colors.textTertiary }]}>
                {shortcut.trigger_word}
                {shortcut.default_amount ? ` · ${CURRENCY}${shortcut.default_amount}` : ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(shortcut)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.addButton, { borderColor: colors.border }]}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={[styles.addText, { color: colors.primary }]}>Add Quick Entry</Text>
        </TouchableOpacity>
      </SettingsSection>

      <ShortcutEditSheet
        visible={showEditSheet}
        shortcut={editingShortcut}
        onSave={async (data) => {
          if (editingShortcut) {
            await updateShortcut(editingShortcut.id, data);
          } else {
            await addShortcut({
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
            await deleteShortcut(editingShortcut.id);
          }
          setShowEditSheet(false);
          setEditingShortcut(null);
        }}
        onClose={() => {
          setShowEditSheet(false);
          setEditingShortcut(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  rowTrigger: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
