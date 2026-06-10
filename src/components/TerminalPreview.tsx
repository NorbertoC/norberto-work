import { useEffect } from "react";
import type { CSSProperties } from "react";
import { terminalLines } from "../content/site-content";

type TrafficTooltipState = {
  label: string;
  visible: boolean;
  x: number;
  y: number;
};

type TerminalPreviewProps = {
  animationRun: number;
  collapsed: boolean;
  onMinimize: () => void;
  onOpenTerminal: () => void;
  onReset: () => void;
  onTooltipChange: (tooltip: TrafficTooltipState) => void;
  restarting: boolean;
};

const renderLineText = (line: (typeof terminalLines)[number]) => {
  if (line.tone === "command") {
    return (
      <>
        <em>norberto</em> init complex-product-ui
      </>
    );
  }

  const highlightSet = new Set<string>(line.highlights ?? []);
  const pattern = line.highlights?.length ? new RegExp(`(${line.highlights.join("|")})`, "g") : null;
  const parts = pattern ? line.text.split(pattern) : [line.text];

  return (
    <>
      {parts.map((part, index) =>
        highlightSet.has(part) ? <b key={`${part}-${index}`}>{part}</b> : <span key={`${part}-${index}`}>{part}</span>,
      )}
      {line.cursor ? <span className="cursor" /> : null}
    </>
  );
};

export function TerminalPreview({
  animationRun,
  collapsed,
  onMinimize,
  onOpenTerminal,
  onReset,
  onTooltipChange,
  restarting,
}: TerminalPreviewProps) {
  useEffect(() => {
    const hideTooltip = () => onTooltipChange({ label: "", visible: false, x: 0, y: 0 });
    window.addEventListener("resize", hideTooltip);
    window.addEventListener("scroll", hideTooltip, { passive: true });

    return () => {
      window.removeEventListener("resize", hideTooltip);
      window.removeEventListener("scroll", hideTooltip);
    };
  }, [onTooltipChange]);

  const showTooltip = (label: string, target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return;
    const rect = target.getBoundingClientRect();
    onTooltipChange({
      label,
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
  };

  const hideTooltip = () => onTooltipChange({ label: "", visible: false, x: 0, y: 0 });

  const handleReset = () => {
    hideTooltip();
    onReset();
  };

  const handleMinimize = () => {
    hideTooltip();
    onMinimize();
  };

  const handleOpen = () => {
    hideTooltip();
    onOpenTerminal();
  };

  return (
    <section className={`terminal glass-panel ${collapsed ? "is-collapsed" : ""} ${restarting ? "is-restarting" : ""}`}>
      <div className="terminal-top">
        <div className="dots" aria-label="Terminal controls">
          <button
            className="traffic-reset"
            type="button"
            onClick={handleReset}
            onBlur={hideTooltip}
            onFocus={(event) => showTooltip("Restart", event.currentTarget)}
            onPointerEnter={(event) => showTooltip("Restart", event.currentTarget)}
            onPointerLeave={hideTooltip}
            aria-label="Restart terminal sequence"
          />
          <button
            className="traffic-minimize"
            type="button"
            onClick={handleMinimize}
            onBlur={hideTooltip}
            onFocus={(event) => showTooltip(collapsed ? "Expand" : "Minimize", event.currentTarget)}
            onPointerEnter={(event) => showTooltip(collapsed ? "Expand" : "Minimize", event.currentTarget)}
            onPointerLeave={hideTooltip}
            aria-label={collapsed ? "Expand terminal" : "Minimize terminal"}
            aria-pressed={collapsed}
          />
          <button
            className="traffic-open"
            type="button"
            onClick={handleOpen}
            onBlur={hideTooltip}
            onFocus={(event) => showTooltip("Open", event.currentTarget)}
            onPointerEnter={(event) => showTooltip("Open", event.currentTarget)}
            onPointerLeave={hideTooltip}
            aria-label="Open interactive terminal"
          />
        </div>
        <div className="terminal-title">
          <span>norberto.work / compiler</span>
          <button className="terminal-open" type="button" onClick={onOpenTerminal}>
            Open with Cmd/Ctrl K
          </button>
        </div>
      </div>
      <div className="terminal-body" key={animationRun}>
        {terminalLines.map((line, index) => (
          <div className="terminal-line" style={{ "--i": index + 1 } as CSSProperties} key={line.marker}>
            <span>{line.marker}</span>
            <span>{renderLineText(line)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
