export type CardTheme =
  | "auto" | "emerald" | "ocean" | "sunset" | "lavender" | "slate" | "rose"
  | "midnight" | "aurora" | "ember" | "neon" | "obsidian";
export type BackgroundStyle = "mesh" | "grain" | "static" | "neuro" | "metaballs" | "godrays" | "swirl" | "waves";
export type GlareStyle = "standard" | "holographic" | "prismatic";
export type CardMaterial = "default" | "glass" | "metallic" | "holo";

export interface CardPreferences {
  theme?: CardTheme;
  backgroundStyle?: BackgroundStyle;
  displayName?: string;
  enableTilt?: boolean;
  enableGlare?: boolean;
  glareStyle?: GlareStyle;
  material?: CardMaterial;
}

export const CARD_PREFERENCE_DEFAULTS: Required<CardPreferences> = {
  theme: "auto",
  backgroundStyle: "mesh",
  displayName: "",
  enableTilt: true,
  enableGlare: true,
  glareStyle: "standard",
  material: "default",
};

type BudgetStatus = "safe" | "close" | "low" | "over";

interface ThemePreset {
  label: string;
  colors: string[];
  cssGradient: string;
  swatch: string;
  textMode?: "dark"; // dark backgrounds need light text
}

const FREE_THEME_PRESETS: Record<string, ThemePreset> = {
  emerald: {
    label: "Emerald",
    colors: ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399"],
    cssGradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
    swatch: "#34d399",
  },
  ocean: {
    label: "Ocean",
    colors: ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa"],
    cssGradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)",
    swatch: "#60a5fa",
  },
  sunset: {
    label: "Sunset",
    colors: ["#fef3c7", "#fde68a", "#fcd34d", "#f59e0b"],
    cssGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)",
    swatch: "#f59e0b",
  },
  lavender: {
    label: "Lavender",
    colors: ["#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa"],
    cssGradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)",
    swatch: "#a78bfa",
  },
  slate: {
    label: "Slate",
    colors: ["#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8"],
    cssGradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
    swatch: "#94a3b8",
  },
  rose: {
    label: "Rose",
    colors: ["#ffe4e6", "#fecdd3", "#fda4af", "#fb7185"],
    cssGradient: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)",
    swatch: "#fb7185",
  },
};

const PRO_THEME_PRESETS: Record<string, ThemePreset> = {
  midnight: {
    label: "Midnight",
    colors: ["#1e1b4b", "#312e81", "#4338ca", "#6366f1"],
    cssGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
    swatch: "#6366f1",
    textMode: "dark",
  },
  aurora: {
    label: "Aurora",
    colors: ["#042f2e", "#065f46", "#059669", "#34d399"],
    cssGradient: "linear-gradient(135deg, #042f2e 0%, #065f46 50%, #059669 100%)",
    swatch: "#34d399",
    textMode: "dark",
  },
  ember: {
    label: "Ember",
    colors: ["#451a03", "#7c2d12", "#c2410c", "#f59e0b"],
    cssGradient: "linear-gradient(135deg, #451a03 0%, #7c2d12 50%, #c2410c 100%)",
    swatch: "#f59e0b",
    textMode: "dark",
  },
  neon: {
    label: "Neon",
    colors: ["#0c0a1a", "#1e1b4b", "#06b6d4", "#e879f9"],
    cssGradient: "linear-gradient(135deg, #0c0a1a 0%, #1e1b4b 50%, #06b6d4 100%)",
    swatch: "#e879f9",
    textMode: "dark",
  },
  obsidian: {
    label: "Obsidian",
    colors: ["#18181b", "#27272a", "#3f3f46", "#a1a1aa"],
    cssGradient: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)",
    swatch: "#a1a1aa",
    textMode: "dark",
  },
};

export const THEME_PRESETS = {
  ...FREE_THEME_PRESETS,
  ...PRO_THEME_PRESETS,
} as Record<Exclude<CardTheme, "auto">, ThemePreset>;

export const PRO_THEMES: CardTheme[] = ["midnight", "aurora", "ember", "neon", "obsidian"];
export const PRO_BACKGROUNDS: BackgroundStyle[] = ["neuro", "metaballs", "godrays", "swirl", "waves"];
export const PRO_MATERIALS: CardMaterial[] = ["glass", "metallic", "holo"];

export function isProFeature(key: keyof CardPreferences, value: unknown): boolean {
  switch (key) {
    case "theme": return PRO_THEMES.includes(value as CardTheme);
    case "backgroundStyle": return PRO_BACKGROUNDS.includes(value as BackgroundStyle);
    case "glareStyle": return value === "prismatic";
    case "material": return PRO_MATERIALS.includes(value as CardMaterial);
    default: return false;
  }
}

export function isDarkTheme(theme: CardTheme): boolean {
  if (theme === "auto") return false;
  return THEME_PRESETS[theme]?.textMode === "dark";
}

// Status colors used when theme is "auto"
const STATUS_SHADER_COLORS: Record<BudgetStatus, string[]> = {
  safe: ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399"],
  close: ["#fef3c7", "#fde68a", "#fcd34d", "#fbbf24"],
  low: ["#ffedd5", "#fed7aa", "#fdba74", "#fb923c"],
  over: ["#ffe4e6", "#fecdd3", "#fda4af", "#fb7185"],
};

const STATUS_CSS_GRADIENTS: Record<BudgetStatus, string> = {
  safe: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
  close: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)",
  low: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)",
  over: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)",
};

const WARNING_COLORS = ["#ffedd5", "#fed7aa", "#fdba74", "#fb923c"]; // orange
const DANGER_COLORS = ["#ffe4e6", "#fecdd3", "#fda4af", "#fb7185"]; // rose

const NEUTRAL_SHADER_COLORS = ["#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e"];
const NEUTRAL_CSS_GRADIENT = "linear-gradient(135deg, #fafaf9 0%, #f5f5f4 50%, #e7e5e4 100%)";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function blendColorArrays(base: string[], target: string[], factor: number): string[] {
  return base.map((c, i) => lerpColor(c, target[i] ?? c, factor));
}

export function getThemeColors(
  theme: CardTheme,
  status: BudgetStatus,
  isBudgetMode: boolean
): { shaderColors: string[]; cssGradient: string } {
  if (!isBudgetMode) {
    if (theme === "auto") {
      return { shaderColors: NEUTRAL_SHADER_COLORS, cssGradient: NEUTRAL_CSS_GRADIENT };
    }
    const preset = THEME_PRESETS[theme];
    return { shaderColors: preset.colors, cssGradient: preset.cssGradient };
  }

  // Auto theme: pure status colors
  if (theme === "auto") {
    return {
      shaderColors: STATUS_SHADER_COLORS[status],
      cssGradient: STATUS_CSS_GRADIENTS[status],
    };
  }

  // Custom theme with status blending
  const preset = THEME_PRESETS[theme];
  let colors = preset.colors;
  let gradient = preset.cssGradient;

  if (status === "low") {
    colors = blendColorArrays(preset.colors, WARNING_COLORS, 0.3);
  } else if (status === "over") {
    colors = blendColorArrays(preset.colors, DANGER_COLORS, 0.6);
    gradient = STATUS_CSS_GRADIENTS.over;
  }

  return { shaderColors: colors, cssGradient: gradient };
}

export function getGreeting(displayName: string): string {
  const hour = new Date().getHours();
  let timeOfDay: string;
  if (hour >= 5 && hour < 12) timeOfDay = "Good morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "Good afternoon";
  else if (hour >= 17 && hour < 21) timeOfDay = "Good evening";
  else timeOfDay = "Good night";

  return `${timeOfDay}, ${displayName}`;
}
