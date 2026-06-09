use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Observer {
    pub lat: f64,
    pub lon: f64,
    pub altitude_m: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum AircraftSource {
    AirplanesLive,
    Opensky,
    Adsbexchange,
    Mock,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Aircraft {
    pub id: String,
    pub callsign: Option<String>,
    pub lat: f64,
    pub lon: f64,
    pub altitude_meters: Option<f64>,
    pub altitude_feet: Option<f64>,
    pub ground_speed: Option<f64>,
    pub track: Option<f64>,
    pub vertical_rate: Option<f64>,
    pub source: AircraftSource,
    pub seen_seconds: Option<f64>,
    /// ICAO aircraft type designator (e.g. B738), when reported by the feed.
    pub icao_type: Option<String>,
    /// OpenSky emitter category (0–20), when present in state vectors.
    pub emitter_category: Option<u8>,
    /// Departure airport ICAO (4-letter), when known.
    pub origin_icao: Option<String>,
    pub origin_iata: Option<String>,
    /// Arrival airport ICAO (4-letter), when known.
    pub destination_icao: Option<String>,
    pub destination_iata: Option<String>,
    /// Legacy alias for `origin_icao`.
    pub origin: Option<String>,
    /// Legacy alias for `destination_icao`.
    pub destination: Option<String>,
    /// Airline name from static table or adsbdb.
    pub airline: Option<String>,
    /// Human-readable aircraft type (e.g. "Boeing 737-800").
    pub type_name: Option<String>,
    /// Aircraft registration.
    pub registration: Option<String>,
    pub origin_name: Option<String>,
    pub dest_name: Option<String>,
    pub origin_lat: Option<f64>,
    pub origin_lon: Option<f64>,
    pub dest_lat: Option<f64>,
    pub dest_lon: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkyObject {
    pub id: String,
    pub label: String,
    pub azimuth_deg: f64,
    pub elevation_deg: f64,
    pub distance_meters: f64,
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub ceiling_u: f64,
    pub ceiling_v: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunwaySegment {
    pub id: String,
    pub icao: String,
    pub iata: Option<String>,
    pub le_ident: Option<String>,
    pub he_ident: Option<String>,
    pub le_lat: f64,
    pub le_lon: f64,
    pub he_lat: f64,
    pub he_lon: f64,
    pub center_lat: Option<f64>,
    pub center_lon: Option<f64>,
    pub length_meters: Option<f64>,
    pub width_meters: Option<f64>,
    pub heading_deg: Option<f64>,
    pub elevation_m: Option<f64>,
    pub x1: f64,
    pub y1: f64,
    pub z1: f64,
    pub x2: f64,
    pub y2: f64,
    pub z2: f64,
    pub ceiling_u1: f64,
    pub ceiling_v1: f64,
    pub ceiling_u2: f64,
    pub ceiling_v2: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AirportLabel {
    pub icao: String,
    pub iata: Option<String>,
    pub lat: f64,
    pub lon: f64,
    /// Ground distance from observer to airport reference point.
    pub distance_meters: f64,
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub ceiling_u: f64,
    pub ceiling_v: f64,
}
