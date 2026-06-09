use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use sky_core::Aircraft;
use tokio::sync::Mutex;

const API_BASE: &str = "https://api.adsbdb.com/v0";
const CACHE_TTL: Duration = Duration::from_secs(12 * 3600);
const MAX_NEW_LOOKUPS_PER_POLL: usize = 16;

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct RouteInfo {
    pub airline: Option<String>,
    pub origin_icao: Option<String>,
    pub origin_iata: Option<String>,
    pub destination_icao: Option<String>,
    pub destination_iata: Option<String>,
    pub origin_name: Option<String>,
    pub dest_name: Option<String>,
    pub origin_lat: Option<f64>,
    pub origin_lon: Option<f64>,
    pub dest_lat: Option<f64>,
    pub dest_lon: Option<f64>,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct AircraftInfo {
    pub type_name: Option<String>,
    pub registration: Option<String>,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
struct CacheEntry<T> {
    data: Option<T>,
    at_ms: u64,
}

#[derive(Default, serde::Serialize, serde::Deserialize)]
struct CacheFile {
    routes: HashMap<String, CacheEntry<RouteInfo>>,
    aircraft: HashMap<String, CacheEntry<AircraftInfo>>,
}

struct Enricher {
    cache_path: PathBuf,
    cache: CacheFile,
    dirty: bool,
    loaded: bool,
}

static ENRICHER: LazyLock<Mutex<Enricher>> = LazyLock::new(|| {
    Mutex::new(Enricher {
        cache_path: default_cache_path(),
        cache: CacheFile::default(),
        dirty: false,
        loaded: false,
    })
});

fn default_cache_path() -> PathBuf {
    std::env::temp_dir().join("skyos").join("adsbdb-cache.json")
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn fresh<T>(entry: Option<&CacheEntry<T>>, now_ms: u64) -> bool {
    entry
        .map(|e| now_ms.saturating_sub(e.at_ms) < CACHE_TTL.as_millis() as u64)
        .unwrap_or(false)
}

#[derive(serde::Deserialize)]
struct AdsbdbResponse {
    response: Option<AdsbdbInner>,
}

#[derive(serde::Deserialize)]
struct AdsbdbInner {
    flightroute: Option<AdsbdbRoute>,
    aircraft: Option<AdsbdbAircraft>,
}

#[derive(serde::Deserialize)]
struct AdsbdbRoute {
    airline: Option<AdsbdbAirline>,
    origin: Option<AdsbdbAirport>,
    destination: Option<AdsbdbAirport>,
}

#[derive(serde::Deserialize)]
struct AdsbdbAirline {
    name: Option<String>,
}

#[derive(serde::Deserialize)]
struct AdsbdbAirport {
    iata_code: Option<String>,
    icao_code: Option<String>,
    municipality: Option<String>,
    latitude: Option<f64>,
    longitude: Option<f64>,
}

#[derive(serde::Deserialize)]
struct AdsbdbAircraft {
    manufacturer: Option<String>,
    #[serde(rename = "type")]
    type_field: Option<String>,
    registration: Option<String>,
}

fn norm_icao(s: Option<String>) -> Option<String> {
    let t = s?.trim().to_uppercase();
    if t.len() >= 4 {
        Some(t.chars().take(4).collect())
    } else if t.len() >= 3 {
        Some(t)
    } else {
        None
    }
}

fn norm_iata(s: Option<String>) -> Option<String> {
    let t = s?.trim().to_uppercase();
    if t.len() >= 3 {
        Some(t.chars().take(3).collect())
    } else {
        None
    }
}

fn route_from_api(route: AdsbdbRoute) -> RouteInfo {
    let origin = route.origin.unwrap_or(AdsbdbAirport {
        iata_code: None,
        icao_code: None,
        municipality: None,
        latitude: None,
        longitude: None,
    });
    let dest = route.destination.unwrap_or(AdsbdbAirport {
        iata_code: None,
        icao_code: None,
        municipality: None,
        latitude: None,
        longitude: None,
    });
    RouteInfo {
        airline: route.airline.and_then(|a| a.name),
        origin_icao: norm_icao(origin.icao_code),
        origin_iata: norm_iata(origin.iata_code),
        destination_icao: norm_icao(dest.icao_code),
        destination_iata: norm_iata(dest.iata_code),
        origin_name: origin.municipality,
        dest_name: dest.municipality,
        origin_lat: origin.latitude,
        origin_lon: origin.longitude,
        dest_lat: dest.latitude,
        dest_lon: dest.longitude,
    }
}

fn aircraft_from_api(a: AdsbdbAircraft) -> AircraftInfo {
    let type_name = match (a.manufacturer.as_deref(), a.type_field.as_deref()) {
        (Some(m), Some(t)) if !m.is_empty() && !t.is_empty() => Some(format!("{m} {t}")),
        (_, Some(t)) => Some(t.to_string()),
        _ => None,
    };
    AircraftInfo {
        type_name,
        registration: a.registration,
    }
}

fn encode_path(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
            _ => format!("%{:02X}", c as u8),
        })
        .collect()
}

async fn fetch_route_by_callsign(callsign: &str) -> Option<RouteInfo> {
    let url = format!("{API_BASE}/callsign/{}", encode_path(callsign));
    let body = reqwest::get(&url).await.ok()?.text().await.ok()?;
    let parsed: AdsbdbResponse = serde_json::from_str(&body).ok()?;
    let route = parsed.response?.flightroute?;
    Some(route_from_api(route))
}

async fn fetch_route_by_hex(hex: &str) -> Option<RouteInfo> {
    let url = format!("{API_BASE}/hex/{}", encode_path(hex));
    let body = reqwest::get(&url).await.ok()?.text().await.ok()?;
    let parsed: AdsbdbResponse = serde_json::from_str(&body).ok()?;
    let route = parsed.response?.flightroute?;
    Some(route_from_api(route))
}

async fn fetch_aircraft(hex: &str) -> Option<AircraftInfo> {
    let url = format!("{API_BASE}/aircraft/{}", encode_path(hex));
    let body = reqwest::get(&url).await.ok()?.text().await.ok()?;
    let parsed: AdsbdbResponse = serde_json::from_str(&body).ok()?;
    let ac = parsed.response?.aircraft?;
    Some(aircraft_from_api(ac))
}

impl Enricher {
    async fn ensure_loaded(&mut self) {
        if self.loaded {
            return;
        }
        self.loaded = true;
        if let Ok(raw) = tokio::fs::read_to_string(&self.cache_path).await {
            if let Ok(parsed) = serde_json::from_str::<CacheFile>(&raw) {
                self.cache = parsed;
            }
        }
    }

    async fn flush(&mut self) {
        if !self.dirty {
            return;
        }
        self.dirty = false;
        if let Some(parent) = self.cache_path.parent() {
            let _ = tokio::fs::create_dir_all(parent).await;
        }
        if let Ok(json) = serde_json::to_string(&self.cache) {
            if tokio::fs::write(&self.cache_path, json).await.is_err() {
                self.dirty = true;
            }
        }
    }

    fn apply_route(ac: &mut Aircraft, route: &RouteInfo) {
        ac.airline = ac.airline.clone().or(route.airline.clone());
        ac.origin_icao = ac.origin_icao.clone().or(route.origin_icao.clone());
        ac.origin_iata = ac.origin_iata.clone().or(route.origin_iata.clone());
        ac.destination_icao = ac
            .destination_icao
            .clone()
            .or(route.destination_icao.clone());
        ac.destination_iata = ac
            .destination_iata
            .clone()
            .or(route.destination_iata.clone());
        ac.origin = ac.origin.clone().or(route.origin_icao.clone());
        ac.destination = ac.destination.clone().or(route.destination_icao.clone());
        ac.origin_name = ac.origin_name.clone().or(route.origin_name.clone());
        ac.dest_name = ac.dest_name.clone().or(route.dest_name.clone());
        ac.origin_lat = ac.origin_lat.or(route.origin_lat);
        ac.origin_lon = ac.origin_lon.or(route.origin_lon);
        ac.dest_lat = ac.dest_lat.or(route.dest_lat);
        ac.dest_lon = ac.dest_lon.or(route.dest_lon);
    }

    fn apply_aircraft_info(ac: &mut Aircraft, info: &AircraftInfo) {
        ac.type_name = ac.type_name.clone().or(info.type_name.clone());
        ac.registration = ac.registration.clone().or(info.registration.clone());
    }
}

pub async fn enrich_routes_and_aircraft(aircraft: &mut [Aircraft]) {
    let now = now_ms();
    let mut enricher = ENRICHER.lock().await;
    enricher.ensure_loaded().await;

    let mut new_lookups = 0usize;

    for ac in aircraft.iter_mut() {
        let callsign = ac
            .callsign
            .as_ref()
            .map(|s| s.trim().to_uppercase())
            .filter(|s| s.len() >= 3);
        let hex = ac.id.to_uppercase();
        let route_key = callsign.clone().unwrap_or_else(|| hex.clone());

        if let Some(entry) = enricher.cache.aircraft.get(&hex) {
            if fresh(Some(entry), now) {
                if let Some(ref info) = entry.data {
                    Enricher::apply_aircraft_info(ac, info);
                }
            }
        }

        if let Some(entry) = enricher.cache.routes.get(&route_key) {
            if fresh(Some(entry), now) {
                if let Some(ref route) = entry.data {
                    Enricher::apply_route(ac, route);
                }
            }
        }

        let needs_route = enricher
            .cache
            .routes
            .get(&route_key)
            .is_none_or(|e| !fresh(Some(e), now));
        if needs_route && new_lookups < MAX_NEW_LOOKUPS_PER_POLL {
            let route_result = if let Some(cs) = callsign.as_ref() {
                fetch_route_by_callsign(cs).await
            } else {
                fetch_route_by_hex(&hex).await
            };
            enricher.cache.routes.insert(
                route_key,
                CacheEntry {
                    data: route_result.clone(),
                    at_ms: now,
                },
            );
            enricher.dirty = true;
            if let Some(route) = route_result {
                Enricher::apply_route(ac, &route);
            }
            new_lookups += 1;
        }

        let needs_aircraft = enricher
            .cache
            .aircraft
            .get(&hex)
            .is_none_or(|e| !fresh(Some(e), now));
        if needs_aircraft && new_lookups < MAX_NEW_LOOKUPS_PER_POLL {
            let ac_result = fetch_aircraft(&hex).await;
            enricher.cache.aircraft.insert(
                hex,
                CacheEntry {
                    data: ac_result.clone(),
                    at_ms: now,
                },
            );
            enricher.dirty = true;
            if let Some(info) = ac_result {
                Enricher::apply_aircraft_info(ac, &info);
            }
            new_lookups += 1;
        }
    }

    enricher.flush().await;
}

pub fn set_cache_dir(base: &Path) {
    if let Ok(mut guard) = ENRICHER.try_lock() {
        guard.cache_path = base.join("adsbdb-cache.json");
        guard.loaded = false;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn route_from_api_parses_municipality() {
        let route = route_from_api(AdsbdbRoute {
            airline: Some(AdsbdbAirline {
                name: Some("Qantas".into()),
            }),
            origin: Some(AdsbdbAirport {
                iata_code: Some("SYD".into()),
                icao_code: Some("YSSY".into()),
                municipality: Some("Sydney".into()),
                latitude: Some(-33.9),
                longitude: Some(151.2),
            }),
            destination: Some(AdsbdbAirport {
                iata_code: Some("LAX".into()),
                icao_code: Some("KLAX".into()),
                municipality: Some("Los Angeles".into()),
                latitude: Some(33.9),
                longitude: Some(-118.4),
            }),
        });
        assert_eq!(route.dest_name.as_deref(), Some("Los Angeles"));
        assert_eq!(route.dest_lat, Some(33.9));
    }
}
