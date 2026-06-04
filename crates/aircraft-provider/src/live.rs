use sky_core::Aircraft;

use crate::{AirplanesLiveProvider, AircraftProvider, OpenSkyProvider};

/// Airplanes.live first, then OpenSky on empty or error.
pub async fn fetch_live_with_fallback(
    lat: f64,
    lon: f64,
    radius_km: f32,
) -> (Vec<Aircraft>, String, Option<String>) {
    let mut notes = Vec::new();
    let airplanes = AirplanesLiveProvider::default();

    match airplanes.fetch_near(lat, lon, radius_km).await {
        Ok(ac) if !ac.is_empty() => return (ac, "airplanes-live".into(), None),
        Ok(_) => notes.push("airplanes.live returned no aircraft".into()),
        Err(e) => notes.push(format!("airplanes.live: {e}")),
    }

    let opensky = OpenSkyProvider::default();
    match opensky.fetch_near(lat, lon, radius_km).await {
        Ok(ac) if !ac.is_empty() => {
            let note = if notes.is_empty() {
                None
            } else {
                Some(notes.join("; "))
            };
            (ac, "opensky".into(), note)
        }
        Ok(_) => (
            vec![],
            "live".into(),
            Some(format!("{}; opensky: no aircraft", notes.join("; "))),
        ),
        Err(e) => (
            vec![],
            "live".into(),
            Some(format!("{}; opensky: {e}", notes.join("; "))),
        ),
    }
}
