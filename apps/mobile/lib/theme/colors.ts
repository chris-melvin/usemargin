export const lightColors = {
  background: "#FDFBF7",
  card: "#FFFFFF",
  border: "rgba(231,229,228,0.6)",
  textPrimary: "#1C1917",
  textSecondary: "#57534E",
  textTertiary: "#A8A29E",
  textMuted: "#D6D3D1",
  primary: "#1A9E9E",
  primaryDark: "#0F6B6B",
  coral: "#E87356",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  surface: "#F5F5F4",
  divider: "#F5F5F4",
} as const;

export const darkColors = {
  background: "#0D0D0C",
  card: "#1A1A18",
  border: "rgba(255,255,255,0.08)",
  textPrimary: "#F5F5F3",
  textSecondary: "#A3A39E",
  textTertiary: "#6B6B66",
  textMuted: "#3D3D39",
  primary: "#1A9E9E",
  primaryDark: "#0F6B6B",
  coral: "#E87356",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  surface: "#242422",
  divider: "rgba(255,255,255,0.06)",
} as const;

export type ThemeColors = {
  background: string;
  card: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  coral: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  surface: string;
  divider: string;
};
