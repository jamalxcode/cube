# 🎮 Rubik's Cube 3D Interactive

A fully interactive 3D Rubik's Cube web application built with React, Three.js, and TypeScript. Manipulate, shuffle, solve, and get hints — all in your browser.

🌐 **Live:** [cube.sala.company](https://cube.sala.company)

## Features

- **3D Interactive Cube** — Rotate and inspect the cube freely in 3D space
- **Face Rotations** — Turn any face clockwise or counter-clockwise using intuitive visual buttons
- **Shuffle** — Randomly scramble the cube with animated moves
- **Auto-Solve** — Solves the cube from any state with step-by-step animation
- **Hints** — Get the next optimal move when you're stuck
- **Undo** — Step back through your move history
- **Timer & Move Counter** — Track your solve time and move count
- **Keyboard Shortcuts** — U/D/F/B/L/R for face turns, Space for shuffle, S for solve, H for hint

## Tech Stack

- **React 19** — UI framework
- **Three.js** — WebGL-based 3D rendering
- **TypeScript** — Type-safe codebase
- **Vite 7** — Fast build tool and dev server
- **Tailwind CSS** — Styling

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
git clone https://github.com/jamalxcode/cube.git
cd cube
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Automatic Deployment (Recommended)

1. Push your code to the `main` branch
2. Go to your repo **Settings → Pages → Source** and select **GitHub Actions**
3. Every push to `main` will automatically build and deploy

Your site will be live at: `https://jamalxcode.github.io/cube/`

### Manual Deployment

```bash
pnpm build:ghpages
pnpm deploy
```

### Custom Domain

To use a custom domain like `cube.sala.company`:

1. Go to your repo **Settings → Pages → Custom domain**
2. Enter `cube.sala.company` and save
3. Add a CNAME record in your DNS provider:
   - **Type:** CNAME
   - **Name:** cube
   - **Value:** jamalxcode.github.io
4. Wait a few minutes for DNS propagation
5. Enable "Enforce HTTPS" in GitHub Pages settings

## Controls

| Action | Button | Keyboard |
|--------|--------|----------|
| Rotate Right CW | 🔄 Right button | R |
| Rotate Left CW | 🔄 Left button | L |
| Rotate Up CW | 🔄 Up button | U |
| Rotate Down CW | 🔄 Down button | D |
| Rotate Front CW | 🔄 Front button | F |
| Rotate Back CW | 🔄 Back button | B |
| Shuffle | Shuffle button | Space |
| Solve | Solve button | S |
| Hint | Hint button | H |
| Reset | Reset button | Esc |
| Orbit Cube | Click + Drag | — |

## License

MIT

## Author

[@jamalxcode](https://github.com/jamalxcode)
