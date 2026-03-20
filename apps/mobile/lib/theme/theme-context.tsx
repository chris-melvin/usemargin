import { createContext, useContext, useState, useCallback } from "react";
import { useColorScheme } from "react-native";
import { lightColors, darkColors, type ThemeColors } from "./colors";

type ColorSchemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  colorScheme: "light" | "dark";
  preference: ColorSchemePreference;
  setPreference: (pref: ColorSchemePreference) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "light",
  preference: "system",
  setPreference: () => {},
  colors: lightColors,
});

interface ThemeProviderProps {
  children: React.ReactNode;
  initialPreference?: ColorSchemePreference;
}

export function ThemeProvider({ children, initialPreference = "system" }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ColorSchemePreference>(initialPreference);

  const resolvedScheme =
    preference === "system"
      ? (systemScheme ?? "light")
      : preference;

  const colors = resolvedScheme === "dark" ? darkColors : lightColors;

  const setPreference = useCallback((pref: ColorSchemePreference) => {
    setPreferenceState(pref);
    // In production, persist to MMKV/AsyncStorage here
  }, []);

  return (
    <ThemeContext.Provider value={{ colorScheme: resolvedScheme, preference, setPreference, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
