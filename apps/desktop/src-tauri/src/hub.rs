use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

use crate::geocode;
use crate::state::AppState;

#[derive(Deserialize)]
struct GeocodeQuery {
    q: Option<String>,
}

pub async fn start_server(state: Arc<AppState>) {
    loop {
        let port = state.config.read().server.ws_port;
        let remote = state.sky_store.get().remote_control_enabled;
        let bind_host = if remote { [0, 0, 0, 0] } else { [127, 0, 0, 1] };
        let addr = SocketAddr::from((bind_host, port));

        let control_dir = control_static_dir();
        let mut app = Router::new()
            .route("/sky", get(ws_handler))
            .route("/api/geocode", get(geocode_handler));

        if remote {
            if let Some(dir) = control_dir {
                app = app.nest_service("/control", ServeDir::new(dir));
            }
        }

        let app = app
            .layer(
                CorsLayer::new()
                    .allow_origin(Any)
                    .allow_methods(Any)
                    .allow_headers(Any),
            )
            .with_state(state.clone());

        let listener = match tokio::net::TcpListener::bind(addr).await {
            Ok(l) => l,
            Err(e) => {
                eprintln!("Failed to bind port {port}: {e}");
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                continue;
            }
        };

        println!("SkyOS server listening on {addr}");
        let mut config_rx = state.sky_store.config_tx.subscribe();
        let mut join = tokio::spawn(async move {
            if let Err(e) = axum::serve(listener, app).await {
                eprintln!("Server error: {e}");
            }
        });
        let abort = join.abort_handle();

        loop {
            tokio::select! {
                _ = &mut join => break,
                msg = config_rx.recv() => {
                    if msg.is_ok() && state.sky_store.get().remote_control_enabled != remote {
                        abort.abort();
                        break;
                    }
                }
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    }
}

fn control_static_dir() -> Option<std::path::PathBuf> {
    let manifest = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let dev = manifest.join("../../remote/dist");
    if dev.exists() {
        return Some(dev);
    }
    let resource = manifest.join("resources/control");
    if resource.exists() {
        return Some(resource);
    }
    None
}

async fn geocode_handler(Query(q): Query<GeocodeQuery>) -> impl IntoResponse {
    let Some(query) = q.q.filter(|s| !s.trim().is_empty()) else {
        return (StatusCode::BAD_REQUEST, "missing q").into_response();
    };
    match geocode::resolve_location(&query).await {
        Ok(hit) => (StatusCode::OK, serde_json::to_string(&hit).unwrap_or_default()).into_response(),
        Err(msg) if msg == "no results" => (StatusCode::NOT_FOUND, msg).into_response(),
        Err(msg) => (StatusCode::BAD_GATEWAY, msg).into_response(),
    }
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    let mut snapshot_rx = state.tx.subscribe();
    let mut config_rx = state.sky_store.config_tx.subscribe();

    let mut authenticated = false;
    let mut role = String::from("display");

    loop {
        tokio::select! {
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) {
                            match v.get("type").and_then(|t| t.as_str()) {
                                Some("hello") => {
                                    role = v.get("role").and_then(|r| r.as_str()).unwrap_or("display").to_string();
                                    let token = v.get("token").and_then(|t| t.as_str()).unwrap_or("");
                                    let sky = state.sky_store.get();
                                    let need_token =
                                        sky.remote_control_enabled && role == "control";
                                    if need_token && token != sky.remote_access_token {
                                        let _ = sender.send(Message::Close(None)).await;
                                        break;
                                    }
                                    authenticated = true;
                                    send_initial(&mut sender, &state).await;
                                }
                                Some("patchConfig") if authenticated => {
                                    let sky = state.sky_store.get();
                                    if !sky.config_sync_enabled || role != "control" {
                                        send_config(&mut sender, &sky).await;
                                        continue;
                                    }
                                    if let Some(patch) = v.get("patch") {
                                        let _ = state.sky_store.patch(patch.clone(), &state.config);
                                    }
                                }
                                Some("resetConfig") if authenticated => {
                                    let sky = state.sky_store.get();
                                    if sky.config_sync_enabled && role == "control" {
                                        let _ = state.sky_store.reset(&state.config);
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    _ => {}
                }
            }
            Ok(json) = snapshot_rx.recv() => {
                if authenticated {
                    let _ = sender.send(Message::Text(json.into())).await;
                }
            }
            Ok(json) = config_rx.recv() => {
                if authenticated {
                    let _ = sender.send(Message::Text(json.into())).await;
                }
            }
        }
    }
}

async fn send_initial(sender: &mut futures_util::stream::SplitSink<WebSocket, Message>, state: &Arc<AppState>) {
    let sky = state.sky_store.get();
    send_config(sender, &sky).await;
    let snapshot = state.latest.read().clone();
    if let Some(snapshot) = snapshot {
        if let Ok(json) = serde_json::to_string(&serde_json::json!({
            "type": "snapshot",
            "snapshot": snapshot,
        })) {
            let _ = sender.send(Message::Text(json.into())).await;
        }
    }
    let tles = state.tle_store.get();
    if let Ok(json) = serde_json::to_string(&serde_json::json!({
        "type": "tle",
        "tles": tles,
    })) {
        let _ = sender.send(Message::Text(json.into())).await;
    }
}

async fn send_config(sender: &mut futures_util::stream::SplitSink<WebSocket, Message>, sky: &crate::sky_config::SkyConfig) {
    if let Ok(json) = serde_json::to_string(&serde_json::json!({
        "type": "config",
        "config": sky,
    })) {
        let _ = sender.send(Message::Text(json.into())).await;
    }
}
