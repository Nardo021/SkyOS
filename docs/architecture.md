# SkyOS Architecture

## Overview

SkyOS Desktop Preview streams normalized aircraft data from a Rust backend to a React + Three.js frontend over a local WebSocket.

## Coordinate system (Three.js)

- **Y** = zenith (up)
- **North** = **−Z**
- **East** = **+X**
- **Azimuth** = 0° north, 90° east (clockwise)
- **Elevation** = 0° horizon, 90° zenith

Sky dome unit position:

```
x = cos(el) * sin(az)
y = sin(el)
z = -cos(el) * cos(az)
```

Ceiling projection maps azimuth/elevation to UV (0–1), zenith at center.

## Crates

| Crate | Role |
|-------|------|
| `sky-core` | Geo, normalization, `SkyObject` computation |
| `aircraft-provider` | Mock, Airplanes.live, OpenSky, live fallback chain |
| `storage` | SQLite stub (Phase 3) |

## Data flow

```
Provider → Aircraft[] → sky-core geo → SkyObject[] → WsSnapshot → WebSocket → React
```

## Monorepo

- `apps/desktop` — Tauri shell + UI
- `packages/types` — shared TS types
- `packages/ui` — Tailwind UI primitives
- `packages/renderer` — Three.js, ceiling view, trails, horizon
- Debug map — MapLibre in `apps/desktop` (not in renderer package)
