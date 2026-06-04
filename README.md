# SkyOS

Real-time sky dome preview for aircraft — desktop monitor preview (Phase 1).

## Stack

- **Desktop**: Tauri v2
- **UI**: React, TypeScript, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com) (base-nova), Lucide icons
- **3D**: Three.js (`@react-three/fiber`)
- **Backend**: Rust (`sky-core`, `aircraft-provider`)
- **Stream**: WebSocket `ws://127.0.0.1:9731/sky`

## Develop

Requires [Rust](https://rustup.rs/), [pnpm](https://pnpm.io/), and WebView2 (Windows).

```bash
pnpm install
pnpm dev
```

Runs `tauri dev` for the desktop app with hot reload.

## UI components

shadcn/ui lives in `apps/desktop/src/components/ui/`. Add more with:

```bash
cd apps/desktop
pnpm dlx shadcn@latest add <component>
```

## Project layout

See [docs/architecture.md](docs/architecture.md).

## Data

Live mode uses [Airplanes.live](https://airplanes.live/api-guide/) (non-commercial). See [docs/data-sources.md](docs/data-sources.md).

## Sky Dome 3D models

Copy GLB files into `apps/desktop/public/models/` (`airplane.glb` + per-type files like `b738.glb`). See [apps/desktop/public/models/README.md](apps/desktop/public/models/README.md).

## Coordinates

Map math lives in `@skyos/coordinates`: lat/lon → **ENU meters** → Ceiling rectangular or Sky Dome projection. Runways use real `lengthMeters` / `widthMeters` (from OurAirports CSV), not degree-based stretching.
