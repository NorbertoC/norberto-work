import { ThemeToggle } from "./ThemeToggle";
import { heroContent } from "../content/site-content";
import type { ThemeName } from "../design-system/theme";

type SiteNavProps = {
  onBreakOrbit: () => void;
  onToggleTheme: () => void;
  orbitActive: boolean;
  theme: ThemeName;
};

export function SiteNav({ onBreakOrbit, onToggleTheme, orbitActive, theme }: SiteNavProps) {
  return (
    <nav className="site-nav" aria-label="Site navigation">
      <a className="brand" href="#page">
        <span className="brand-mark">N</span>
        <span>{heroContent.brand}</span>
      </a>
      <div className="nav-links">
        <a href="#work">Work</a>
        <a href="#method">Method</a>
        <button
          className="nav-action"
          type="button"
          onClick={onBreakOrbit}
          aria-label={orbitActive ? "Restore the cubes to perfect orbit" : "Break the cube orbit"}
          aria-pressed={orbitActive}
        >
          {orbitActive ? "Restore Orbit" : "Break Orbit"}
        </button>
        <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        <a className="availability" href={heroContent.availability.href}>
          <i aria-hidden="true" />
          {heroContent.availability.label}
        </a>
      </div>
    </nav>
  );
}
