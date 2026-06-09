# SkyOS

Real-time aircraft sky preview for desktop — three view modes for monitor or ceiling projection (Phase 1).

## View modes

| Mode | Renderer | Description |
|------|----------|-------------|
| **Dome** | Three.js (`@skyos/renderer`) | 3D sky dome with GLB aircraft models, trails, horizon |
| **Ceiling** | Skylight Canvas (`@skyos/skylight`) | 2D ceiling projection (map or sky dome), stars, moon, ISS, runway overlay |
| **Map** | MapLibre (`apps/desktop`) | Debug map with aircraft positions |

Ceiling mode is ported from [skylight-main](skylight-main/) — Canvas 2D, altitude-colored glyphs, comet trails, and optional sky layer (stars, sun, moon, planets, satellites). Use the toolbar to switch **穹顶 / 平面** projection, rotate bearing, and mirror X/Y for projector calibration.

## Stack

- **Desktop**: Tauri v2
- **UI**: React, TypeScript, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com) (base-nova), Tabler icons
- **Dome**: Three.js (`@react-three/fiber`)
- **Ceiling**: Canvas 2D ([`@skyos/skylight`](packages/skylight/)) — `astronomy-engine`, `satellite.js`
- **Backend**: Rust (`sky-core`, `aircraft-provider`, `airport-data`)
- **Stream**: WebSocket `ws://127.0.0.1:9731/sky`
- **TLE**: Tauri `get_tle` command (Celestrak cache for ISS / visual satellites)

## Develop

Requires [Rust](https://rustup.rs/) (Cargo on `PATH`), [pnpm](https://pnpm.io/), and WebView2 (Windows).

```bash
pnpm install
pnpm dev
```

Runs `tauri dev` for the desktop app with hot reload.

If you see `program not found: cargo`, install Rust via [rustup](https://rustup.rs/) and open a new terminal.

Frontend-only (no aircraft data):

```bash
cd apps/desktop
pnpm dev
```

## UI components

shadcn/ui lives in `apps/desktop/src/components/ui/`. Add more with:

```bash
cd apps/desktop
pnpm dlx shadcn@latest add <component>
```

## Project layout

```
apps/desktop/          Tauri shell + React UI
packages/types/        Shared TypeScript types
packages/ui/           UI primitives
packages/renderer/     Dome scene + SkylightCeilingView wrapper
packages/skylight/     Skylight ceiling renderer (geo, celestial, Canvas)
packages/coordinates/  Lat/lon → ENU → projection math
crates/                Rust: sky-core, aircraft-provider, airport-data
```

See [docs/architecture.md](docs/architecture.md).

## Data

Live mode uses [Airplanes.live](https://airplanes.live/api-guide/) (non-commercial). See [docs/data-sources.md](docs/data-sources.md).

## Sky Dome 3D models

Copy GLB files into `apps/desktop/public/models/` (`airplane.glb` + per-type files like `b738.glb`). See [apps/desktop/public/models/README.md](apps/desktop/public/models/README.md).

## Coordinates

- **Dome**: `@skyos/coordinates` + `sky-core` — lat/lon → ENU meters → unit sphere; azimuth/elevation UV for legacy helpers
- **Ceiling**: `@skyos/skylight` — **map** (flat ground plan) or **sky** (look-up dome with altitude-aware motion); runways drawn at true geographic position with real `lengthMeters` / `widthMeters` (OurAirports)

## Tests

```bash
pnpm --filter @skyos/renderer test
pnpm --filter @skyos/skylight test
pnpm --filter @skyos/coordinates test
```
