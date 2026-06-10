import {
  getReverseRotationMode,
  rotationLayerModes,
  rotationModes,
  type RotationLayerMode,
  type RotationMode,
} from "../three/scene-controls";

export type TerminalCommandState = {
  rotationLayerMode: RotationLayerMode;
  rotationMode: RotationMode;
};

export type TerminalCommandEffect =
  | { type: "clear" }
  | { duration: number; type: "scatter" }
  | { label: string; selector: string; type: "scroll" }
  | { mode: RotationLayerMode; type: "setRotationLayerMode" }
  | { mode: RotationMode; type: "setRotationMode" }
  | { type: "restore" };

export type TerminalCommandResult = {
  effects: TerminalCommandEffect[];
  normalizedCommand: string;
  output: string | null;
  tone?: "error" | "system";
};

const helpOutput = [
  "Available commands:",
  "  about       who I am and what I build",
  "  stack       tools and working style",
  "  spin        control 3D rotation and layer direction",
  "  scatter     throw cubes out, then rebuild orbit",
  "  restore     snap cubes back to perfect orbit",
  "  work        jump to selected work area",
  "  method      jump to the working method",
  "  contact     show the best email",
  "  shortcuts   list keyboard shortcuts",
  "  clear       clear this terminal",
].join("\n");

const spinHelpOutput = [
  "Spin controls:",
  "  spin left      rotate right to left",
  "  spin right     rotate left to right",
  "  spin down      rotate top to bottom",
  "  spin up        rotate bottom to top",
  "  spin reverse   invert current direction",
  "  spin counter   orbit one way, objects spin the other",
  "  spin sync      rotate all layers together",
  "  spin status    show current spin settings",
].join("\n");

const shortcutsOutput = [
  "Keyboard shortcuts:",
  "  Cmd/Ctrl + K   open terminal",
  "  Esc            close terminal",
  "  g then h       go to top",
  "  g then m       go to method",
  "  g then w       go to work",
  "  g then c       open contact info",
].join("\n");

const handleSpinCommand = (args: string[], state: TerminalCommandState): TerminalCommandResult => {
  const requested = args[0];

  if (!requested) {
    return {
      effects: [],
      normalizedCommand: "spin",
      output: spinHelpOutput,
    };
  }

  if (requested === "reverse") {
    const mode = getReverseRotationMode(state.rotationMode);
    return {
      effects: [{ mode, type: "setRotationMode" }],
      normalizedCommand: "spin reverse",
      output: `Scene rotation set to ${mode.label}.`,
    };
  }

  if (requested === "counter" || requested === "split") {
    return {
      effects: [{ mode: rotationLayerModes.counter, type: "setRotationLayerMode" }],
      normalizedCommand: `spin ${requested}`,
      output: `Scene mode set to ${rotationLayerModes.counter.label}.`,
    };
  }

  if (requested === "sync" || requested === "together") {
    return {
      effects: [{ mode: rotationLayerModes.sync, type: "setRotationLayerMode" }],
      normalizedCommand: `spin ${requested}`,
      output: `Scene mode set to ${rotationLayerModes.sync.label}.`,
    };
  }

  if (requested === "status") {
    return {
      effects: [],
      normalizedCommand: "spin status",
      output: `Rotation: ${state.rotationMode.label}. Layer mode: ${state.rotationLayerMode.label}.`,
    };
  }

  const mode = rotationModes[requested as keyof typeof rotationModes];
  if (!mode) {
    return {
      effects: [],
      normalizedCommand: `spin ${requested}`,
      output: `Unknown spin option: ${requested}. Try left, right, up, down, reverse, counter, sync, or status.`,
      tone: "error",
    };
  }

  return {
    effects: [{ mode, type: "setRotationMode" }],
    normalizedCommand: `spin ${requested}`,
    output: `Scene rotation set to ${mode.label}.`,
  };
};

export const runTerminalCommand = (rawValue: string, state: TerminalCommandState): TerminalCommandResult | null => {
  const normalizedCommand = rawValue.trim().toLowerCase();
  if (!normalizedCommand) return null;

  const [commandName, ...args] = normalizedCommand.split(/\s+/);

  if (commandName === "spin" || commandName === "rotate") {
    return handleSpinCommand(args, state);
  }

  if (commandName === "clear") {
    return {
      effects: [{ type: "clear" }],
      normalizedCommand,
      output: null,
    };
  }

  if (commandName === "scatter" || commandName === "cubes" || commandName === "explode") {
    return {
      effects: [{ duration: 8.4, type: "scatter" }],
      normalizedCommand,
      output: "Cubes released. They will fold back into orbit slowly.",
    };
  }

  if (commandName === "restore" || commandName === "orbit") {
    return {
      effects: [{ type: "restore" }],
      normalizedCommand,
      output: "Cubes restored to perfect orbit.",
    };
  }

  if (commandName === "work" || commandName === "method") {
    const label = commandName === "work" ? "work" : "method";
    return {
      effects: [{ label, selector: `#${label}`, type: "scroll" }],
      normalizedCommand,
      output: `Opened ${label}.`,
    };
  }

  const staticOutputs: Record<string, string> = {
    about:
      "Norberto Carosella: frontend/product engineer focused on complex interfaces, dense workflows, and typed React systems.",
    contact: "Email: norberto.carosella@gmail.com",
    help: helpOutput,
    shortcuts: shortcutsOutput,
    stack:
      "React, TypeScript, product UI, design-system integration, accessibility, pragmatic architecture, and review-friendly delivery.",
  };

  const output = staticOutputs[commandName];
  if (output) {
    return {
      effects: [],
      normalizedCommand,
      output,
    };
  }

  return {
    effects: [],
    normalizedCommand,
    output: `Command not found: ${normalizedCommand}. Type help.`,
    tone: "error",
  };
};
