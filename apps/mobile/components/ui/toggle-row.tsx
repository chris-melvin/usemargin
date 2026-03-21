import { View, Text, Switch, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme/theme-context";

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

export function ToggleRow({ label, description, value, onToggle }: ToggleRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View className="flex-1 mr-3">
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        {description && <Text style={[styles.description, { color: colors.textTertiary }]}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surface, true: "rgba(26,158,158,0.4)" }}
        thumbColor={value ? colors.primary : colors.card}
        ios_backgroundColor={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
});
