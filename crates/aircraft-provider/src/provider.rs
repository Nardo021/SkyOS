use async_trait::async_trait;
use sky_core::Aircraft;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProviderError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("API error: {0}")]
    Api(String),
    #[error("Not implemented: {0}")]
    NotImplemented(String),
}

pub fn km_to_radius_nm(radius_km: f32) -> u32 {
    let nm = (radius_km / 1.852).ceil() as u32;
    nm.clamp(1, 250)
}

/// WGS84 bounding box (lamin, lomin, lamax, lomax) from center + radius km.
pub fn bbox_from_center(lat: f64, lon: f64, radius_km: f32) -> (f64, f64, f64, f64) {
    let dlat = radius_km as f64 / 111.0;
    let cos_lat = lat.to_radians().cos().max(0.01);
    let dlon = radius_km as f64 / (111.0 * cos_lat);
    (
        lat - dlat,
        lon - dlon,
        lat + dlat,
        lon + dlon,
    )
}

#[async_trait]
pub trait AircraftProvider: Send + Sync {
    async fn fetch_near(&self, lat: f64, lon: f64, radius_km: f32) -> Result<Vec<Aircraft>, ProviderError>;
}
