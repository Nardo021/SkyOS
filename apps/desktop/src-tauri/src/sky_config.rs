use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocationProfile {
    pub id: String,
    pub name: String,
    pub lat: f64,
    pub lon: f64,
    pub radius_km: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Palette {
    pub bg: String,
    pub glyph: String,
    pub trail: String,
    pub accent: String,
    pub warn: String,
    pub grid: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowFields {
    pub airline: bool,
    pub flight: bool,
    #[serde(rename = "type")]
    pub type_field: bool,
    pub altitude: bool,
    pub speed: bool,
    pub vertical_rate: bool,
    pub destination: bool,
    pub registration: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkyConfig {
    pub center_lat: f64,
    pub center_lon: f64,
    pub altitude_m: f64,
    pub location_name: String,
    pub radius_km: f32,
    pub refresh_secs: u64,
    pub location_profiles: Vec<LocationProfile>,

    pub remote_control_enabled: bool,
    pub config_sync_enabled: bool,
    pub remote_access_token: String,

    pub view_mode: String,
    pub aircraft_filter: String,

    pub show_callsign: bool,
    pub show_altitude: bool,
    pub show_speed: bool,
    pub show_heading: bool,
    pub show_route: bool,
    pub show_airline: bool,
    pub show_type: bool,
    pub show_registration: bool,
    pub airport_code_format: String,
    pub show_trails: bool,
    pub show_runways: bool,
    pub show_horizon: bool,
    pub use_altitude_color: bool,
    pub use_distance_scale: bool,
    pub icon_scale: f32,
    pub interpolate_motion: bool,
    pub render_fps_mode: String,
    pub render_fps: u32,

    pub ceiling_bearing_deg: f64,
    pub ceiling_bearing_locked: bool,
    pub ceiling_projection_mode: String,
    pub ceiling_mirror_x: bool,
    pub ceiling_mirror_y: bool,
    pub ceiling_label_rotation_deg: f64,
    pub ceiling_theme: String,
    pub ceiling_brightness: f32,
    pub ceiling_glyph_size_px: f32,
    pub ceiling_label_density: String,
    pub ceiling_nearest_n: u32,
    pub ceiling_highlight_emergency: bool,
    pub ceiling_show_dest_arc: bool,
    pub ceiling_show_route_detail: bool,
    pub ceiling_trail_seconds: u32,
    pub ceiling_stale_sec: u32,
    pub ceiling_max_extrapolation_sec: u32,
    pub ceiling_show_stars: bool,
    pub ceiling_show_sun: bool,
    pub ceiling_show_moon: bool,
    pub ceiling_show_planets: bool,
    pub ceiling_show_satellites: bool,
    pub ceiling_satellite_labels: bool,
    pub ceiling_star_mag_limit: f32,
    pub ceiling_star_label_mag_limit: f32,
    pub ceiling_sky_time_offset_min: i32,

    pub rotation_deg: f64,
    pub mirror_x: bool,
    pub mirror_y: bool,
    pub label_rotation_deg: f64,
    pub projection_mode: String,
    pub min_altitude_ft: u32,
    pub max_altitude_ft: u32,
    pub hide_on_ground: bool,
    pub interpolate: bool,
    pub max_extrapolation_sec: u32,
    pub stale_sec: u32,
    pub smoothing: f32,
    pub max_fps: u32,
    pub theme: String,
    pub palette: Palette,
    pub glyph_size_px: f32,
    pub altitude_color: bool,
    pub trail_seconds: u32,
    pub brightness: f32,
    pub label_density: String,
    pub nearest_n: u32,
    pub show_fields: ShowFields,
    pub speed_unit: String,
    pub range_rings: bool,
    pub compass: bool,
    pub highlight_emergency: bool,
    pub show_airport: bool,
    pub show_hud: bool,
    pub show_stars: bool,
    pub show_sun: bool,
    pub show_moon: bool,
    pub show_satellites: bool,
    pub satellite_labels: bool,
    pub show_planets: bool,
    pub star_mag_limit: f32,
    pub star_label_mag_limit: f32,
    pub sky_time_offset_min: i32,
    pub show_dest_arc: bool,
    pub show_route_detail: bool,
}

impl Default for SkyConfig {
    fn default() -> Self {
        Self {
            center_lat: -33.79757042903397,
            center_lon: 151.1853986392743,
            altitude_m: 25.0,
            location_name: "Sydney".into(),
            radius_km: 50.0,
            refresh_secs: 1,
            location_profiles: vec![],
            remote_control_enabled: false,
            config_sync_enabled: false,
            remote_access_token: String::new(),
            view_mode: "dome".into(),
            aircraft_filter: "all".into(),
            show_callsign: true,
            show_altitude: true,
            show_speed: true,
            show_heading: false,
            show_route: true,
            show_airline: true,
            show_type: true,
            show_registration: false,
            airport_code_format: "icao".into(),
            show_trails: true,
            show_runways: true,
            show_horizon: true,
            use_altitude_color: true,
            use_distance_scale: true,
            icon_scale: 1.0,
            interpolate_motion: true,
            render_fps_mode: "display".into(),
            render_fps: 60,
            ceiling_bearing_deg: 0.0,
            ceiling_bearing_locked: false,
            ceiling_projection_mode: "sky".into(),
            ceiling_mirror_x: true,
            ceiling_mirror_y: false,
            ceiling_label_rotation_deg: 0.0,
            ceiling_theme: "ambient".into(),
            ceiling_brightness: 1.0,
            ceiling_glyph_size_px: 22.0,
            ceiling_label_density: "all".into(),
            ceiling_nearest_n: 5,
            ceiling_highlight_emergency: true,
            ceiling_show_dest_arc: true,
            ceiling_show_route_detail: false,
            ceiling_trail_seconds: 45,
            ceiling_stale_sec: 20,
            ceiling_max_extrapolation_sec: 5,
            ceiling_show_stars: true,
            ceiling_show_sun: true,
            ceiling_show_moon: true,
            ceiling_show_planets: true,
            ceiling_show_satellites: true,
            ceiling_satellite_labels: false,
            ceiling_star_mag_limit: 2.6,
            ceiling_star_label_mag_limit: 0.3,
            ceiling_sky_time_offset_min: 0,
            rotation_deg: 0.0,
            mirror_x: true,
            mirror_y: false,
            label_rotation_deg: 0.0,
            projection_mode: "sky".into(),
            min_altitude_ft: 100,
            max_altitude_ft: 60000,
            hide_on_ground: true,
            interpolate: true,
            max_extrapolation_sec: 5,
            stale_sec: 20,
            smoothing: 0.18,
            max_fps: 0,
            theme: "ambient".into(),
            palette: Palette {
                bg: "#000000".into(),
                glyph: "#E8ECFF".into(),
                trail: "#6B7280".into(),
                accent: "#9B7ECF".into(),
                warn: "#FF5A47".into(),
                grid: "#3A4256".into(),
                text: "#AEB6C6".into(),
            },
            glyph_size_px: 22.0,
            altitude_color: true,
            trail_seconds: 45,
            brightness: 1.0,
            label_density: "all".into(),
            nearest_n: 5,
            show_fields: ShowFields {
                airline: true,
                flight: true,
                type_field: true,
                altitude: true,
                speed: true,
                vertical_rate: false,
                destination: true,
                registration: false,
            },
            speed_unit: "kt".into(),
            range_rings: true,
            compass: true,
            highlight_emergency: true,
            show_airport: true,
            show_hud: false,
            show_stars: true,
            show_sun: true,
            show_moon: true,
            show_satellites: true,
            satellite_labels: false,
            show_planets: true,
            star_mag_limit: 2.6,
            star_label_mag_limit: 0.3,
            sky_time_offset_min: 0,
            show_dest_arc: true,
            show_route_detail: false,
        }
    }
}

pub fn merge_sky_config(base: &SkyConfig, patch: &serde_json::Value) -> Result<SkyConfig, String> {
    let mut merged = base.clone();
    let patch_obj = patch
        .as_object()
        .ok_or_else(|| "patch must be an object".to_string())?;

    if let Some(v) = patch_obj.get("palette").and_then(|p| p.as_object()) {
        if let Some(s) = v.get("bg").and_then(|x| x.as_str()) {
            merged.palette.bg = s.into();
        }
        if let Some(s) = v.get("glyph").and_then(|x| x.as_str()) {
            merged.palette.glyph = s.into();
        }
        if let Some(s) = v.get("trail").and_then(|x| x.as_str()) {
            merged.palette.trail = s.into();
        }
        if let Some(s) = v.get("accent").and_then(|x| x.as_str()) {
            merged.palette.accent = s.into();
        }
        if let Some(s) = v.get("warn").and_then(|x| x.as_str()) {
            merged.palette.warn = s.into();
        }
        if let Some(s) = v.get("grid").and_then(|x| x.as_str()) {
            merged.palette.grid = s.into();
        }
        if let Some(s) = v.get("text").and_then(|x| x.as_str()) {
            merged.palette.text = s.into();
        }
    }

    if let Some(v) = patch_obj.get("showFields").and_then(|p| p.as_object()) {
        if let Some(b) = v.get("airline").and_then(|x| x.as_bool()) {
            merged.show_fields.airline = b;
        }
        if let Some(b) = v.get("flight").and_then(|x| x.as_bool()) {
            merged.show_fields.flight = b;
        }
        if let Some(b) = v.get("type").and_then(|x| x.as_bool()) {
            merged.show_fields.type_field = b;
        }
        if let Some(b) = v.get("altitude").and_then(|x| x.as_bool()) {
            merged.show_fields.altitude = b;
        }
        if let Some(b) = v.get("speed").and_then(|x| x.as_bool()) {
            merged.show_fields.speed = b;
        }
        if let Some(b) = v.get("verticalRate").and_then(|x| x.as_bool()) {
            merged.show_fields.vertical_rate = b;
        }
        if let Some(b) = v.get("destination").and_then(|x| x.as_bool()) {
            merged.show_fields.destination = b;
        }
        if let Some(b) = v.get("registration").and_then(|x| x.as_bool()) {
            merged.show_fields.registration = b;
        }
    }

    if let Some(arr) = patch_obj.get("locationProfiles") {
        merged.location_profiles =
            serde_json::from_value(arr.clone()).map_err(|e| e.to_string())?;
    }

    macro_rules! patch_field {
        ($key:expr, $field:ident, f64) => {
            if let Some(v) = patch_obj.get($key).and_then(|x| x.as_f64()) {
                merged.$field = v;
            }
        };
        ($key:expr, $field:ident, f32) => {
            if let Some(v) = patch_obj.get($key).and_then(|x| x.as_f64()) {
                merged.$field = v as f32;
            }
        };
        ($key:expr, $field:ident, u64) => {
            if let Some(v) = patch_obj.get($key).and_then(|x| x.as_u64()) {
                merged.$field = v;
            }
        };
        ($key:expr, $field:ident, u32) => {
            if let Some(v) = patch_obj.get($key).and_then(|x| x.as_u64()) {
                merged.$field = v as u32;
            }
        };
        ($key:expr, $field:ident, i32) => {
            if let Some(v) = patch_obj.get($key).and_then(|x| x.as_i64()) {
                merged.$field = v as i32;
            }
        };
        ($key:expr, $field:ident, bool) => {
            if let Some(v) = patch_obj.get($key).and_then(|x| x.as_bool()) {
                merged.$field = v;
            }
        };
        ($key:expr, $field:ident, String) => {
            if let Some(v) = patch_obj.get($key).and_then(|x| x.as_str()) {
                merged.$field = v.into();
            }
        };
    }

    patch_field!("centerLat", center_lat, f64);
    patch_field!("centerLon", center_lon, f64);
    patch_field!("altitudeM", altitude_m, f64);
    patch_field!("locationName", location_name, String);
    patch_field!("radiusKm", radius_km, f32);
    patch_field!("refreshSecs", refresh_secs, u64);
    patch_field!("remoteControlEnabled", remote_control_enabled, bool);
    patch_field!("configSyncEnabled", config_sync_enabled, bool);
    patch_field!("remoteAccessToken", remote_access_token, String);
    patch_field!("viewMode", view_mode, String);
    patch_field!("aircraftFilter", aircraft_filter, String);
    patch_field!("showCallsign", show_callsign, bool);
    patch_field!("showAltitude", show_altitude, bool);
    patch_field!("showSpeed", show_speed, bool);
    patch_field!("showHeading", show_heading, bool);
    patch_field!("showRoute", show_route, bool);
    patch_field!("showAirline", show_airline, bool);
    patch_field!("showType", show_type, bool);
    patch_field!("showRegistration", show_registration, bool);
    patch_field!("airportCodeFormat", airport_code_format, String);
    patch_field!("showTrails", show_trails, bool);
    patch_field!("showRunways", show_runways, bool);
    patch_field!("showHorizon", show_horizon, bool);
    patch_field!("useAltitudeColor", use_altitude_color, bool);
    patch_field!("useDistanceScale", use_distance_scale, bool);
    patch_field!("iconScale", icon_scale, f32);
    patch_field!("interpolateMotion", interpolate_motion, bool);
    patch_field!("renderFpsMode", render_fps_mode, String);
    patch_field!("renderFps", render_fps, u32);
    patch_field!("ceilingBearingDeg", ceiling_bearing_deg, f64);
    patch_field!("ceilingBearingLocked", ceiling_bearing_locked, bool);
    patch_field!("ceilingProjectionMode", ceiling_projection_mode, String);
    patch_field!("ceilingMirrorX", ceiling_mirror_x, bool);
    patch_field!("ceilingMirrorY", ceiling_mirror_y, bool);
    patch_field!("ceilingLabelRotationDeg", ceiling_label_rotation_deg, f64);
    patch_field!("ceilingTheme", ceiling_theme, String);
    patch_field!("ceilingBrightness", ceiling_brightness, f32);
    patch_field!("ceilingGlyphSizePx", ceiling_glyph_size_px, f32);
    patch_field!("ceilingLabelDensity", ceiling_label_density, String);
    patch_field!("ceilingNearestN", ceiling_nearest_n, u32);
    patch_field!("ceilingHighlightEmergency", ceiling_highlight_emergency, bool);
    patch_field!("ceilingShowDestArc", ceiling_show_dest_arc, bool);
    patch_field!("ceilingShowRouteDetail", ceiling_show_route_detail, bool);
    patch_field!("ceilingTrailSeconds", ceiling_trail_seconds, u32);
    patch_field!("ceilingStaleSec", ceiling_stale_sec, u32);
    patch_field!("ceilingMaxExtrapolationSec", ceiling_max_extrapolation_sec, u32);
    patch_field!("ceilingShowStars", ceiling_show_stars, bool);
    patch_field!("ceilingShowSun", ceiling_show_sun, bool);
    patch_field!("ceilingShowMoon", ceiling_show_moon, bool);
    patch_field!("ceilingShowPlanets", ceiling_show_planets, bool);
    patch_field!("ceilingShowSatellites", ceiling_show_satellites, bool);
    patch_field!("ceilingSatelliteLabels", ceiling_satellite_labels, bool);
    patch_field!("ceilingStarMagLimit", ceiling_star_mag_limit, f32);
    patch_field!("ceilingStarLabelMagLimit", ceiling_star_label_mag_limit, f32);
    patch_field!("ceilingSkyTimeOffsetMin", ceiling_sky_time_offset_min, i32);
    patch_field!("rotationDeg", rotation_deg, f64);
    patch_field!("mirrorX", mirror_x, bool);
    patch_field!("mirrorY", mirror_y, bool);
    patch_field!("labelRotationDeg", label_rotation_deg, f64);
    patch_field!("projectionMode", projection_mode, String);
    patch_field!("minAltitudeFt", min_altitude_ft, u32);
    patch_field!("maxAltitudeFt", max_altitude_ft, u32);
    patch_field!("hideOnGround", hide_on_ground, bool);
    patch_field!("interpolate", interpolate, bool);
    patch_field!("maxExtrapolationSec", max_extrapolation_sec, u32);
    patch_field!("staleSec", stale_sec, u32);
    patch_field!("smoothing", smoothing, f32);
    patch_field!("maxFps", max_fps, u32);
    patch_field!("theme", theme, String);
    patch_field!("glyphSizePx", glyph_size_px, f32);
    patch_field!("altitudeColor", altitude_color, bool);
    patch_field!("trailSeconds", trail_seconds, u32);
    patch_field!("brightness", brightness, f32);
    patch_field!("labelDensity", label_density, String);
    patch_field!("nearestN", nearest_n, u32);
    patch_field!("speedUnit", speed_unit, String);
    patch_field!("rangeRings", range_rings, bool);
    patch_field!("compass", compass, bool);
    patch_field!("highlightEmergency", highlight_emergency, bool);
    patch_field!("showAirport", show_airport, bool);
    patch_field!("showHud", show_hud, bool);
    patch_field!("showStars", show_stars, bool);
    patch_field!("showSun", show_sun, bool);
    patch_field!("showMoon", show_moon, bool);
    patch_field!("showSatellites", show_satellites, bool);
    patch_field!("satelliteLabels", satellite_labels, bool);
    patch_field!("showPlanets", show_planets, bool);
    patch_field!("starMagLimit", star_mag_limit, f32);
    patch_field!("starLabelMagLimit", star_label_mag_limit, f32);
    patch_field!("skyTimeOffsetMin", sky_time_offset_min, i32);
    patch_field!("showDestArc", show_dest_arc, bool);
    patch_field!("showRouteDetail", show_route_detail, bool);

    Ok(merged)
}

pub fn new_remote_token() -> String {
    uuid::Uuid::new_v4().to_string()
}

pub fn apply_sky_to_app_config(sky: &SkyConfig, app: &mut crate::config::AppConfig) {
    app.observer.lat = sky.center_lat;
    app.observer.lon = sky.center_lon;
    app.observer.altitude_m = sky.altitude_m;
    app.data.radius_km = sky.radius_km;
    app.data.refresh_secs = sky.refresh_secs;
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn merge_palette_and_show_fields() {
        let base = SkyConfig::default();
        let patch = json!({
            "brightness": 0.5,
            "palette": { "accent": "#ffffff" },
            "showFields": { "airline": false, "type": true }
        });
        let merged = merge_sky_config(&base, &patch).unwrap();
        assert_eq!(merged.brightness, 0.5);
        assert_eq!(merged.palette.accent, "#ffffff");
        assert_eq!(merged.palette.bg, base.palette.bg);
        assert!(!merged.show_fields.airline);
        assert!(merged.show_fields.type_field);
    }

    #[test]
    fn merge_location_profiles_replaces_array() {
        let base = SkyConfig::default();
        let patch = json!({
            "locationProfiles": [{
                "id": "a",
                "name": "Home",
                "lat": 1.0,
                "lon": 2.0,
                "radiusKm": 25.0
            }]
        });
        let merged = merge_sky_config(&base, &patch).unwrap();
        assert_eq!(merged.location_profiles.len(), 1);
        assert_eq!(merged.location_profiles[0].name, "Home");
    }
}
