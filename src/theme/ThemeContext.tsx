import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { getItem, setItem } from "@/lib/storage";
import { darkTheme, lightTheme, type Theme } from "@/theme/tokens";

type ThemePreference = "light" | "dark" | "system";
const STORAGE_KEY = "mico.themePreference";

type ThemeContextValue = {
  theme: Theme;
  mode: "light" | "dark";
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreferenceState(stored);
      }
    });
  }, []);

  function setPreference(pref: ThemePreference) {
    setPreferenceState(pref);
    setItem(STORAGE_KEY, pref).catch(() => {});
  }

  const resolvedMode = preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;
  const theme = resolvedMode === "dark" ? darkTheme : lightTheme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode: resolvedMode,
      preference,
      setPreference,
      toggle: () => setPreference(resolvedMode === "dark" ? "light" : "dark"),
    }),
    [theme, preference, resolvedMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalı.");
  return ctx;
}
