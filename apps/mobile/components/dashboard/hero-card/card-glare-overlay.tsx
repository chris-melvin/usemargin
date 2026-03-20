import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

interface CardGlareOverlayProps {
  enabled?: boolean;
}

export function CardGlareOverlay({ enabled = true }: CardGlareOverlayProps) {
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!enabled) return;
    drift.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [enabled]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) return { opacity: 0 };

    const translateX = interpolate(drift.value, [0, 1], [-60, 60]);
    const translateY = interpolate(drift.value, [0, 1], [-30, 30]);

    return {
      transform: [{ translateX }, { translateY }],
      opacity: interpolate(drift.value, [0, 0.5, 1], [0.04, 0.08, 0.04]),
    };
  });

  if (!enabled) return null;

  return (
    <Animated.View
      style={[styles.glare, animatedStyle]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  glare: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
    borderRadius: 100,
    width: 200,
    height: 200,
    alignSelf: "center",
    top: -40,
  },
});
