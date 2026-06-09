use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GeoResult {
    pub lat: f64,
    pub lon: f64,
    pub name: String,
}

pub async fn resolve_location(query: &str) -> Result<GeoResult, String> {
    let q = query.trim();
    if q.is_empty() {
        return Err("missing query".into());
    }

    if let Some((lat, lon)) = parse_coords(q) {
        return Ok(GeoResult {
            lat,
            lon,
            name: format!("{lat:.4}, {lon:.4}"),
        });
    }

    geocode_place(q).await
}

fn parse_coords(q: &str) -> Option<(f64, f64)> {
    let parts: Vec<&str> = q.split([',', ' ']).filter(|s| !s.is_empty()).collect();
    if parts.len() != 2 {
        return None;
    }
    let lat: f64 = parts[0].parse().ok()?;
    let lon: f64 = parts[1].parse().ok()?;
    if lat.abs() > 90.0 || lon.abs() > 180.0 {
        return None;
    }
    Some((lat, lon))
}

#[derive(serde::Deserialize)]
struct NominatimHit {
    lat: String,
    lon: String,
    display_name: Option<String>,
}

async fn geocode_place(q: &str) -> Result<GeoResult, String> {
    let url = format!(
        "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q={}",
        urlencoding(q)
    );
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(6))
        .user_agent("SkyOS/1.3")
        .build()
        .map_err(|e| e.to_string())?;
    let hits: Vec<NominatimHit> = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let hit = hits.first().ok_or_else(|| "no results".to_string())?;
    let lat: f64 = hit.lat.parse().map_err(|e: std::num::ParseFloatError| e.to_string())?;
    let lon: f64 = hit.lon.parse().map_err(|e: std::num::ParseFloatError| e.to_string())?;
    let name = hit
        .display_name
        .as_deref()
        .and_then(|s| s.split(',').next())
        .unwrap_or(q)
        .trim()
        .to_string();
    Ok(GeoResult { lat, lon, name })
}

fn urlencoding(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
            _ => format!("%{:02X}", c as u8),
        })
        .collect()
}
