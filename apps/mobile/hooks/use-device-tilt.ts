import { useEffect, useRef } from "react";
import { AccessibilityInfo } from "react-native";
import { DeviceMotion } from "expo-sensors";
import {
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

interface DeviceTiltResult {
  rotateX: SharedValue<number>;
  rotateY: SharedValue<number>;
  glareX: SharedValue<number>;
  glareY: SharedValue<number>;
}

const SPRING_CONFIG = { damping: 20, stiffness: 90 };
const MAX_DEGREES = 12;

export function useDeviceTilt(enabled: boolean = true): DeviceTiltResult {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const glareX = useSharedValue(0.5);
  const glareY = useSharedValue(0.5);
  const reducedMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((val) => {
      reducedMotion.current = val;
    });
  }, []);

  useEffect(() => {
    if (!enabled || reducedMotion.current) {
      rotateX.value = withSpring(0, SPRING_CONFIG);
      rotateY.value = withSpring(0, SPRING_CONFIG);
      glareX.value = withSpring(0.5, SPRING_CONFIG);
      glareY.value = withSpring(0.5, SPRING_CONFIG);
      return;
    }

    DeviceMotion.setUpdateInterval(16); // ~60fps

    const subscription = DeviceMotion.addListener(({ rotation }) => {
      if (!rotation) return;

      // beta = front/back tilt, gamma = left/right tilt
      const { beta, gamma } = rotation;

      // Convert radians to degrees and clamp
      const rawX = Math.max(-MAX_DEGREES, Math.min(MAX_DEGREES, (beta * 180) / Math.PI));
      const rawY = Math.max(-MAX_DEGREES, Math.min(MAX_DEGREES, (gamma * 180) / Math.PI));

      rotateX.value = withSpring(rawX, SPRING_CONFIG);
      rotateY.value = withSpring(rawY, SPRING_CONFIG);

      // Normalize to 0-1 for glare positioning
      glareX.value = withSpring((rawY + MAX_DEGREES) / (MAX_DEGREES * 2), SPRING_CONFIG);
      glareY.value = withSpring((rawX + MAX_DEGREES) / (MAX_DEGREES * 2), SPRING_CONFIG);
    });

    return () => {
      subscription.remove();
    };
  }, [enabled]);

  return { rotateX, rotateY, glareX, glareY };
}
