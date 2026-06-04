use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use tower_http::cors::{Any, CorsLayer};

use crate::state::AppState;

pub async fn start_ws_server(state: Arc<AppState>) {
    let port = state.config.read().server.ws_port;
    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    let app = Router::new()
        .route("/sky", get(ws_handler))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state.clone());

    let listener = tokio::net::TcpListener::bind(addr).await;
    match listener {
        Ok(listener) => {
            println!("SkyOS WebSocket listening on ws://127.0.0.1:{port}/sky");
            if let Err(e) = axum::serve(listener, app).await {
                eprintln!("WebSocket server error: {e}");
            }
        }
        Err(e) => eprintln!("Failed to bind WebSocket port {port}: {e}"),
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
    let mut rx = state.tx.subscribe();

    let initial = { state.latest.read().clone() };
    if let Some(snapshot) = initial {
        if let Ok(json) = serde_json::to_string(&snapshot) {
            let _ = sender.send(Message::Text(json.into())).await;
        }
    }

    let mut send_task = tokio::spawn(async move {
        loop {
            match rx.recv().await {
                Ok(json) => {
                    if sender.send(Message::Text(json.into())).await.is_err() {
                        break;
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                Err(_) => break,
            }
        }
    });

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if matches!(msg, Message::Close(_)) {
                break;
            }
        }
    });

    tokio::select! {
        _ = &mut send_task => recv_task.abort(),
        _ = &mut recv_task => send_task.abort(),
    }
}
