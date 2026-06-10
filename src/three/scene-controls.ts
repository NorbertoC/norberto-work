export type RotationAxis = "x" | "y";
export type RotationModeName = "left" | "right" | "up" | "down";
export type RotationLayerModeName = "sync" | "counter";

export type RotationMode = {
  axis: RotationAxis;
  direction: 1 | -1;
  label: string;
  name: RotationModeName;
};

export type RotationLayerMode = {
  label: string;
  name: RotationLayerModeName;
  objectMultiplier: 1 | -1;
  orbitMultiplier: 1 | -1;
};

export type ScatterSignal = {
  duration: number;
  id: number;
};

export const rotationModes = {
  left: { axis: "y", direction: 1, label: "right to left", name: "left" },
  right: { axis: "y", direction: -1, label: "left to right", name: "right" },
  down: { axis: "x", direction: 1, label: "top to bottom", name: "down" },
  up: { axis: "x", direction: -1, label: "bottom to top", name: "up" },
} satisfies Record<RotationModeName, RotationMode>;

export const rotationLayerModes = {
  sync: {
    label: "single-direction rotation",
    name: "sync",
    objectMultiplier: 1,
    orbitMultiplier: 1,
  },
  counter: {
    label: "counter-rotation",
    name: "counter",
    objectMultiplier: -1,
    orbitMultiplier: 1,
  },
} satisfies Record<RotationLayerModeName, RotationLayerMode>;

export const getReverseRotationMode = (mode: RotationMode) => {
  if (mode.name === "left") return rotationModes.right;
  if (mode.name === "right") return rotationModes.left;
  if (mode.name === "up") return rotationModes.down;
  return rotationModes.up;
};
