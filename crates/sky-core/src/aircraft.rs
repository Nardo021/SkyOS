use serde::Deserialize;
use serde::de::Deserializer;

use crate::types::{Aircraft, AircraftSource};

/// ADS-B altitude: feet as number, or `"ground"` for on-ground aircraft.
fn deserialize_altitude<'de, D>(deserializer: D) -> Result<Option<f64>, D::Error>
where
    D: Deserializer<'de>,
{
    let v = Option::<serde_json::Value>::deserialize(deserializer)?;
    Ok(match v {
        None | Some(serde_json::Value::Null) => None,
        Some(serde_json::Value::Number(n)) => n.as_f64(),
        Some(serde_json::Value::String(s)) if s.eq_ignore_ascii_case("ground") => Some(0.0),
        _ => None,
    })
}

#[derive(Debug, Deserialize)]
pub struct AirplanesLiveResponse {
    pub ac: Option<Vec<AirplanesLiveAircraft>>,
}

#[derive(Debug, Deserialize)]
pub struct AirplanesLiveAircraft {
    pub hex: Option<String>,
    pub flight: Option<String>,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    #[serde(default, deserialize_with = "deserialize_altitude")]
    pub alt_baro: Option<f64>,
    #[serde(default, deserialize_with = "deserialize_altitude")]
    pub alt_geom: Option<f64>,
    pub gs: Option<f64>,
    pub track: Option<f64>,
    pub baro_rate: Option<f64>,
    pub seen: Option<f64>,
    /// ICAO type designator (e.g. B738).
    #[serde(default)]
    pub t: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
}

pub fn normalize_airplanes_live(raw: Vec<AirplanesLiveAircraft>) -> Vec<Aircraft> {
    raw.into_iter()
        .filter_map(normalize_one)
        .collect()
}

fn normalize_one(raw: AirplanesLiveAircraft) -> Option<Aircraft> {
    let id = raw.hex?;
    let lat = raw.lat?;
    let lon = raw.lon?;
    let alt = raw.alt_geom.or(raw.alt_baro);
    // Airplanes.live altitudes are in feet (barometric/geometric).
    let altitude_meters = alt.map(|feet| feet * 0.3048);
    let altitude_feet = altitude_meters.map(|m| m / 0.3048);
    let callsign = raw
        .flight
        .map(|f| f.trim().to_string())
        .filter(|s| !s.is_empty());
    let icao_type = raw
        .t
        .map(|t| t.trim().to_string())
        .filter(|s| !s.is_empty());
    let emitter_category = raw
        .category
        .as_deref()
        .and_then(parse_adsb_emitter_category);

    Some(Aircraft {
        id,
        callsign,
        lat,
        lon,
        altitude_meters,
        altitude_feet,
        ground_speed: raw.gs,
        track: raw.track,
        vertical_rate: raw.baro_rate,
        source: AircraftSource::AirplanesLive,
        seen_seconds: raw.seen,
        icao_type,
        emitter_category,
        origin_icao: None,
        origin_iata: None,
        destination_icao: None,
        destination_iata: None,
        origin: None,
        destination: None,
    })
}

/// OpenSky state vector rows (nullable fields per API).
pub fn normalize_opensky_states(
    states: Vec<Option<Vec<serde_json::Value>>>,
) -> Vec<Aircraft> {
    states.into_iter().filter_map(normalize_opensky_one).collect()
}

fn normalize_opensky_one(row: Option<Vec<serde_json::Value>>) -> Option<Aircraft> {
    let row = row?;
    let icao = json_str(&row, 0)?;
    let lat = json_f64(&row, 6)?;
    let lon = json_f64(&row, 5)?;
    let on_ground = json_bool(&row, 8).unwrap_or(false);
    if on_ground {
        return None;
    }
    let callsign = json_str(&row, 1)
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let alt_m = json_f64(&row, 7);
    let altitude_meters = alt_m;
    let altitude_feet = alt_m.map(|m| m / 0.3048);
    let velocity_ms = json_f64(&row, 9);
    let ground_speed = velocity_ms.map(|v| v * 1.94384);
    let track = json_f64(&row, 10);
    let vertical_rate = json_f64(&row, 11);
    let emitter_category = json_u8(&row, 17);

    Some(Aircraft {
        id: icao,
        callsign,
        lat,
        lon,
        altitude_meters,
        altitude_feet,
        ground_speed,
        track,
        vertical_rate,
        source: AircraftSource::Opensky,
        seen_seconds: None,
        icao_type: None,
        emitter_category,
        origin_icao: None,
        origin_iata: None,
        destination_icao: None,
        destination_iata: None,
        origin: None,
        destination: None,
    })
}

fn json_u8(row: &[serde_json::Value], i: usize) -> Option<u8> {
    row.get(i).and_then(|v| match v {
        serde_json::Value::Number(n) => n.as_u64().and_then(|u| u8::try_from(u).ok()),
        serde_json::Value::Null => None,
        _ => None,
    })
}

fn json_str(row: &[serde_json::Value], i: usize) -> Option<String> {
    row.get(i).and_then(|v| match v {
        serde_json::Value::String(s) if !s.is_empty() => Some(s.clone()),
        serde_json::Value::Null => None,
        _ => None,
    })
}

fn json_f64(row: &[serde_json::Value], i: usize) -> Option<f64> {
    row.get(i).and_then(|v| match v {
        serde_json::Value::Number(n) => n.as_f64(),
        serde_json::Value::Null => None,
        _ => None,
    })
}

fn json_bool(row: &[serde_json::Value], i: usize) -> Option<bool> {
    row.get(i).and_then(|v| v.as_bool())
}

/// ADS-B emitter category string (A0–D7) → numeric code (OpenSky / DO-260B).
pub fn parse_adsb_emitter_category(raw: &str) -> Option<u8> {
    let s = raw.trim().to_uppercase();
    let bytes = s.as_bytes();
    if bytes.len() != 2 {
        return None;
    }
    let base = match bytes[0] {
        b'A' => 0,
        b'B' => 8,
        b'C' => 16,
        b'D' => 24,
        _ => return None,
    };
    let sub = match bytes[1] {
        b'0'..=b'7' => (bytes[1] - b'0') as u8,
        _ => return None,
    };
    Some(base + sub)
}

#[cfg(test)]
mod airplanes_live_tests {
    use super::*;

    #[test]
    fn parses_alt_baro_ground_string() {
        let json = r#"{"ac":[{"hex":"abc123","alt_baro":"ground","lat":-33.9,"lon":151.1}]}"#;
        let body: AirplanesLiveResponse = serde_json::from_str(json).unwrap();
        let ac = normalize_airplanes_live(body.ac.unwrap());
        assert_eq!(ac.len(), 1);
        assert_eq!(ac[0].altitude_meters, Some(0.0));
    }

    #[test]
    fn parses_type_and_category() {
        let json = r#"{"ac":[{"hex":"abc123","lat":1.0,"lon":2.0,"t":"B738","category":"A3"}]}"#;
        let body: AirplanesLiveResponse = serde_json::from_str(json).unwrap();
        let ac = normalize_airplanes_live(body.ac.unwrap());
        assert_eq!(ac[0].icao_type.as_deref(), Some("B738"));
        assert_eq!(ac[0].emitter_category, Some(3));
    }
}

#[cfg(test)]
mod emitter_category_tests {
    use super::parse_adsb_emitter_category;

    #[test]
    fn parses_a7_rotorcraft() {
        assert_eq!(parse_adsb_emitter_category("A7"), Some(7));
    }

    #[test]
    fn ignores_invalid() {
        assert_eq!(parse_adsb_emitter_category("X1"), None);
    }
}
