import { useCallback, useEffect, useRef, useState } from "react";
import { ButtonLink } from "../components/ButtonLink";
import { CommandTerminal, type CommandLine, type CommandLineTone } from "../components/CommandTerminal";
import { ContactSection } from "../components/ContactSection";
import { MethodSection } from "../components/MethodSection";
import { SiteNav } from "../components/SiteNav";
import { TerminalPreview } from "../components/TerminalPreview";
import { ThreeBackdrop } from "../components/ThreeBackdrop";
import { Toast } from "../components/Toast";
import { WorkSection } from "../components/WorkSection";
import { capabilities, contactEmail, heroContent, metrics } from "../content/site-content";
import { useTheme } from "../design-system/ThemeProvider";
import { useToast } from "../hooks/use-toast";
import { runTerminalCommand, type TerminalCommandEffect } from "../terminal/command-engine";
import { rotationLayerModes, rotationModes, type RotationLayerMode, type RotationMode, type ScatterSignal } from "../three/scene-controls";
import "./app.css";

type TrafficTooltipState = {
  label: string;
  visible: boolean;
  x: number;
  y: number;
};

const initialCommandLines: CommandLine[] = [
  { id: 1, text: "Interactive browser terminal. No server shell, no risky commands.", tone: "system" },
  { id: 2, text: "Type help, or use shortcuts: g then h/m/w/c. Esc closes this terminal.", tone: "system" },
];

const TERMINAL_PREVIEW_REPLAY_INTERVAL_MS = 30_000;

const scrollToSection = (selector: string, label: string) => {
  const target = document.querySelector(selector);
  if (!target) return `${label} is not available yet.`;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return `Opened ${label}.`;
};

export function App() {
  const { theme, toggleTheme } = useTheme();
  const [rotationMode, setRotationModeState] = useState<RotationMode>(rotationModes.left);
  const [rotationLayerMode, setRotationLayerModeState] = useState<RotationLayerMode>(rotationLayerModes.sync);
  const [scatterSignal, setScatterSignal] = useState<ScatterSignal>({ duration: 8.4, id: 0 });
  const [resetSignal, setResetSignal] = useState(0);
  const [orbitActive, setOrbitActive] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [commandLines, setCommandLines] = useState<CommandLine[]>(initialCommandLines);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [heroRestarting, setHeroRestarting] = useState(false);
  const [terminalAnimationRun, setTerminalAnimationRun] = useState(0);
  const [trafficTooltip, setTrafficTooltip] = useState<TrafficTooltipState>({
    label: "",
    visible: false,
    x: 0,
    y: 0,
  });
  const shortcutPrefixRef = useRef(false);
  const shortcutTimerRef = useRef<number | undefined>(undefined);
  const lineIdRef = useRef(initialCommandLines.length);
  const { showToast, toast } = useToast();

  const appendCommandLine = useCallback((text: string, tone: CommandLineTone = "system") => {
    lineIdRef.current += 1;
    setCommandLines((current) => [...current, { id: lineIdRef.current, text, tone }]);
  }, []);

  const openTerminal = useCallback((initialCommand = "") => {
    setTerminalOpen(true);
    setTerminalInput(initialCommand);
  }, []);

  const closeTerminal = useCallback(() => {
    setTerminalOpen(false);
    setTerminalInput("");
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, []);

  const triggerCubeScatter = useCallback(
    (duration = 8.4, source: "nav" | "terminal" = "terminal") => {
      setOrbitActive(true);
      setScatterSignal((current) => ({ duration, id: current.id + 1 }));
      showToast(source === "nav" ? "Orbit broken. Rebuilding slowly..." : "Cubes released. Rebuilding orbit...");
      return "Cubes released. They will fold back into orbit slowly.";
    },
    [showToast],
  );

  const resetCubeScatter = useCallback(() => {
    setOrbitActive(false);
    setResetSignal((current) => current + 1);
    showToast("Orbit restored.");
    return "Cubes restored to perfect orbit.";
  }, [showToast]);

  const applyCommandEffect = useCallback(
    (effect: TerminalCommandEffect) => {
      if (effect.type === "clear") {
        setCommandLines([]);
        return;
      }

      if (effect.type === "scatter") {
        triggerCubeScatter(effect.duration);
        return;
      }

      if (effect.type === "restore") {
        resetCubeScatter();
        return;
      }

      if (effect.type === "scroll") {
        const target = document.querySelector(effect.selector);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (effect.type === "setRotationMode") {
        setRotationModeState(effect.mode);
        showToast(`Scene rotation: ${effect.mode.label}.`);
        return;
      }

      setRotationLayerModeState(effect.mode);
      showToast(`Scene mode: ${effect.mode.label}.`);
    },
    [resetCubeScatter, showToast, triggerCubeScatter],
  );

  const runCommand = useCallback(
    (rawValue: string) => {
      const result = runTerminalCommand(rawValue, { rotationLayerMode, rotationMode });
      if (!result) return;

      setCommandHistory((current) =>
        [result.normalizedCommand, ...current.filter((item) => item !== result.normalizedCommand)].slice(0, 10),
      );
      setHistoryIndex(-1);

      if (result.effects.some((effect) => effect.type === "clear")) {
        result.effects.forEach(applyCommandEffect);
        return;
      }

      appendCommandLine(`% ${result.normalizedCommand}`, "input");
      result.effects.forEach(applyCommandEffect);
      if (result.output) appendCommandLine(result.output, result.tone ?? "system");
    },
    [appendCommandLine, applyCommandEffect, rotationLayerMode, rotationMode],
  );

  const openTerminalWithCommand = useCallback(
    (command: string) => {
      openTerminal();
      window.setTimeout(() => runCommand(command), 40);
    },
    [openTerminal, runCommand],
  );

  const restartHeroTerminal = useCallback(() => {
    setHeroCollapsed(false);
    setHeroRestarting(true);
    setTerminalAnimationRun((current) => current + 1);
    showToast("Terminal sequence restarted.");
    window.setTimeout(() => setHeroRestarting(false), 900);
  }, [showToast]);

  const toggleHeroTerminal = useCallback(() => {
    setHeroCollapsed((current) => {
      showToast(current ? "Terminal expanded." : "Terminal minimized.");
      return !current;
    });
  }, [showToast]);

  const handleBreakOrbit = useCallback(() => {
    if (orbitActive) {
      resetCubeScatter();
      return;
    }

    triggerCubeScatter(11.5, "nav");
  }, [orbitActive, resetCubeScatter, triggerCubeScatter]);

  const handleScatterStatusChange = useCallback((status: "active" | "idle") => {
    setOrbitActive(status === "active");
  }, []);

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      showToast("Email copied to clipboard.");
    } catch {
      showToast(`Email: ${contactEmail}`);
    }
  }, [showToast]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTerminalAnimationRun((current) => current + 1);
    }, TERMINAL_PREVIEW_REPLAY_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openTerminal();
        return;
      }

      if (event.key === "Escape" && terminalOpen) {
        event.preventDefault();
        closeTerminal();
        return;
      }

      if (isTyping) return;

      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        openTerminalWithCommand("help");
        return;
      }

      if (event.key.toLowerCase() === "g") {
        shortcutPrefixRef.current = true;
        window.clearTimeout(shortcutTimerRef.current);
        shortcutTimerRef.current = window.setTimeout(() => {
          shortcutPrefixRef.current = false;
        }, 1200);
        showToast("Shortcut prefix: press h, m, w, or c.");
        return;
      }

      if (!shortcutPrefixRef.current) return;

      shortcutPrefixRef.current = false;
      window.clearTimeout(shortcutTimerRef.current);
      const key = event.key.toLowerCase();
      const shortcutActions: Record<string, () => string> = {
        c: () => {
          openTerminalWithCommand("contact");
          return "Contact";
        },
        h: () => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return "Top";
        },
        m: () => scrollToSection("#method", "method"),
        w: () => scrollToSection("#work", "work"),
      };

      const action = shortcutActions[key];
      if (!action) return;
      event.preventDefault();
      showToast(action());
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(shortcutTimerRef.current);
    };
  }, [closeTerminal, openTerminal, openTerminalWithCommand, showToast, terminalOpen]);

  return (
    <>
      <div className="page" id="page">
        <ThreeBackdrop
          onScatterStatusChange={handleScatterStatusChange}
          resetSignal={resetSignal}
          rotationLayerMode={rotationLayerMode}
          rotationMode={rotationMode}
          scatterSignal={scatterSignal}
        />
        <SiteNav onBreakOrbit={handleBreakOrbit} onToggleTheme={toggleTheme} orbitActive={orbitActive} theme={theme} />

        <main className="hero">
          <section className="hero-copy">
            <p className="eyebrow">{heroContent.eyebrow}</p>
            <h1>
              {heroContent.headline} <span className="gradient-text">{heroContent.highlightedHeadline}</span>
            </h1>
            <p className="hero-text">{heroContent.body}</p>
            <p className="hero-meta">{heroContent.meta}</p>
            <div className="hero-actions">
              <ButtonLink href={heroContent.primaryAction.href} variant="primary">
                {heroContent.primaryAction.label}
              </ButtonLink>
              <ButtonLink href={heroContent.secondaryAction.href}>{heroContent.secondaryAction.label}</ButtonLink>
            </div>
            <div className="capability-row" aria-label="Capabilities">
              {capabilities.map((capability) => (
                <span className="chip" key={capability}>
                  {capability}
                </span>
              ))}
            </div>
          </section>

          <aside className="right-rail" aria-label="Live development console">
            <div className="metrics">
              {metrics.map((metric) => (
                <div className="metric" key={metric.value}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>

            <TerminalPreview
              animationRun={terminalAnimationRun}
              collapsed={heroCollapsed}
              onMinimize={toggleHeroTerminal}
              onOpenTerminal={() => openTerminal()}
              onReset={restartHeroTerminal}
              onTooltipChange={setTrafficTooltip}
              restarting={heroRestarting}
            />
          </aside>
        </main>

        <WorkSection />
        <MethodSection />
        <ContactSection onCopyEmail={() => void handleCopyEmail()} />
      </div>

      <CommandTerminal
        history={commandHistory}
        historyIndex={historyIndex}
        inputValue={terminalInput}
        lines={commandLines}
        onClose={closeTerminal}
        onHistoryIndexChange={setHistoryIndex}
        onInputChange={setTerminalInput}
        onRunCommand={runCommand}
        open={terminalOpen}
      />
      <div
        className={`traffic-tooltip ${trafficTooltip.visible ? "is-visible" : ""}`}
        role="tooltip"
        style={{ left: trafficTooltip.x, top: trafficTooltip.y }}
      >
        {trafficTooltip.label}
      </div>
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
