import { describe, expect, it } from "vitest";
import { getReverseRotationMode, rotationLayerModes, rotationModes } from "./scene-controls";

describe("scene controls", () => {
  it("defines horizontal and vertical rotation modes", () => {
    expect(rotationModes.left).toMatchObject({ axis: "y", direction: 1, name: "left" });
    expect(rotationModes.right).toMatchObject({ axis: "y", direction: -1, name: "right" });
    expect(rotationModes.up).toMatchObject({ axis: "x", direction: -1, name: "up" });
    expect(rotationModes.down).toMatchObject({ axis: "x", direction: 1, name: "down" });
  });

  it("defines sync and counter layer modes", () => {
    expect(rotationLayerModes.sync).toMatchObject({ objectMultiplier: 1, orbitMultiplier: 1 });
    expect(rotationLayerModes.counter).toMatchObject({ objectMultiplier: -1, orbitMultiplier: 1 });
  });

  it("reverses each direction symmetrically", () => {
    expect(getReverseRotationMode(rotationModes.left)).toBe(rotationModes.right);
    expect(getReverseRotationMode(rotationModes.right)).toBe(rotationModes.left);
    expect(getReverseRotationMode(rotationModes.up)).toBe(rotationModes.down);
    expect(getReverseRotationMode(rotationModes.down)).toBe(rotationModes.up);
    expect(getReverseRotationMode(getReverseRotationMode(rotationModes.left))).toBe(rotationModes.left);
  });
});
