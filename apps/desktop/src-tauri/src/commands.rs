use std::sync::Arc;

use serde::Serialize;
use tauri::State;

use crate::config::{AppConfig, ObserverConfig};
use crate::sky_config::SkyConfig;
use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigResponse {
    pub config: AppConfig,
    pub ws_url: String,
}

#[tauri::command]
pub fn get_config(state: State<'_, Arc<AppState>>) -> ConfigResponse {
    let config = state.config.read().clone();
    ConfigResponse {
        ws_url: state.ws_url(),
        config,
    }
}

#[tauri::command]
pub fn get_ws_url(state: State<'_, Arc<AppState>>) -> String {
    state.ws_url()
}

#[tauri::command]
pub fn set_observer(
    lat: f64,
    lon: f64,
    altitude_m: f64,
    state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    let mut cfg = state.config.write();
    cfg.observer = ObserverConfig {
        lat,
        lon,
        altitude_m,
    };
    Ok(())
}

#[tauri::command]
pub fn set_radius_km(radius_km: f32, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    if radius_km < 1.0 || radius_km > 100.0 {
        return Err("radius_km must be between 1 and 100".into());
    }
    state.config.write().data.radius_km = radius_km;
    Ok(())
}

#[tauri::command]
pub fn set_data_mode(_mode: String, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    state.config.write().data.mode = "live".into();
    Ok(())
}

#[tauri::command]
pub fn get_tle(state: State<'_, Arc<AppState>>) -> Vec<crate::tle::Tle> {
    state.tle_store.get()
}

#[tauri::command]
pub fn set_refresh_secs(refresh_secs: u64, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    if refresh_secs < 1 || refresh_secs > 10 {
        return Err("refresh_secs must be between 1 and 10".into());
    }
    state.config.write().data.refresh_secs = refresh_secs;
    Ok(())
}

#[tauri::command]
pub fn get_sky_config(state: State<'_, Arc<AppState>>) -> SkyConfig {
    state.sky_store.get()
}

#[tauri::command]
pub fn patch_sky_config(
    patch: serde_json::Value,
    state: State<'_, Arc<AppState>>,
) -> Result<SkyConfig, String> {
    state.sky_store.patch(patch, &state.config)
}

#[tauri::command]
pub fn reset_sky_config(state: State<'_, Arc<AppState>>) -> SkyConfig {
    state.sky_store.reset(&state.config)
}

#[tauri::command]
pub fn regenerate_remote_token(state: State<'_, Arc<AppState>>) -> String {
    state.sky_store.regenerate_token()
}

#[tauri::command]
pub fn get_lan_http_url(state: State<'_, Arc<AppState>>) -> Option<String> {
    state.lan_http_url()
}
