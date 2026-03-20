import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  interpolate,
  type SharedValue,
} from "react-native-reanimated";
import type { CardMaterial } from "@repo/shared/card-theme";

let BlurView: any = null;
try {
  BlurView = require("expo-blur").BlurView;
} catch {
  // expo-blur not available
}

interface CardMaterialOverlayProps {
  material: CardMaterial;
  glareX?: SharedValue<number>;
  glareY?: SharedValue<number>;
}

function GlassOverlay() {
  if (BlurView && Platform.OS === "ios") {
    return (
      <BlurView
        intensity={40}
        tint="light"
        style={[
          StyleSheet.absoluteFill,
          {
            borderWidth: 0.5,
            borderColor: "rgba(255,255,255,0.3)",
            borderRadius: 24,
            overflow: "hidden",
          },
        ]}
      />
    );
  }

  // Android fallback
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: "rgba(255,255,255,0.15)",
          borderWidth: 0.5,
          borderColor: "rgba(255,255,255,0.2)",
          borderRadius: 24,
        },
      ]}
    />
  );
}

function MetallicOverlay({ glareX, glareY }: { glareX?: SharedValue<number>; glareY?: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    if (!glareX || !glareY) return {};
    const angle = interpolate(glareX.value, [0, 1], [0, 180]);
    return {
      opacity: interpolate(glareY.value, [0, 0.5, 1], [0.06, 0.12, 0.06]),
      transform: [{ rotate: `${angle}deg` }],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0)", "rgba(200,200,200,0.15)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 24, overflow: "hidden" }]}
      />
    </Animated.View>
  );
}

function HoloOverlay({ glareX }: { glareX?: SharedValue<number> }) {
  const animatedStyle1 = useAnimatedStyle(() => {
    if (!glareX) return {};
    return {
      opacity: interpolate(glareX.value, [0, 0.5, 1], [0.08, 0.14, 0.08]),
    };
  });

  const animatedStyle2 = useAnimatedStyle(() => {
    if (!glareX) return {};
    return {
      opacity: interpolate(glareX.value, [0, 0.5, 1], [0.06, 0.1, 0.06]),
    };
  });

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle1]}>
        <LinearGradient
          colors={["#ff000020", "#ff880020", "#ffff0020", "#00ff0020", "#0088ff20", "#8800ff20"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 24, overflow: "hidden" }]}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle2]}>
        <LinearGradient
          colors={["#8800ff18", "#0088ff18", "#00ff0018", "#ffff0018", "#ff880018", "#ff000018"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 24, overflow: "hidden" }]}
        />
      </Animated.View>
    </>
  );
}

export function CardMaterialOverlay({ material, glareX, glareY }: CardMaterialOverlayProps) {
  if (material === "default") return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {material === "glass" && <GlassOverlay />}
      {material === "metallic" && <MetallicOverlay glareX={glareX} glareY={glareY} />}
      {material === "holo" && <HoloOverlay glareX={glareX} />}
    </View>
  );
}
