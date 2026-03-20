import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CategorySegment {
  category: string;
  percentage: number;
  color: string;
}

interface CategoryDonutProps {
  segments: CategorySegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

function DonutSegment({
  percentage,
  offset,
  color,
  size,
  strokeWidth,
  delay,
}: {
  percentage: number;
  offset: number;
  color: string;
  size: number;
  strokeWidth: number;
  delay: number;
}) {
  const progress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(percentage / 100, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${circumference * progress.value} ${circumference * (1 - progress.value)}`,
  }));

  const rotation = (offset / 100) * 360 - 90;

  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="transparent"
      animatedProps={animatedProps}
      strokeLinecap="round"
      rotation={rotation}
      origin={`${size / 2}, ${size / 2}`}
    />
  );
}

export function CategoryDonut({
  segments,
  size = 140,
  strokeWidth = 12,
  centerLabel,
  centerValue,
}: CategoryDonutProps) {
  let cumulativeOffset = 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          stroke="rgba(0,0,0,0.04)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {segments.map((segment, i) => {
          const offset = cumulativeOffset;
          cumulativeOffset += segment.percentage;
          return (
            <DonutSegment
              key={segment.category}
              percentage={segment.percentage}
              offset={offset}
              color={segment.color}
              size={size}
              strokeWidth={strokeWidth}
              delay={i * 100}
            />
          );
        })}
      </Svg>
      {(centerLabel || centerValue) && (
        <View style={styles.center}>
          {centerValue && <Text style={styles.centerValue}>{centerValue}</Text>}
          {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerValue: {
    fontFamily: "Lora_700Bold",
    fontSize: 20,
    color: "#292524",
  },
  centerLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#A8A29E",
    marginTop: 2,
  },
});
