use std::time::Duration;

use async_trait::async_trait;
use serde::Deserialize;
use sky_core::{normalize_opensky_states, Aircraft};

use crate::provider::{bbox_from_center, AircraftProvider, ProviderError};

pub struct OpenSkyProvider {
    client: reqwest::Client,
}

impl Default for OpenSkyProvider {
    fn default() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("SkyOS/0.1 (non-commercial)")
                .timeout(Duration::from_secs(8))
                .build()
                .unwrap_or_default(),
        }
    }
}

#[derive(Debug, Deserialize)]
struct OpenSkyResponse {
    states: Option<Vec<Option<Vec<serde_json::Value>>>>,
}

#[async_trait]
impl AircraftProvider for OpenSkyProvider {
    async fn fetch_near(
        &self,
        lat: f64,
        lon: f64,
        radius_km: f32,
    ) -> Result<Vec<Aircraft>, ProviderError> {
        let (lamin, lomin, lamax, lomax) = bbox_from_center(lat, lon, radius_km);
        let url = format!(
            "https://opensky-network.org/api/states/all?lamin={lamin}&lomin={lomin}&lamax={lamax}&lomax={lomax}"
        );
        let resp = self.client.get(&url).send().await?;
        if !resp.status().is_success() {
            return Err(ProviderError::Api(format!(
                "OpenSky returned {}",
                resp.status()
            )));
        }
        let body: OpenSkyResponse = resp.json().await?;
        let states = body.states.unwrap_or_default();
        Ok(normalize_opensky_states(states))
    }
}
