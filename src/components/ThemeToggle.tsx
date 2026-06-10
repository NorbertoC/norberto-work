import type { ThemeName } from "../design-system/theme";

type ThemeToggleProps = {
  onToggle: () => void;
  theme: ThemeName;
};

export function ThemeToggle({ onToggle, theme }: ThemeToggleProps) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
    >
      <span className="theme-toggle__icon" aria-hidden="true" />
      <span>{nextTheme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}
