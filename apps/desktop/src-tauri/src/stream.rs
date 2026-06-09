use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use aircraft_provider::{enrich_aircraft, fetch_live_with_fallback};
use airport_data::runways_for_observer;
use sky_core::aircraft_list_to_sky_objects;

use crate::state::{AppState, WsSnapshot};

/// How often to reload runway/airport geometry (expensive).
const RUNWAY_REFRESH_SECS: u64 = 45;

#[derive(Clone, Copy, PartialEq, Eq)]
struct AirportCacheKey {
    lat_e4: i64,
    lon_e4: i64,
    radius_e0: u32,
}

impl AirportCacheKey {
    fn from_observer(observer: sky_core::Observer, radius_km: f32) -> Self {
        Self {
            lat_e4: (observer.lat * 10_000.0).round() as i64,
            lon_e4: (observer.lon * 10_000.0).round() as i64,
            radius_e0: (radius_km * 10.0).round() as u32,
        }
    }
}

pub async fn run_poll_loop(state: Arc<AppState>) {
    let mut cached_runways: Vec<sky_core::RunwaySegment> = Vec::new();
    let mut cached_labels: Vec<sky_core::AirportLabel> = Vec::new();
    let mut airport_key: Option<AirportCacheKey> = None;
    let mut last_runway_fetch = Instant::now() - Duration::from_secs(RUNWAY_REFRESH_SECS);

    loop {
        let (radius_km, refresh_secs, observer) = {
            let cfg = state.config.read();
            (
                cfg.data.radius_km,
                cfg.data.refresh_secs,
                sky_core::Observer::from(cfg.observer.clone()),
            )
        };
        let cache_dir = state.cache_dir.clone();
        let key = AirportCacheKey::from_observer(observer, radius_km);

        let need_runways = airport_key != Some(key)
            || last_runway_fetch.elapsed() >= Duration::from_secs(RUNWAY_REFRESH_SECS);

        if need_runways {
            let (runways, labels) =
                runways_for_observer(&cache_dir, observer, radius_km).await;
            cached_runways = runways;
            cached_labels = labels;
            airport_key = Some(key);
            last_runway_fetch = Instant::now();
        }

        let snapshot = fetch_aircraft_snapshot(
            observer,
            radius_km,
            &cached_runways,
            &cached_labels,
            &state.cache_dir.parent().unwrap_or(&state.cache_dir),
        )
        .await;
        state.publish_snapshot(snapshot);

        tokio::time::sleep(Duration::from_secs(refresh_secs.max(1))).await;
    }
}

async fn fetch_aircraft_snapshot(
    observer: sky_core::Observer,
    radius_km: f32,
    runways: &[sky_core::RunwaySegment],
    airport_labels: &[sky_core::AirportLabel],
    cache_base: &std::path::Path,
) -> WsSnapshot {
    aircraft_provider::init_cache_dir(cache_base);

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let (mut aircraft, source, error) =
        fetch_live_with_fallback(observer.lat, observer.lon, radius_km).await;

    enrich_aircraft(&mut aircraft).await;

    let sky_objects = aircraft_list_to_sky_objects(observer, &aircraft);
    let aircraft_count = aircraft.len();

    WsSnapshot {
        observer,
        aircraft,
        sky_objects,
        updated_at: now,
        source,
        error,
        aircraft_count,
        runways: runways.to_vec(),
        airport_labels: airport_labels.to_vec(),
    }
}
