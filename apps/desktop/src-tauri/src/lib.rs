mod commands;
mod config;
mod config_store;
mod geocode;
mod hub;
mod sky_config;
mod state;
mod stream;
mod tle;

use config::load_config;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = load_config();
    let state = AppState::new(config);

    let ws_state = state.clone();
    let poll_state = state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .setup(move |_app| {
            let preload_cache = poll_state.cache_dir.clone();
            tauri::async_runtime::spawn(async move {
                let _ = airport_data::ensure_database(&preload_cache).await;
            });
            tauri::async_runtime::spawn(async move {
                hub::start_server(ws_state).await;
            });
            tauri::async_runtime::spawn(async move {
                stream::run_poll_loop(poll_state).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::get_ws_url,
            commands::get_tle,
            commands::set_observer,
            commands::set_radius_km,
            commands::set_data_mode,
            commands::set_refresh_secs,
            commands::get_sky_config,
            commands::patch_sky_config,
            commands::reset_sky_config,
            commands::regenerate_remote_token,
            commands::get_lan_http_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
