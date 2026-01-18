import { useColorScheme as useRNColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";

const THEME_KEY = "@dinesplit:theme";

type ColorScheme = "light" | "dark";

let globalThemeOverride: ColorScheme | null = null;
let listeners: Array<(theme: ColorScheme | null) => void> = [];

export function useColorScheme(): ColorScheme {
  const systemScheme = useRNColorScheme() ?? "light";
  const [themeOverride, setThemeOverride] = useState<ColorScheme | null>(globalThemeOverride);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      if (value === "light" || value === "dark") {
        globalThemeOverride = value;
        setThemeOverride(value);
      }
    });

    const listener = (theme: ColorScheme | null) => setThemeOverride(theme);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return themeOverride ?? systemScheme;
}

export function useThemeToggle() {
  const currentScheme = useColorScheme();

  const toggleTheme = useCallback(async () => {
    const newTheme = currentScheme === "dark" ? "light" : "dark";
    globalThemeOverride = newTheme;
    await AsyncStorage.setItem(THEME_KEY, newTheme);
    listeners.forEach((l) => l(newTheme));
  }, [currentScheme]);

  const setTheme = useCallback(async (theme: ColorScheme) => {
    globalThemeOverride = theme;
    await AsyncStorage.setItem(THEME_KEY, theme);
    listeners.forEach((l) => l(theme));
  }, []);

  return { toggleTheme, setTheme, isDark: currentScheme === "dark" };
}
