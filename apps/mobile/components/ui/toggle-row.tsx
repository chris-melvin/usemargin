import { View, Text, Switch, StyleSheet } from "react-native";

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

export function ToggleRow({ label, description, value, onToggle }: ToggleRowProps) {
  return (
    <View style={styles.container}>
      <View className="flex-1 mr-3">
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#E7E5E4", true: "rgba(26,158,158,0.4)" }}
        thumbColor={value ? "#1A9E9E" : "#FAFAF9"}
        ios_backgroundColor="#E7E5E4"
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
    color: "#57534E",
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#A8A29E",
    marginTop: 2,
  },
});
