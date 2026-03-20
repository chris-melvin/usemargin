import Animated, {
  useAnimatedStyle,
  interpolate,
  type SharedValue,
} from "react-native-reanimated";

interface CardDepthLayerProps {
  rotateX: SharedValue<number>;
  rotateY: SharedValue<number>;
  zOffset?: number;
  children: React.ReactNode;
}

export function CardDepthLayer({
  rotateX,
  rotateY,
  zOffset = 0,
  children,
}: CardDepthLayerProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const factor = zOffset * 0.5;
    const translateX = interpolate(rotateY.value, [-12, 12], [-factor, factor]);
    const translateY = interpolate(rotateX.value, [-12, 12], [factor, -factor]);

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
