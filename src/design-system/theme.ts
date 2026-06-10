export const themeOptions = ["dark", "light"] as const;

export type ThemeName = (typeof themeOptions)[number];

export const DEFAULT_THEME: ThemeName = "light";
export const THEME_STORAGE_KEY = "norberto-work-theme";

export const isThemeName = (value: string | null): value is ThemeName =>
  value === "dark" || value === "light";

export const getNextTheme = (theme: ThemeName): ThemeName => (theme === "dark" ? "light" : "dark");

export const getStoredTheme = (storage: Pick<Storage, "getItem">): ThemeName | null => {
  const value = storage.getItem(THEME_STORAGE_KEY);
  return isThemeName(value) ? value : null;
};
