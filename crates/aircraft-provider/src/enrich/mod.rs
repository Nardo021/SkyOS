mod routes;
mod sticky;
mod tables;

use std::path::Path;
use std::sync::LazyLock;
use std::time::{SystemTime, UNIX_EPOCH};

use sky_core::Aircraft;
use tokio::sync::Mutex;

use routes::{enrich_routes_and_aircraft, set_cache_dir};

pub fn init_cache_dir(base: &Path) {
    set_cache_dir(base);
}

static STICKY: LazyLock<Mutex<sticky::StickyMap>> =
    LazyLock::new(|| Mutex::new(sticky::StickyMap::new()));

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Apply static table lookups, adsbdb enrichment, and sticky merge.
pub async fn enrich_aircraft(aircraft: &mut [Aircraft]) {
    let now = now_ms();

    for ac in aircraft.iter_mut() {
        ac.type_name = ac
            .type_name
            .clone()
            .or_else(|| tables::lookup_type(ac.icao_type.as_deref()));
        ac.airline = ac
            .airline
            .clone()
            .or_else(|| tables::lookup_airline(ac.callsign.as_deref()));
    }

    enrich_routes_and_aircraft(aircraft).await;

    let mut sticky = STICKY.lock().await;
    for ac in aircraft.iter_mut() {
        sticky.merge(ac, now);
    }
    sticky.prune(now);
}
