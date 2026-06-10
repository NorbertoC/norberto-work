import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEME_STORAGE_KEY, getNextTheme, getStoredTheme, isThemeName } from "./theme";

describe("theme helpers", () => {
  it("defaults to light mode", () => {
    expect(DEFAULT_THEME).toBe("light");
  });

  it("validates supported theme names", () => {
    expect(isThemeName("dark")).toBe(true);
    expect(isThemeName("light")).toBe(true);
    expect(isThemeName("system")).toBe(false);
  });

  it("cycles between dark and light themes", () => {
    expect(getNextTheme("dark")).toBe("light");
    expect(getNextTheme("light")).toBe("dark");
  });

  it("reads only valid persisted themes", () => {
    expect(getStoredTheme({ getItem: () => "light" })).toBe("light");
    expect(getStoredTheme({ getItem: () => "invalid" })).toBeNull();
    expect(getStoredTheme({ getItem: (key) => (key === THEME_STORAGE_KEY ? "dark" : null) })).toBe("dark");
  });
});
