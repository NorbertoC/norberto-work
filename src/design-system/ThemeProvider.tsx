import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, getNextTheme, getStoredTheme, type ThemeName } from "./theme";

type ThemeContextValue = {
  setTheme: (theme: ThemeName) => void;
  theme: ThemeName;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getInitialTheme = (): ThemeName => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return getStoredTheme(window.localStorage) ?? DEFAULT_THEME;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      setTheme,
      theme,
      toggleTheme: () => setTheme((current) => getNextTheme(current)),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
};
