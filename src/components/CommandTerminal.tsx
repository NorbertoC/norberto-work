import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

export type CommandLineTone = "error" | "input" | "system";

export type CommandLine = {
  id: number;
  text: string;
  tone: CommandLineTone;
};

type CommandTerminalProps = {
  history: string[];
  historyIndex: number;
  inputValue: string;
  lines: CommandLine[];
  onClose: () => void;
  onHistoryIndexChange: (index: number) => void;
  onInputChange: (value: string) => void;
  onRunCommand: (command: string) => void;
  open: boolean;
};

export function CommandTerminal({
  history,
  historyIndex,
  inputValue,
  lines,
  onClose,
  onHistoryIndexChange,
  onInputChange,
  onRunCommand,
  open,
}: CommandTerminalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  useEffect(() => {
    const output = outputRef.current;
    if (!output) return;
    output.scrollTop = output.scrollHeight;
  }, [lines]);

  const submitCommand = () => {
    const command = inputValue;
    onInputChange("");
    onRunCommand(command);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitCommand();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!history.length) return;
      const nextIndex = Math.min(historyIndex + 1, history.length - 1);
      onHistoryIndexChange(nextIndex);
      onInputChange(history[nextIndex]);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.max(historyIndex - 1, -1);
      onHistoryIndexChange(nextIndex);
      onInputChange(nextIndex === -1 ? "" : history[nextIndex]);
    }
  };

  return (
    <div
      className={`command-layer ${open ? "is-open" : ""}`}
      aria-hidden={!open}
    >
      <button
        className="command-backdrop"
        type="button"
        onClick={onClose}
        tabIndex={-1}
        aria-label="Close terminal backdrop"
      />
      <section className="command-terminal" role="dialog" aria-modal="true" aria-label="Interactive terminal">
        <header className="command-header">
          <span>interactive terminal / type help</span>
          <button className="command-close" type="button" onClick={onClose} aria-label="Close terminal">
            x
          </button>
        </header>
        <div className="command-output" ref={outputRef} aria-live="polite">
          {lines.map((line) => (
            <p className={line.tone} key={line.id}>
              {line.text}
            </p>
          ))}
        </div>
        <form
          className="command-form"
          onSubmit={(event) => {
            event.preventDefault();
            submitCommand();
          }}
        >
          <span>norberto@work %</span>
          <input
            className="command-input"
            ref={inputRef}
            value={inputValue}
            aria-label="Terminal command"
            onChange={(event) => onInputChange(event.currentTarget.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="try: help, spin right, spin up"
          />
          <button className="command-submit" type="submit">
            Run
          </button>
        </form>
      </section>
    </div>
  );
}
