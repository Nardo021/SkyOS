# Data Sources

## Priority

1. **Airplanes.live** — `GET https://api.airplanes.live/v2/point/{lat}/{lon}/{radius_nm}`
2. **OpenSky** — automatic fallback via `GET https://opensky-network.org/api/states/all?lamin=…&lomin=…&lamax=…&lomax=…`
3. **ADS-B Exchange** (Phase 3+) — API key / subscription

## Airplanes.live

- Non-commercial use; no SLA
- Rate limit: **1 request / second**
- Radius parameter is in **nautical miles** (max 250)
- SkyOS UI uses km; backend converts: `nm = ceil(km / 1.852)`

## Live fallback

When Live mode is on, SkyOS calls Airplanes.live first. If the response is empty or fails, it queries OpenSky with a WGS84 bounding box derived from observer position and radius (km).

## OpenSky

- Altitude in state vectors is **meters** (barometric)
- Velocity in state vectors is **m/s** (converted to knots in SkyOS)
- Anonymous rate limit: ~10s between `/states/all` requests (5s app refresh may hit limits occasionally)

## Mock mode

Generates 8 aircraft orbiting the observer for UI and algorithm testing without network calls.

## Altitude

Airplanes.live `alt_baro` / `alt_geom` are treated as **feet** and converted to meters in `sky-core`.

## Sky Dome 3D aircraft models

GLB files are **bundled locally** under `apps/desktop/public/models/` (served as `/models/<key>.glb`). Sky Dome picks a model from ADS-B: Airplanes.live **`t`** (ICAO type, e.g. `B738` → `b738.glb`), else **`category`** / OpenSky emitter category, else **`airplane.glb`**. Missing GLB files also fall back to `airplane.glb`. See `apps/desktop/public/models/README.md` for filenames.

Each aircraft is tinted by altitude (or selection) using instanced vertex colors — models are not rendered as flat black silhouettes.
