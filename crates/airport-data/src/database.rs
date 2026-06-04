use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use parking_lot::RwLock;
use sky_core::haversine_distance_m;
use thiserror::Error;

const AIRPORTS_URL: &str = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const RUNWAYS_URL: &str = "https://davidmegginson.github.io/ourairports-data/runways.csv";

static DB: RwLock<Option<Arc<AirportDatabase>>> = RwLock::new(None);

#[derive(Debug, Error)]
pub enum DatabaseError {
    #[error("HTTP: {0}")]
    Http(#[from] reqwest::Error),
    #[error("CSV: {0}")]
    Csv(#[from] csv::Error),
    #[error("IO: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Clone)]
pub struct AirportMeta {
    pub ident: String,
    pub iata: Option<String>,
    pub lat: f64,
    pub lon: f64,
    pub elevation_m: f64,
}

#[derive(Clone)]
pub struct RunwayRecord {
    pub airport_ident: String,
    pub le_ident: Option<String>,
    pub he_ident: Option<String>,
    pub le_lat: f64,
    pub le_lon: f64,
    pub he_lat: f64,
    pub he_lon: f64,
    pub length_meters: f64,
    pub width_meters: f64,
    pub heading_deg: f64,
}

pub struct AirportDatabase {
    airports: HashMap<String, AirportMeta>,
    runways: Vec<RunwayRecord>,
}

impl AirportDatabase {
    pub fn airports_near(&self, lat: f64, lon: f64, radius_km: f32) -> Vec<AirportMeta> {
        let r_m = f64::from(radius_km) * 1000.0;
        self.airports
            .values()
            .filter(|a| haversine_distance_m(lat, lon, a.lat, a.lon) <= r_m)
            .cloned()
            .collect()
    }

    pub fn runways_for_airport(&self, ident: &str) -> Vec<&RunwayRecord> {
        self.runways
            .iter()
            .filter(|r| r.airport_ident == ident)
            .collect()
    }
}

pub async fn ensure_database(cache_dir: &Path) -> Result<Arc<AirportDatabase>, DatabaseError> {
    if let Some(db) = DB.read().as_ref() {
        return Ok(Arc::clone(db));
    }

    let db = Arc::new(load_or_fetch(cache_dir).await?);
    *DB.write() = Some(Arc::clone(&db));
    Ok(db)
}

async fn load_or_fetch(cache_dir: &Path) -> Result<AirportDatabase, DatabaseError> {
    std::fs::create_dir_all(cache_dir)?;
    let airports_path = cache_dir.join("airports.csv");
    let runways_path = cache_dir.join("runways.csv");

    if !airports_path.exists() || !runways_path.exists() {
        download_file(AIRPORTS_URL, &airports_path).await?;
        download_file(RUNWAYS_URL, &runways_path).await?;
    }

    parse_database(&airports_path, &runways_path)
}

async fn download_file(url: &str, path: &PathBuf) -> Result<(), DatabaseError> {
    let client = reqwest::Client::builder()
        .user_agent("SkyOS/0.1 (airport-data; non-commercial)")
        .build()?;
    let bytes = client.get(url).send().await?.error_for_status()?.bytes().await?;
    std::fs::write(path, &bytes)?;
    Ok(())
}

fn parse_database(
    airports_path: &Path,
    runways_path: &Path,
) -> Result<AirportDatabase, DatabaseError> {
    let mut airports: HashMap<String, AirportMeta> = HashMap::new();

    let mut rdr = csv::Reader::from_path(airports_path)?;
    let airport_headers: Vec<String> = rdr.headers()?.iter().map(|s| s.to_string()).collect();
    for row in rdr.records() {
        let row = row?;
        let ident = field(&row, &airport_headers, "ident");
        let Some(ident) = ident.filter(|s| s.len() >= 3) else {
            continue;
        };
        let airport_type = field(&row, &airport_headers, "type").unwrap_or_default();
        if !matches!(
            airport_type.as_str(),
            "large_airport" | "medium_airport" | "small_airport"
        ) {
            continue;
        }
        let lat: f64 = match field(&row, &airport_headers, "latitude_deg").and_then(|s| s.parse().ok())
        {
            Some(v) => v,
            None => continue,
        };
        let lon: f64 = match field(&row, &airport_headers, "longitude_deg").and_then(|s| s.parse().ok())
        {
            Some(v) => v,
            None => continue,
        };
        let elev_ft: f64 = field(&row, &airport_headers, "elevation_ft")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0);
        let iata = field(&row, &airport_headers, "iata_code").filter(|s| s.len() == 3);

        airports.insert(
            ident.clone(),
            AirportMeta {
                ident,
                iata,
                lat,
                lon,
                elevation_m: elev_ft * 0.3048,
            },
        );
    }

    let mut runways = Vec::new();
    let mut rdr = csv::Reader::from_path(runways_path)?;
    let runway_headers: Vec<String> = rdr.headers()?.iter().map(|s| s.to_string()).collect();
    for row in rdr.records() {
        let row = row?;
        let airport_ident = match field(&row, &runway_headers, "airport_ident") {
            Some(s) => s,
            None => continue,
        };
        if !airports.contains_key(&airport_ident) {
            continue;
        }
        let closed = field(&row, &runway_headers, "closed").unwrap_or_default();
        if closed == "1" {
            continue;
        }
        let le_lat: f64 =
            match field(&row, &runway_headers, "le_latitude_deg").and_then(|s| s.parse().ok()) {
                Some(v) => v,
                None => continue,
            };
        let le_lon: f64 =
            match field(&row, &runway_headers, "le_longitude_deg").and_then(|s| s.parse().ok()) {
                Some(v) => v,
                None => continue,
            };
        let he_lat: f64 =
            match field(&row, &runway_headers, "he_latitude_deg").and_then(|s| s.parse().ok()) {
                Some(v) => v,
                None => continue,
            };
        let he_lon: f64 =
            match field(&row, &runway_headers, "he_longitude_deg").and_then(|s| s.parse().ok()) {
                Some(v) => v,
                None => continue,
            };

        let le_ident = field(&row, &runway_headers, "le_ident");
        let he_ident = field(&row, &runway_headers, "he_ident");

        let length_ft: f64 = field(&row, &runway_headers, "length_ft")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0);
        let width_ft: f64 = field(&row, &runway_headers, "width_ft")
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0);
        let mut length_meters = length_ft * 0.3048;
        let mut width_meters = width_ft * 0.3048;
        if width_meters < 1.0 {
            width_meters = 45.0;
        }
        if length_meters < 1.0 {
            length_meters = sky_core::haversine_distance_m(le_lat, le_lon, he_lat, he_lon);
        }

        let heading_deg = field(&row, &runway_headers, "le_heading_degT")
            .and_then(|s| s.parse().ok())
            .unwrap_or_else(|| {
                sky_core::bearing_deg(le_lat, le_lon, he_lat, he_lon)
            });

        runways.push(RunwayRecord {
            airport_ident,
            le_ident,
            he_ident,
            le_lat,
            le_lon,
            he_lat,
            he_lon,
            length_meters,
            width_meters,
            heading_deg,
        });
    }

    Ok(AirportDatabase { airports, runways })
}

fn field(row: &csv::StringRecord, headers: &[String], name: &str) -> Option<String> {
    let idx = headers.iter().position(|h| h == name)?;
    let v = row.get(idx)?.trim();
    if v.is_empty() {
        None
    } else {
        Some(v.to_string())
    }
}
