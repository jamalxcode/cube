# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Rubik's Cube 3D** (https://cube.sala.company) is an interactive 3D Rubik's Cube in the browser: free orbiting,
face turns (buttons or U/D/F/B/L/R keys), animated shuffle, auto-solve, hints, undo, timer and move counter. Tech:
React 19 + TypeScript + Three.js, Vite 7, Tailwind CSS 4, shadcn/ui (Radix) components, `wouter` routing, pnpm.
The site is a static SPA; the small Express server in `server/` is only for the optional `pnpm start` production mode
and is not used by the live site.

## Commands

Package manager is pnpm (`packageManager: pnpm@10.4.1`, `pnpm-lock.yaml`; CI uses `pnpm install --frozen-lockfile`).

```bash
pnpm install
pnpm dev             # vite --host (vite.config.ts: port 3000, next free port if busy; root is client/)
pnpm build:ghpages   # GITHUB_PAGES=true vite build -> dist/public  (what CI deploys)
pnpm build           # vite build + esbuild bundle of server/index.ts -> dist/index.js
pnpm start           # NODE_ENV=production node dist/index.js (Express serves dist/public, SPA fallback)
pnpm preview
pnpm check           # tsc --noEmit (the only static check; no ESLint)
pnpm format          # prettier --write .
```

`vitest` is a devDependency but there are no test files and no test script. `pnpm deploy` (gh-pages to a `gh-pages`
branch) exists but is not how the live site deploys. Note the README says the dev server is on port 5173; the config
actually uses 3000.

## Architecture

- `vite.config.ts` – `root: client/`, `base: '/'`, output `dist/public`, aliases `@` -> `client/src`,
  `@shared` -> `shared`, `@assets` -> `attached_assets` (directory not present). `GITHUB_PAGES` is set by
  `build:ghpages` but not read anywhere in the config or source.
- `client/index.html` – entry, Google Fonts (JetBrains Mono, Orbitron, Space Grotesk), `#root`, an Umami analytics tag
  using `%VITE_ANALYTICS_ENDPOINT%` / `%VITE_ANALYTICS_WEBSITE_ID%` env placeholders, and the GoatCounter snippet.
- `client/src/main.tsx` -> `App.tsx` – ErrorBoundary, `ThemeProvider` (default dark; persists `theme` in
  `localStorage`), Sonner toaster, and a `wouter` Router with a **hash-based location hook** (`/` -> `Home`,
  everything else -> `NotFound`).
- `client/src/pages/Home.tsx` – the game UI (controls, stats, keyboard shortcuts).
- `client/src/hooks/useCubeGame.ts` – game state: cube state, move count, timer, history, shuffle/solve/hint/undo.
  Design note: each move is animated on the 3D cubies first, then the logical state is updated; after multi-move
  sequences (shuffle/solve) a `rebuildKey` forces a full 3D rebuild to keep alignment.
- `client/src/components/CubeRenderer.tsx` – Three.js scene, cubie meshes, move animation, mouse/touch orbit.
- `client/src/lib/cubeState.ts` – pure cube model: `CubeState`, `Move` (`U U' U2 …`), `applyMove`, `isSolved`,
  `getInverseMove`, `generateScramble`, etc.
- `client/src/lib/solver.ts` – `CubeSolver` used by the game: **Solve and Hint reverse the recorded move history**
  (with move optimization), not a true state-based solver. A depth-limited `solveCube()` search also exists but is not
  called by the app.
- `client/src/components/ui/` – generated shadcn/ui components (`components.json`); most are unused.
- `server/index.ts` – Express static server with SPA fallback. `shared/const.ts` – leftover template constants.
- `patches/wouter@3.7.1.patch` – pnpm patched dependency (declared in `package.json`). `ideas.md` – design brainstorm
  (the "Neon Arcade" direction is referenced in code comments).

## Deployment

`.github/workflows/deploy.yml` runs on push to `main` (and manual dispatch): Node 20, installs pnpm 10.4.1,
`pnpm install --frozen-lockfile`, `pnpm run build:ghpages`, uploads `dist/public` and deploys via GitHub Pages
Actions. **Pushing to `main` deploys live.** The custom domain comes from `client/public/CNAME`
(`cube.sala.company`), and `client/public/.nojekyll` is copied into the build output. Keep `base: '/'` for the custom
domain. `DEPLOY.md` and parts of the README are stale (they describe a `/cube/` base path and the
`jamalxcode.github.io/cube/` URL).

## Conventions / gotchas

- **GoatCounter** analytics snippet at the end of `client/index.html` (endpoint
  `https://salacompany.goatcounter.com/count`, skipped on localhost, paths prefixed with `location.host`) – keep it
  intact. The Umami tag depends on env vars that are not defined in the CI build.
- Keep the lockfile in sync (`--frozen-lockfile` fails CI otherwise); use pnpm, not npm.
- Prettier config in `.prettierrc` (double quotes, semicolons, 2 spaces, `arrowParens: avoid`, LF).
- Hash routing is required for GitHub Pages; do not switch to browser-history routing without a 404 fallback.
- `index.html` sets `maximum-scale=1`; the renderer handles touch for orbiting on mobile.
