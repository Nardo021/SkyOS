use std::collections::HashMap;

use sky_core::Aircraft;

#[derive(Clone, Default)]
struct StickyFields {
    airline: Option<String>,
    type_name: Option<String>,
    registration: Option<String>,
    origin: Option<String>,
    destination: Option<String>,
    origin_name: Option<String>,
    dest_name: Option<String>,
    origin_lat: Option<f64>,
    origin_lon: Option<f64>,
    dest_lat: Option<f64>,
    dest_lon: Option<f64>,
    last_seen_ms: u64,
}

pub struct StickyMap {
    entries: HashMap<String, StickyFields>,
}

impl StickyMap {
    pub fn new() -> Self {
        Self {
            entries: HashMap::new(),
        }
    }

    pub fn merge(&mut self, ac: &mut Aircraft, now_ms: u64) {
        let prev = self.entries.get(&ac.id).cloned();
        if let Some(p) = prev {
            ac.airline = ac.airline.clone().or(p.airline);
            ac.type_name = ac.type_name.clone().or(p.type_name);
            ac.registration = ac.registration.clone().or(p.registration);
            ac.origin = ac.origin.clone().or(p.origin);
            ac.destination = ac.destination.clone().or(p.destination);
            ac.origin_name = ac.origin_name.clone().or(p.origin_name);
            ac.dest_name = ac.dest_name.clone().or(p.dest_name);
            ac.origin_lat = ac.origin_lat.or(p.origin_lat);
            ac.origin_lon = ac.origin_lon.or(p.origin_lon);
            ac.dest_lat = ac.dest_lat.or(p.dest_lat);
            ac.dest_lon = ac.dest_lon.or(p.dest_lon);
        }
        self.entries.insert(
            ac.id.clone(),
            StickyFields {
                airline: ac.airline.clone(),
                type_name: ac.type_name.clone(),
                registration: ac.registration.clone(),
                origin: ac.origin.clone(),
                destination: ac.destination.clone(),
                origin_name: ac.origin_name.clone(),
                dest_name: ac.dest_name.clone(),
                origin_lat: ac.origin_lat,
                origin_lon: ac.origin_lon,
                dest_lat: ac.dest_lat,
                dest_lon: ac.dest_lon,
                last_seen_ms: now_ms,
            },
        );
    }

    pub fn prune(&mut self, now_ms: u64) {
        const PRUNE_MS: u64 = 600_000;
        self.entries
            .retain(|_, v| now_ms.saturating_sub(v.last_seen_ms) < PRUNE_MS);
    }
}
