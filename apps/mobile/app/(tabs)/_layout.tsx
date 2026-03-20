import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent, Animated } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TAB_CONFIG = [
  { name: "index", title: "Today", iconFocused: "today" as const, iconDefault: "today-outline" as const },
  { name: "calendar", title: "Calendar", iconFocused: "calendar" as const, iconDefault: "calendar-outline" as const },
  { name: "insights", title: "Insights", iconFocused: "stats-chart" as const, iconDefault: "stats-chart-outline" as const },
  { name: "settings", title: "Settings", iconFocused: "settings" as const, iconDefault: "settings-outline" as const },
];

function AnimatedTabBar({ state, navigation }: any) {
  const pillX = useRef(new Animated.Value(0)).current;
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);

  const handleTabLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => {
      const next = [...prev];
      next[index] = { x, width };
      return next;
    });
  };

  useEffect(() => {
    const layout = tabLayouts[state.index];
    if (layout) {
      const targetX = layout.x + (layout.width - 48) / 2;
      Animated.spring(pillX, {
        toValue: targetX,
        damping: 18,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [state.index, tabLayouts]);

  return (
    <View style={tabStyles.container}>
      {/* Sliding pill indicator */}
      <Animated.View style={[tabStyles.pill, { transform: [{ translateX: pillX }] }]} />

      {state.routes.map((route: any, index: number) => {
        const config = TAB_CONFIG.find((t) => t.name === route.name);
        if (!config) return null;

        const isFocused = state.index === index;
        const color = isFocused ? "#1A9E9E" : "#A8A29E";

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => {
              if (!isFocused) {
                navigation.navigate(route.name);
              }
            }}
            onLayout={(e) => handleTabLayout(index, e)}
            style={tabStyles.tab}
          >
            <Ionicons
              name={isFocused ? config.iconFocused : config.iconDefault}
              size={22}
              color={color}
            />
            <Text style={[tabStyles.label, { color }]}>{config.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(253, 251, 247, 0.95)",
    paddingBottom: 28,
    paddingTop: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  pill: {
    position: "absolute",
    top: 4,
    width: 48,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#1A9E9E",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    marginTop: 2,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}
