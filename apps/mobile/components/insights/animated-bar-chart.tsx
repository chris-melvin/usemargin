import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface BarData {
  date: string;
  amount: number;
  isToday: boolean;
}

interface AnimatedBarChartProps {
  data: BarData[];
  height?: number;
  color?: string;
  activeColor?: string;
}

function AnimatedBar({
  height,
  maxHeight,
  delay,
  isToday,
  color,
  activeColor,
}: {
  height: number;
  maxHeight: number;
  delay: number;
  isToday: boolean;
  color: string;
  activeColor: string;
}) {
  const barHeight = useSharedValue(0);
  const targetHeight = Math.max((height / maxHeight) * 80, 2);

  useEffect(() => {
    barHeight.value = withDelay(
      delay,
      withTiming(targetHeight, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, [height, maxHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  return (
    <View className="items-center flex-1 mx-0.5">
      <Animated.View
        style={[
          styles.bar,
          animatedStyle,
          { backgroundColor: isToday ? activeColor : color },
        ]}
      />
    </View>
  );
}

export function AnimatedBarChart({
  data,
  height = 96,
  color = "rgba(26,158,158,0.25)",
  activeColor = "#1A9E9E",
}: AnimatedBarChartProps) {
  const maxAmt = Math.max(...data.map((d) => d.amount), 1);

  return (
    <View className="flex-row items-end justify-between" style={{ height }}>
      {data.map((item, index) => (
        <AnimatedBar
          key={item.date}
          height={item.amount}
          maxHeight={maxAmt}
          delay={index * 50}
          isToday={item.isToday}
          color={color}
          activeColor={activeColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: "100%",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
