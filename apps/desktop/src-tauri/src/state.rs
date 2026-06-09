use std::path::PathBuf;
use std::sync::Arc;

use parking_lot::RwLock;
use sky_core::{Aircraft, AirportLabel, Observer, RunwaySegment, SkyObject};
use tokio::sync::broadcast;

use crate::config::AppConfig;
use crate::config_store::ConfigStore;
use crate::sky_config::apply_sky_to_app_config;
use crate::tle::TleStore;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WsSnapshot {
    pub observer: Observer,
    pub aircraft: Vec<Aircraft>,
    pub sky_objects: Vec<SkyObject>,
    pub updated_at: u64,
    pub source: String,
    pub error: Option<String>,
    pub aircraft_count: usize,
    pub runways: Vec<RunwaySegment>,
    pub airport_labels: Vec<AirportLabel>,
}

pub struct AppState {
    pub config: RwLock<AppConfig>,
    pub sky_store: std::sync::Arc<ConfigStore>,
    pub latest: RwLock<Option<WsSnapshot>>,
    pub tx: broadcast::Sender<String>,
    pub cache_dir: PathBuf,
    pub tle_store: std::sync::Arc<TleStore>,
}

impl AppState {
    pub fn new(mut config: AppConfig) -> Arc<Self> {
        let (tx, _) = broadcast::channel(32);
        let data_dir = std::env::temp_dir().join("skyos");
        let cache_dir = data_dir.join("ourairports");
        let tle_store = TleStore::new(data_dir.join("tle"));
        let sky_store = ConfigStore::new(ConfigStore::config_path(), &config);
        apply_sky_to_app_config(&sky_store.get(), &mut config);
        Arc::new(Self {
            config: RwLock::new(config),
            sky_store,
            latest: RwLock::new(None),
            tx,
            cache_dir,
            tle_store,
        })
    }

    pub fn publish_snapshot(&self, snapshot: WsSnapshot) {
        if let Ok(json) = serde_json::to_string(&serde_json::json!({
            "type": "snapshot",
            "snapshot": snapshot,
        })) {
            *self.latest.write() = Some(snapshot);
            let _ = self.tx.send(json);
        }
    }

    pub fn ws_url(&self) -> String {
        let port = self.config.read().server.ws_port;
        let remote = self.sky_store.get().remote_control_enabled;
        if remote {
            format!("ws://0.0.0.0:{port}/sky")
        } else {
            format!("ws://127.0.0.1:{port}/sky")
        }
    }

    pub fn lan_http_url(&self) -> Option<String> {
        if !self.sky_store.get().remote_control_enabled {
            return None;
        }
        let port = self.config.read().server.ws_port;
        local_ip_address::local_ip()
            .ok()
            .map(|ip| format!("http://{ip}:{port}/control/"))
    }
}
