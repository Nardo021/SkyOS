use serde::{Deserialize, Serialize};
use sky_core::Observer;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub observer: ObserverConfig,
    pub data: DataConfig,
    pub server: ServerConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ObserverConfig {
    pub lat: f64,
    pub lon: f64,
    pub altitude_m: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataConfig {
    pub mode: String,
    pub radius_km: f32,
    pub refresh_secs: u64,
    pub provider: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub ws_port: u16,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            observer: ObserverConfig {
                lat: -33.79757042903397,
                lon: 151.1853986392743,
                altitude_m: 25.0,
            },
            data: DataConfig {
                mode: "mock".into(),
                radius_km: 50.0,
                refresh_secs: 1,
                provider: "airplanes-live".into(),
            },
            server: ServerConfig { ws_port: 9731 },
        }
    }
}

impl From<ObserverConfig> for Observer {
    fn from(o: ObserverConfig) -> Self {
        Observer {
            lat: o.lat,
            lon: o.lon,
            altitude_m: o.altitude_m,
        }
    }
}

pub fn load_config() -> AppConfig {
    let default_str = include_str!("../config/default.toml");
    toml::from_str(default_str).unwrap_or_default()
}
