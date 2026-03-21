import { View, Text, StyleSheet } from "react-native";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "default" | "white";
}

const sizeMap = {
  sm: { iconSize: 32, lineH: 2.5, text: 18, gap: 8 },
  md: { iconSize: 38, lineH: 3, text: 22, gap: 10 },
  lg: { iconSize: 48, lineH: 4, text: 36, gap: 12 },
};

const variantMap = {
  default: { lines: "#0D9488", accent: "#292524", text: "#1C1917" },
  white: { lines: "rgba(255,255,255,0.8)", accent: "#FFFFFF", text: "#FFFFFF" },
};

function LedgerLinesIcon({ size, variant }: { size: keyof typeof sizeMap; variant: keyof typeof variantMap }) {
  const s = sizeMap[size];
  const v = variantMap[variant];
  const pad = s.iconSize * 0.15;
  const innerW = s.iconSize - pad * 2;

  return (
    <View style={{ width: s.iconSize, height: s.iconSize, padding: pad, justifyContent: "center", gap: 2.5 }}>
      <View style={{ height: s.lineH, width: innerW, backgroundColor: v.lines, borderRadius: 99 }} />
      <View style={{ height: s.lineH, width: innerW * 0.7, backgroundColor: v.lines, borderRadius: 99 }} />
      <View style={{ height: s.lineH, width: innerW * 0.85, backgroundColor: v.lines, borderRadius: 99 }} />
      <View style={{ height: s.lineH, width: innerW * 0.5, backgroundColor: v.accent, borderRadius: 99 }} />
    </View>
  );
}

export function LedgrLogo({ size = "md", showText = true, variant = "default" }: LogoProps) {
  const s = sizeMap[size];
  const v = variantMap[variant];

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: s.gap }}>
      <LedgerLinesIcon size={size} variant={variant} />
      {showText && (
        <Text style={{ fontFamily: "Lora_700Bold", fontSize: s.text, color: v.text, letterSpacing: -0.5 }}>
          ledgr
        </Text>
      )}
    </View>
  );
}

export function LedgrLogoIcon({ size = "md", variant = "default" }: Omit<LogoProps, "showText">) {
  return <LedgrLogo size={size} variant={variant} showText={false} />;
}
