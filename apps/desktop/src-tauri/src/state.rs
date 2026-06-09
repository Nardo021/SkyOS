use std::path::PathBuf;
use std::sync::Arc;

use parking_lot::RwLock;
use sky_core::{Aircraft, AirportLabel, Observer, RunwaySegment, SkyObject};
use tokio::sync::broadcast;

use crate::config::AppConfig;
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
    pub latest: RwLock<Option<WsSnapshot>>,
    pub tx: broadcast::Sender<String>,
    pub cache_dir: PathBuf,
    pub tle_store: std::sync::Arc<TleStore>,
}

impl AppState {
    pub fn new(config: AppConfig) -> Arc<Self> {
        let (tx, _) = broadcast::channel(32);
        let cache_dir = std::env::temp_dir().join("skyos");
        let tle_store = TleStore::new(cache_dir.join("tle"));
        Arc::new(Self {
            config: RwLock::new(config),
            latest: RwLock::new(None),
            tx,
            cache_dir: cache_dir.join("ourairports"),
            tle_store,
        })
    }

    pub fn publish(&self, snapshot: WsSnapshot) {
        if let Ok(json) = serde_json::to_string(&snapshot) {
            *self.latest.write() = Some(snapshot);
            let _ = self.tx.send(json);
        }
    }

    pub fn ws_url(&self) -> String {
        let port = self.config.read().server.ws_port;
        format!("ws://127.0.0.1:{port}/sky")
    }
}
