import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { selection } from "@/lib/haptics";

interface SelectOption<T> {
  label: string;
  value: T;
  description?: string;
}

interface SelectSheetProps<T> {
  visible: boolean;
  title: string;
  options: SelectOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function SelectSheet<T extends string | number>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: SelectSheetProps<T>) {
  const handleSelect = (optionValue: T) => {
    selection();
    onSelect(optionValue);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
      <View style={styles.container}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>

        <ScrollView style={styles.list} bounces={false}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <TouchableOpacity
                key={String(option.value)}
                onPress={() => handleSelect(option.value)}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                <View className="flex-1">
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color="#1A9E9E" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity onPress={onClose} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FDFBF7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: "70%",
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
  list: {
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: "rgba(26,158,158,0.08)",
  },
  optionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#292524",
  },
  optionLabelSelected: {
    color: "#1A9E9E",
  },
  optionDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#A8A29E",
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: "#F5F5F4",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#57534E",
  },
});
