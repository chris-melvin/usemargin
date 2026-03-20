import { useEffect } from "react";
import { TextInput, StyleSheet, type TextStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  style?: TextStyle;
  duration?: number;
}

export function AnimatedNumber({
  value,
  prefix = "",
  style,
  duration = 600,
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration]);

  const animatedProps = useAnimatedProps(() => {
    const num = Math.round(animatedValue.value);
    return {
      text: `${prefix}${num.toLocaleString()}`,
      defaultValue: `${prefix}${num.toLocaleString()}`,
    };
  });

  return (
    <AnimatedTextInput
      editable={false}
      animatedProps={animatedProps}
      style={[styles.text, style]}
      underlineColorAndroid="transparent"
    />
  );
}

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
  },
});
