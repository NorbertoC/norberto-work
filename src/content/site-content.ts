export const contactEmail = "norberto.carosella@gmail.com";

export const heroContent = {
  brand: "Norberto Carosella",
  eyebrow: "Frontend engineer · React + TypeScript",
  headline: "I build precise, production-ready interfaces for",
  highlightedHeadline: "product teams.",
  body: "Dense workflows, uncertain requirements, complex frontend state — I turn them into web apps that feel clear, fast, and dependable. End to end, from design system to deploy.",
  meta: "Based in Auckland, New Zealand",
  primaryAction: {
    href: `mailto:${contactEmail}`,
    label: "Get in touch",
  },
  secondaryAction: {
    href: "#work",
    label: "See selected work",
  },
  github: {
    href: "https://github.com/NorbertoC",
    label: "GitHub",
  },
};

export const capabilities = [
  "React + TypeScript, end to end",
  "Product UI & design systems",
  "Frontend architecture & review",
];

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
  step: string;
  title: string;
};

type WorkCase = {
  decisions: readonly string[];
  link?: { href: string; label: string };
  meta: string;
  result: string;
  summary: string;
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

export const workSection = {
  label: "Selected work",
  title: "Real products, real constraints.",
};

export const workCases: readonly WorkCase[] = [
  {
    title: "Survey platform — B2B SaaS",
    meta: "React · TypeScript · MUI design system · ongoing",
    summary:
      "Frontend engineer on a data-dense survey product: builders, dashboards, roles and permissions, and a shared design system that every feature builds on.",
    decisions: [
      "Typed, schema-validated form flows so dense builders stay predictable as requirements shift",
      "Design-system stewardship — shared theme components instead of per-feature overrides",
      "Clear server/client state boundaries to keep data-heavy screens fast and reviewable",
    ],
    result: "Interfaces built to survive iteration: reviewable, accessible, and fast as the product grows.",
  },
  {
    title: "norberto.work — this site",
    meta: "React 19 · Three.js · Vite · Playwright · Cloudflare Pages",
    summary:
      "A small but production-minded build: custom design tokens with dark and light themes, an interactive Three.js orbit you can grab and throw, and a command terminal (try Cmd/Ctrl K).",
    decisions: [
      "Hand-rolled WebGL scene with reduced-motion support, pixel-ratio caps, and scroll-aware rendering",
      "Unit, component, and e2e test layers — the same discipline as client work",
    ],
    result: "The source is public — the code is part of the portfolio.",
    link: { href: "https://github.com/NorbertoC/norberto-work", label: "View source on GitHub" },
  },
];

export const methodSection = {
  label: "How I work",
  title: "No black boxes.",
};

export const methodCards: readonly MethodCard[] = [
  {
    step: "01",
    body: "First days go to understanding what users need to complete, what can go wrong, and which constraints are real.",
    title: "Start with the workflow, not the component.",
  },
  {
    step: "02",
    body: "Working software over status updates: visible progress every week, feedback while change is still cheap.",
    title: "Ship the smallest useful slice, demo it early.",
  },
  {
    step: "03",
    body: "Typed flows, clear boundaries, practical review notes, and implementation choices that survive iteration.",
    title: "Hand off a codebase your team can keep moving.",
  },
] as const;

export const contactSection = {
  label: "Contact",
  title: "Let's talk.",
  body: "Questions, feedback, or just want to compare notes on frontend — email is the best way to reach me.",
  note: "Auckland, New Zealand",
};
