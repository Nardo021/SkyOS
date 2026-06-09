use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use parking_lot::RwLock;
use tokio::sync::broadcast;

use crate::config::AppConfig;
use crate::sky_config::{apply_sky_to_app_config, merge_sky_config, new_remote_token, SkyConfig};

pub struct ConfigStore {
    pub sky: RwLock<SkyConfig>,
    defaults: SkyConfig,
    path: PathBuf,
    pub config_tx: broadcast::Sender<String>,
}

impl ConfigStore {
    pub fn new(path: PathBuf, app: &AppConfig) -> Arc<Self> {
        let mut defaults = SkyConfig::default();
        defaults.center_lat = app.observer.lat;
        defaults.center_lon = app.observer.lon;
        defaults.altitude_m = app.observer.altitude_m;
        defaults.radius_km = app.data.radius_km;
        defaults.refresh_secs = app.data.refresh_secs;

        let sky = if let Ok(raw) = std::fs::read_to_string(&path) {
            serde_json::from_str(&raw).unwrap_or_else(|_| defaults.clone())
        } else {
            defaults.clone()
        };

        let (config_tx, _) = broadcast::channel(32);
        Arc::new(Self {
            sky: RwLock::new(sky),
            defaults,
            path,
            config_tx,
        })
    }

    pub fn get(&self) -> SkyConfig {
        self.sky.read().clone()
    }

    pub fn patch(&self, patch: serde_json::Value, app: &RwLock<AppConfig>) -> Result<SkyConfig, String> {
        let base = self.sky.read().clone();
        let mut merged = merge_sky_config(&base, &patch)?;

        if merged.remote_control_enabled && merged.remote_access_token.is_empty() {
            merged.remote_access_token = new_remote_token();
        }

        if merged.radius_km < 1.0 || merged.radius_km > 100.0 {
            return Err("radiusKm must be between 1 and 100".into());
        }
        if merged.refresh_secs < 1 || merged.refresh_secs > 10 {
            return Err("refreshSecs must be between 1 and 10".into());
        }

        *self.sky.write() = merged.clone();
        {
            let mut cfg = app.write();
            apply_sky_to_app_config(&merged, &mut cfg);
        }
        self.schedule_save();
        self.broadcast_config(&merged);
        Ok(merged)
    }

    pub fn reset(&self, app: &RwLock<AppConfig>) -> SkyConfig {
        let mut sky = self.defaults.clone();
        if sky.remote_control_enabled && sky.remote_access_token.is_empty() {
            sky.remote_access_token = new_remote_token();
        }
        *self.sky.write() = sky.clone();
        {
            let mut cfg = app.write();
            apply_sky_to_app_config(&sky, &mut cfg);
        }
        self.schedule_save();
        self.broadcast_config(&sky);
        sky
    }

    pub fn regenerate_token(&self) -> String {
        let token = new_remote_token();
        self.sky.write().remote_access_token = token.clone();
        self.schedule_save();
        let sky = self.sky.read().clone();
        self.broadcast_config(&sky);
        token
    }

    fn broadcast_config(&self, sky: &SkyConfig) {
        if let Ok(json) = serde_json::to_string(&serde_json::json!({
            "type": "config",
            "config": sky,
        })) {
            let _ = self.config_tx.send(json);
        }
    }

    fn schedule_save(&self) {
        let path = self.path.clone();
        let sky = self.sky.read().clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(Duration::from_millis(400)).await;
            if let Some(parent) = path.parent() {
                let _ = tokio::fs::create_dir_all(parent).await;
            }
            if let Ok(json) = serde_json::to_string_pretty(&sky) {
                let _ = tokio::fs::write(path, json).await;
            }
        });
    }

    pub fn config_path() -> PathBuf {
        dirs::data_dir()
            .unwrap_or_else(std::env::temp_dir)
            .join("skyos")
            .join("config.json")
    }
}
