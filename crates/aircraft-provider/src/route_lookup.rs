use std::collections::HashMap;
use std::sync::LazyLock;
use std::time::{Duration, Instant};

use sky_core::Aircraft;
use tokio::sync::Mutex;

const CACHE_TTL: Duration = Duration::from_secs(3600);
const MAX_NEW_LOOKUPS_PER_POLL: usize = 16;
const API_BASE: &str = "https://api.adsbdb.com/v0";

#[derive(Clone)]
struct CachedRoute {
    fetched_at: Instant,
    origin_icao: Option<String>,
    origin_iata: Option<String>,
    destination_icao: Option<String>,
    destination_iata: Option<String>,
}

static ROUTE_CACHE: LazyLock<Mutex<HashMap<String, CachedRoute>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

#[derive(serde::Deserialize)]
struct AdsbdbResponse {
    response: Option<AdsbdbInner>,
}

#[derive(serde::Deserialize)]
struct AdsbdbInner {
    flightroute: Option<AdsbdbRoute>,
}

#[derive(serde::Deserialize)]
struct AdsbdbRoute {
    origin: Option<AdsbdbAirport>,
    destination: Option<AdsbdbAirport>,
}

#[derive(serde::Deserialize)]
struct AdsbdbAirport {
    iata_code: Option<String>,
    icao_code: Option<String>,
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

fn route_from_airports(origin: Option<AdsbdbAirport>, dest: Option<AdsbdbAirport>) -> CachedRoute {
    let o = origin.unwrap_or(AdsbdbAirport {
        iata_code: None,
        icao_code: None,
    });
    let d = dest.unwrap_or(AdsbdbAirport {
        iata_code: None,
        icao_code: None,
    });
    CachedRoute {
        fetched_at: Instant::now(),
        origin_icao: norm_icao(o.icao_code),
        origin_iata: norm_iata(o.iata_code),
        destination_icao: norm_icao(d.icao_code),
        destination_iata: norm_iata(d.iata_code),
    }
}

async fn fetch_route_by_callsign(callsign: &str) -> Option<CachedRoute> {
    let url = format!("{API_BASE}/callsign/{}", urlencoding_encode(callsign));
    let body = reqwest::get(&url).await.ok()?.text().await.ok()?;
    let parsed: AdsbdbResponse = serde_json::from_str(&body).ok()?;
    let route = parsed.response?.flightroute?;
    let has_data = route.origin.is_some() || route.destination.is_some();
    if !has_data {
        return None;
    }
    Some(route_from_airports(route.origin, route.destination))
}

async fn fetch_route_by_hex(hex: &str) -> Option<CachedRoute> {
    let url = format!("{API_BASE}/hex/{}", urlencoding_encode(hex));
    let body = reqwest::get(&url).await.ok()?.text().await.ok()?;
    let parsed: AdsbdbResponse = serde_json::from_str(&body).ok()?;
    let route = parsed.response?.flightroute?;
    let has_data = route.origin.is_some() || route.destination.is_some();
    if !has_data {
        return None;
    }
    Some(route_from_airports(route.origin, route.destination))
}

fn urlencoding_encode(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
            _ => format!("%{:02X}", c as u8),
        })
        .collect()
}

fn apply_route(ac: &mut Aircraft, route: &CachedRoute) {
    ac.origin_icao = route.origin_icao.clone();
    ac.origin_iata = route.origin_iata.clone();
    ac.destination_icao = route.destination_icao.clone();
    ac.destination_iata = route.destination_iata.clone();
    ac.origin = route.origin_icao.clone();
    ac.destination = route.destination_icao.clone();
}

/// Fill origin/destination from adsbdb.com (cached). Best-effort; never fails the poll loop.
pub async fn enrich_aircraft_routes(aircraft: &mut [Aircraft]) {
    let mut new_lookups = 0usize;

    for ac in aircraft.iter_mut() {
        let callsign = ac
            .callsign
            .as_ref()
            .map(|s| s.trim().to_uppercase())
            .filter(|s| s.len() >= 3);

        let cache_key = callsign
            .clone()
            .unwrap_or_else(|| ac.id.to_uppercase());

        {
            let cache = ROUTE_CACHE.lock().await;
            if let Some(entry) = cache.get(&cache_key) {
                if entry.fetched_at.elapsed() < CACHE_TTL {
                    apply_route(ac, entry);
                    continue;
                }
            }
        }

        if new_lookups >= MAX_NEW_LOOKUPS_PER_POLL {
            continue;
        }

        let fetched = if let Some(cs) = callsign.as_ref() {
            fetch_route_by_callsign(cs).await
        } else {
            fetch_route_by_hex(&ac.id).await
        };

        new_lookups += 1;

        let route = fetched.unwrap_or(CachedRoute {
            fetched_at: Instant::now(),
            origin_icao: None,
            origin_iata: None,
            destination_icao: None,
            destination_iata: None,
        });

        {
            let mut cache = ROUTE_CACHE.lock().await;
            cache.insert(cache_key, route.clone());
        }

        if route.origin_icao.is_some()
            || route.destination_icao.is_some()
            || route.origin_iata.is_some()
            || route.destination_iata.is_some()
        {
            apply_route(ac, &route);
        }
    }
}
