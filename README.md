# norberto.work

Personal professional site for Norberto Carosella.

This project is built as a small but production-minded React application: Vite, React, TypeScript, Three.js, a local design-system folder, dark/light themes, and automated tests across unit, component, and e2e layers.

## Stack

- React 19
- TypeScript 5
- Vite 6
- Three.js
- Vitest
- React Testing Library
- Playwright
- Cloudflare Pages

## Project Structure

```txt
src/
  app/             Page composition and layout styles
  components/      Reusable UI components
  content/         Editable page copy and content lists
  design-system/   Theme provider, tokens, base styles, component primitives
  hooks/           Shared React hooks
  terminal/        Testable browser-terminal command engine
  three/           Scene controls and Three.js renderer
  test/            Vitest setup
e2e/               Playwright tests
public/            Cloudflare headers, robots, sitemap
```

## Local Development

```sh
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Quality Checks

```sh
npm run typecheck
npm run test:unit
npm run test:component
npm run test:e2e
npm run build
```

`npm run test` runs the unit and component suites. E2E is kept separate because it starts a browser.

## Cloudflare Pages

Recommended settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

After the Pages project is connected, add `norberto.work` as a custom domain in Cloudflare Pages. Cloudflare will provision HTTPS automatically once DNS is configured.

## Interactive Details

- `Cmd/Ctrl K` opens the on-page command terminal.
- `spin counter`, `spin left`, `spin right`, `spin up`, and `spin down` control the 3D scene.
- `scatter` breaks the cube orbit and lets it rebuild slowly.
- `restore` snaps everything back into orbit.
- The theme toggle switches between dark and light modes and persists the preference locally.
