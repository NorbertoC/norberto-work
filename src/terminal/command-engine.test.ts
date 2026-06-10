import { describe, expect, it } from "vitest";
import { rotationLayerModes, rotationModes } from "../three/scene-controls";
import { runTerminalCommand, type TerminalCommandState } from "./command-engine";

const state: TerminalCommandState = {
  rotationLayerMode: rotationLayerModes.sync,
  rotationMode: rotationModes.left,
};

describe("terminal command engine", () => {
  it("normalizes commands and returns static output", () => {
    expect(runTerminalCommand("  CONTACT ", state)).toMatchObject({
      effects: [],
      normalizedCommand: "contact",
      output: "Email: norberto.carosella@gmail.com",
    });
  });

  it("returns spin mode effects", () => {
    expect(runTerminalCommand("spin counter", state)).toMatchObject({
      effects: [{ mode: rotationLayerModes.counter, type: "setRotationLayerMode" }],
      output: "Scene mode set to counter-rotation.",
    });

    expect(runTerminalCommand("spin up", state)).toMatchObject({
      effects: [{ mode: rotationModes.up, type: "setRotationMode" }],
      output: "Scene rotation set to bottom to top.",
    });
  });

  it("returns scene effects for scatter and restore", () => {
    expect(runTerminalCommand("scatter", state)).toMatchObject({
      effects: [{ duration: 8.4, type: "scatter" }],
    });
    expect(runTerminalCommand("restore", state)).toMatchObject({
      effects: [{ type: "restore" }],
    });
  });

  it("returns clear and scroll effects", () => {
    expect(runTerminalCommand("clear", state)).toMatchObject({
      effects: [{ type: "clear" }],
      output: null,
    });
    expect(runTerminalCommand("work", state)).toMatchObject({
      effects: [{ label: "work", selector: "#work", type: "scroll" }],
      output: "Opened work.",
    });
  });

  it("reports unknown commands as errors", () => {
    expect(runTerminalCommand("deploy prod", state)).toMatchObject({
      effects: [],
      output: "Command not found: deploy prod. Type help.",
      tone: "error",
    });
  });
});
