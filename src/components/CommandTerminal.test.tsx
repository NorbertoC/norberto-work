import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { CommandTerminal, type CommandLine } from "./CommandTerminal";

const lines: CommandLine[] = [{ id: 1, text: "Ready", tone: "system" }];

const createProps = (overrides: Partial<ComponentProps<typeof CommandTerminal>> = {}) => ({
  history: ["contact", "help"],
  historyIndex: -1,
  inputValue: "",
  lines,
  onClose: vi.fn(),
  onHistoryIndexChange: vi.fn(),
  onInputChange: vi.fn(),
  onRunCommand: vi.fn(),
  open: true,
  ...overrides,
});

const renderTerminal = (overrides: Partial<ComponentProps<typeof CommandTerminal>> = {}) => {
  const props = {
    ...createProps(overrides),
  };

  render(<CommandTerminal {...props} />);
  return props;
};

describe("CommandTerminal", () => {
  it("exposes open state through aria-hidden", () => {
    const { rerender } = render(<CommandTerminal {...createProps({ open: false })} />);
    expect(document.querySelector(".command-layer")).toHaveAttribute("aria-hidden", "true");

    rerender(<CommandTerminal {...createProps({ open: true })} />);
    expect(document.querySelector(".command-layer")).toHaveAttribute("aria-hidden", "false");
  });

  it("submits the current command and clears the input", async () => {
    const user = userEvent.setup();
    const props = renderTerminal({ inputValue: "spin counter" });

    await user.click(screen.getByRole("button", { name: "Run" }));

    expect(props.onInputChange).toHaveBeenCalledWith("");
    expect(props.onRunCommand).toHaveBeenCalledWith("spin counter");
  });

  it("walks command history with arrow keys", async () => {
    const user = userEvent.setup();
    const props = renderTerminal();
    const input = screen.getByPlaceholderText("try: help, spin right, spin up");

    await user.click(input);
    await user.keyboard("{ArrowUp}");

    expect(props.onHistoryIndexChange).toHaveBeenCalledWith(0);
    expect(props.onInputChange).toHaveBeenCalledWith("contact");
  });

  it("closes on backdrop click but not on dialog click", async () => {
    const user = userEvent.setup();
    const props = renderTerminal();

    await user.click(screen.getByRole("dialog", { name: "Interactive terminal" }));
    expect(props.onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Close terminal backdrop" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
