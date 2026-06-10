export const heroContent = {
  brand: "Norberto Carosella",
  eyebrow: "Frontend systems and product interfaces",
  headline: "Interfaces for products that need",
  highlightedHeadline: "precision.",
  body: "I help teams turn dense workflows, uncertain product requirements, and complex frontend states into web applications that feel clear, fast, and dependable.",
  primaryAction: {
    href: "mailto:norberto.carosella@gmail.com",
    label: "Start a project conversation",
  },
  secondaryAction: {
    href: "#method",
    label: "See how I work",
  },
  availability: {
    href: "mailto:norberto.carosella@gmail.com",
    label: "Available for selected work",
  },
};

export const capabilities = ["React + TypeScript", "Product UI", "Design systems", "Frontend architecture"];

export const metrics = [
  { label: "Data-heavy product surfaces", value: "UI" },
  { label: "Typed, reviewable implementation", value: "TS" },
  { label: "States, flows, polish", value: "UX" },
] as const;

type TerminalLine = {
  cursor?: boolean;
  highlights?: readonly string[];
  marker: string;
  text: string;
  tone?: "command";
};

type MethodCard = {
  body: string;
  id?: string;
  title: string;
};

export const terminalLines: readonly TerminalLine[] = [
  { marker: "$", text: "norberto init complex-product-ui", tone: "command" },
  { marker: "01", text: "reading product constraints and hidden edge cases" },
  { marker: "02", text: "mapping forms, states, permissions, and data density", highlights: ["forms", "states", "permissions"] },
  { marker: "03", text: "building focused interface slices with React and TypeScript" },
  { marker: "04", text: "tightening responsive behavior, accessibility, and review feedback" },
  { marker: "ok", text: "ready for people to actually use it" },
  { marker: "tip", text: "open the console with Cmd/Ctrl K and try spin counter", highlights: ["Cmd/Ctrl K", "spin counter"], cursor: true },
] as const;

export const methodCards: readonly MethodCard[] = [
  {
    body: "Good frontend work begins by understanding what the user is trying to complete and what can go wrong.",
    title: "Start with the workflow, not the component.",
  },
  {
    body: "Enough structure to be maintainable, enough focus to ship, and enough polish to feel intentional.",
    title: "Build the smallest useful product slice.",
  },
  {
    body: "Typed flows, clear boundaries, practical review notes, and implementation choices that survive iteration.",
    id: "work",
    title: "Leave the codebase easier to keep moving.",
  },
] as const;
