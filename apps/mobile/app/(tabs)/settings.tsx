import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme/theme-context";
import { GeneralSettings } from "@/components/settings/general-settings";
import { BudgetSettings } from "@/components/settings/budget-settings";
import { AccountSettings } from "@/components/settings/account-settings";
import { DataSettings } from "@/components/settings/data-settings";
import { selection } from "@/lib/haptics";

type SettingsTab = "general" | "budget" | "account" | "data";

const TABS: { key: SettingsTab; label: string }[] = [
  { key: "general", label: "General" },
  { key: "budget", label: "Budget" },
  { key: "account", label: "Account" },
  { key: "data", label: "Data" },
];

function SegmentedControl({
  activeTab,
  onTabChange,
}: {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[segStyles.container, { backgroundColor: colors.surface }]}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => {
            selection();
            onTabChange(tab.key);
          }}
          style={[segStyles.tab, activeTab === tab.key && [segStyles.tabActive, { backgroundColor: colors.card, shadowColor: colors.textPrimary }]]}
        >
          <Text style={[segStyles.tabText, { color: colors.textTertiary }, activeTab === tab.key && { color: colors.textPrimary }]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="px-5 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Settings</Text>

        <SegmentedControl activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "budget" && <BudgetSettings />}
        {activeTab === "account" && <AccountSettings />}
        {activeTab === "data" && <DataSettings />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontFamily: "Lora_700Bold",
    fontSize: 28,
    color: "#1C1917",
    marginBottom: 20,
  },
});
