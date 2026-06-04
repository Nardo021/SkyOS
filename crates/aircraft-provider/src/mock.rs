use std::f64::consts::PI;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use async_trait::async_trait;
use sky_core::{Aircraft, AircraftSource};

use crate::provider::{AircraftProvider, ProviderError};

static TICK: AtomicU64 = AtomicU64::new(0);

pub struct MockProvider;

#[async_trait]
impl AircraftProvider for MockProvider {
    async fn fetch_near(&self, lat: f64, lon: f64, radius_km: f32) -> Result<Vec<Aircraft>, ProviderError> {
        let tick = TICK.fetch_add(1, Ordering::Relaxed);
        let t = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs_f64()
            + tick as f64 * 0.1;

        let count = 8usize;
        let max_deg = (radius_km as f64 / 111.0).min(0.8);

        let aircraft = (0..count)
            .map(|i| {
                let angle = t * 0.05 + (i as f64) * 2.0 * PI / count as f64;
                let dist = max_deg * (0.3 + 0.5 * ((i as f64) / count as f64));
                let ac_lat = lat + dist * angle.cos();
                let ac_lon = lon + dist * angle.sin() / lat.to_radians().cos();
                let alt_ft = 8000.0 + (i as f64) * 1500.0;
                Aircraft {
                    id: format!("mock-{i:02}"),
                    callsign: Some(format!("SKY{:03}", 100 + i)),
                    lat: ac_lat,
                    lon: ac_lon,
                    altitude_meters: Some(alt_ft * 0.3048),
                    altitude_feet: Some(alt_ft),
                    ground_speed: Some(220.0 + i as f64 * 10.0),
                    track: Some((angle.to_degrees() + 90.0) % 360.0),
                    vertical_rate: None,
                    source: AircraftSource::Mock,
                    seen_seconds: Some(1.0),
                    icao_type: Some("B738".into()),
                    emitter_category: None,
                    origin_icao: None,
                    origin_iata: None,
                    destination_icao: None,
                    destination_iata: None,
                    origin: None,
                    destination: None,
                }
            })
            .collect();

        Ok(aircraft)
    }
}
