mod commands;
mod config;
mod state;
mod stream;
mod ws;

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
                ws::start_ws_server(ws_state).await;
            });
            tauri::async_runtime::spawn(async move {
                stream::run_poll_loop(poll_state).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::get_ws_url,
            commands::set_observer,
            commands::set_radius_km,
            commands::set_data_mode,
            commands::set_refresh_secs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
