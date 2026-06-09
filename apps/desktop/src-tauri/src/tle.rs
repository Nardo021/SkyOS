use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use parking_lot::RwLock;
use serde::{Deserialize, Serialize};

const DEFAULT_URL: &str =
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle";
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tle {
    pub name: String,
    pub line1: String,
    pub line2: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct TleCache {
    at: u64,
    tles: Vec<Tle>,
}

fn parse_tle(text: &str) -> Vec<Tle> {
    let lines: Vec<&str> = text
        .lines()
        .map(str::trim_end)
        .filter(|l| !l.is_empty())
        .collect();
    let mut out = Vec::new();
    let mut i = 0;
    while i + 1 < lines.len() {
        if lines[i].starts_with('1') && lines[i + 1].starts_with('2') {
            let name = lines
                .get(i.wrapping_sub(1))
                .map(|n| n.trim_start_matches("0 ").trim())
                .filter(|n| !n.starts_with('1') && !n.starts_with('2'))
                .unwrap_or("SAT")
                .to_string();
            out.push(Tle {
                name,
                line1: lines[i].to_string(),
                line2: lines[i + 1].to_string(),
            });
            i += 2;
        } else {
            i += 1;
        }
    }
    out
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::ZERO)
        .as_secs()
}

pub struct TleStore {
    cache_path: PathBuf,
    url: String,
    inner: RwLock<TleCache>,
}

impl TleStore {
    pub fn new(cache_dir: PathBuf) -> Arc<Self> {
        let store = Arc::new(Self {
            cache_path: cache_dir.join("tle-cache.json"),
            url: std::env::var("TLE_URL").unwrap_or_else(|_| DEFAULT_URL.to_string()),
            inner: RwLock::new(TleCache {
                at: 0,
                tles: Vec::new(),
            }),
        });
        store.load_disk();
        let refresh = store.clone();
        tauri::async_runtime::spawn(async move {
            refresh.refresh().await;
            let mut interval = tokio::time::interval(Duration::from_secs(6 * 3600));
            loop {
                interval.tick().await;
                refresh.refresh().await;
            }
        });
        store
    }

    fn load_disk(&self) {
        if let Ok(raw) = std::fs::read_to_string(&self.cache_path) {
            if let Ok(parsed) = serde_json::from_str::<TleCache>(&raw) {
                *self.inner.write() = parsed;
            }
        }
    }

    pub fn get(&self) -> Vec<Tle> {
        self.inner.read().tles.clone()
    }

    async fn refresh(&self) {
        let _ = refresh_once(&self.url, &self.cache_path, &self.inner).await;
    }
}

async fn refresh_once(
    url: &str,
    cache_path: &PathBuf,
    inner: &RwLock<TleCache>,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let text = client
        .get(url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    let tles = parse_tle(&text);
    if tles.is_empty() {
        return Err("empty TLE response".into());
    }
    let at = now_secs();
    *inner.write() = TleCache {
        at,
        tles: tles.clone(),
    };
    if let Some(parent) = cache_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = std::fs::write(
        cache_path,
        serde_json::to_string(&TleCache { at, tles }).unwrap_or_default(),
    );
    Ok(())
}
