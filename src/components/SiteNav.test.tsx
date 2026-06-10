import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteNav } from "./SiteNav";

describe("SiteNav", () => {
  it("renders orbit and theme controls", async () => {
    const user = userEvent.setup();
    const onBreakOrbit = vi.fn();
    const onToggleTheme = vi.fn();

    render(<SiteNav onBreakOrbit={onBreakOrbit} onToggleTheme={onToggleTheme} orbitActive={false} theme="dark" />);

    await user.click(screen.getByRole("button", { name: "Break the cube orbit" }));
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(onBreakOrbit).toHaveBeenCalledTimes(1);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("updates the orbit control label when active", () => {
    render(<SiteNav onBreakOrbit={vi.fn()} onToggleTheme={vi.fn()} orbitActive theme="light" />);

    expect(screen.getByRole("button", { name: "Restore the cubes to perfect orbit" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });
});
