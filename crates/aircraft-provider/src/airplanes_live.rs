use std::time::Duration;

use async_trait::async_trait;
use sky_core::{normalize_airplanes_live, AirplanesLiveResponse, Aircraft};

use crate::provider::{km_to_radius_nm, AircraftProvider, ProviderError};

pub struct AirplanesLiveProvider {
    client: reqwest::Client,
}

impl Default for AirplanesLiveProvider {
    fn default() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("SkyOS/0.1 (non-commercial; https://github.com/skyos)")
                .timeout(Duration::from_secs(5))
                .build()
                .unwrap_or_default(),
        }
    }
}

#[async_trait]
impl AircraftProvider for AirplanesLiveProvider {
    async fn fetch_near(&self, lat: f64, lon: f64, radius_km: f32) -> Result<Vec<Aircraft>, ProviderError> {
        let radius_nm = km_to_radius_nm(radius_km);
        let url = format!(
            "https://api.airplanes.live/v2/point/{lat}/{lon}/{radius_nm}"
        );
        let resp = self.client.get(&url).send().await?;
        if !resp.status().is_success() {
            return Err(ProviderError::Api(format!(
                "Airplanes.live returned {}",
                resp.status()
            )));
        }
        let text = resp.text().await?;
        let body: AirplanesLiveResponse = serde_json::from_str(&text).map_err(|e| {
            ProviderError::Api(format!(
                "Airplanes.live JSON parse error: {e} (body starts with: {})",
                text.chars().take(120).collect::<String>()
            ))
        })?;
        let raw = body.ac.unwrap_or_default();
        Ok(normalize_airplanes_live(raw))
    }
}
