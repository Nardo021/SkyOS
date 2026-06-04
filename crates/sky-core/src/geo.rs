use crate::projection::ceiling_uv;
use crate::types::{Aircraft, Observer, SkyObject};

/// WGS84 equatorial radius — matches `@skyos/coordinates` / LocalCoordinateEngine.
const EARTH_RADIUS_M: f64 = 6_378_137.0;

pub fn haversine_distance_m(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let lat1_r = lat1.to_radians();
    let lat2_r = lat2.to_radians();
    let d_lat = ((lat2_r - lat1_r) / 2.0).sin().powi(2);
    let d_lon = (((lon2 - lon1).to_radians()) / 2.0).sin().powi(2);
    let a = d_lat + lat1_r.cos() * lat2_r.cos() * d_lon;
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    EARTH_RADIUS_M * c
}

/// Bearing from point 1 to point 2, degrees clockwise from north (0–360).
pub fn bearing_deg(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let lat1_r = lat1.to_radians();
    let lat2_r = lat2.to_radians();
    let d_lon = (lon2 - lon1).to_radians();
    let y = d_lon.sin() * lat2_r.cos();
    let x = lat1_r.cos() * lat2_r.sin() - lat1_r.sin() * lat2_r.cos() * d_lon.cos();
    let mut az = y.atan2(x).to_degrees();
    if az < 0.0 {
        az += 360.0;
    }
    az
}

/// East-North-Up offsets in meters (flat-earth, valid for < ~100 km).
pub fn enu_meters(
    observer: Observer,
    target_lat: f64,
    target_lon: f64,
    target_alt_m: f64,
) -> (f64, f64, f64) {
    let lat_avg = observer.lat.to_radians();
    let d_lat = (target_lat - observer.lat).to_radians();
    let d_lon = (target_lon - observer.lon).to_radians();
    let n = d_lat * EARTH_RADIUS_M;
    let e = d_lon * EARTH_RADIUS_M * lat_avg.cos();
    let u = target_alt_m - observer.altitude_m;
    (e, n, u)
}

pub fn elevation_deg(horizontal_m: f64, altitude_diff_m: f64) -> f64 {
    if horizontal_m < 1e-3 {
        if altitude_diff_m > 0.0 {
            return 90.0;
        }
        if altitude_diff_m < 0.0 {
            return -90.0;
        }
        return 0.0;
    }
    altitude_diff_m.atan2(horizontal_m).to_degrees()
}

/// Three.js sky dome: Y = zenith, N = -Z, E = +X.
pub fn sky_position(azimuth_deg: f64, elevation_deg: f64) -> (f64, f64, f64) {
    let az = azimuth_deg.to_radians();
    let el = elevation_deg.to_radians();
    let cos_el = el.cos();
    let x = cos_el * az.sin();
    let y = el.sin();
    let z = -cos_el * az.cos();
    (x, y, z)
}

pub fn aircraft_to_sky_object(observer: Observer, aircraft: &Aircraft) -> Option<SkyObject> {
    let alt_m = aircraft.altitude_meters.unwrap_or(observer.altitude_m);
    let (e, n, u) = enu_meters(observer, aircraft.lat, aircraft.lon, alt_m);
    let horizontal = (e * e + n * n).sqrt();
    let elevation = elevation_deg(horizontal, u);
    if elevation < 0.0 {
        return None;
    }
    let azimuth = if horizontal < 1e-6 {
        bearing_deg(observer.lat, observer.lon, aircraft.lat, aircraft.lon)
    } else {
        let mut az = e.atan2(n).to_degrees();
        if az < 0.0 {
            az += 360.0;
        }
        az
    };
    let distance = (e * e + n * n + u * u).sqrt();
    let (x, y, z) = sky_position(azimuth, elevation);
    let (ceiling_u, ceiling_v) = ceiling_uv(azimuth, elevation);
    let label = aircraft
        .callsign
        .clone()
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| aircraft.id.clone());

    Some(SkyObject {
        id: aircraft.id.clone(),
        label,
        azimuth_deg: azimuth,
        elevation_deg: elevation,
        distance_meters: distance,
        x,
        y,
        z,
        ceiling_u,
        ceiling_v,
    })
}

pub fn aircraft_list_to_sky_objects(observer: Observer, aircraft: &[Aircraft]) -> Vec<SkyObject> {
    aircraft
        .iter()
        .filter_map(|ac| aircraft_to_sky_object(observer, ac))
        .collect()
}

/// Project a ground/geo point onto the sky dome and ceiling (for runways, airports).
pub fn geo_point_to_sky(
    observer: Observer,
    lat: f64,
    lon: f64,
    alt_m: f64,
) -> Option<(f64, f64, f64, f64, f64, f64, f64)> {
    let (e, n, u) = enu_meters(observer, lat, lon, alt_m);
    let horizontal = (e * e + n * n).sqrt();
    let elevation = elevation_deg(horizontal, u);
    if elevation < -10.0 {
        return None;
    }
    let azimuth = if horizontal < 1e-6 {
        bearing_deg(observer.lat, observer.lon, lat, lon)
    } else {
        let mut az = e.atan2(n).to_degrees();
        if az < 0.0 {
            az += 360.0;
        }
        az
    };
    let (x, y, z) = sky_position(azimuth, elevation.max(0.0));
    let (ceiling_u, ceiling_v) = ceiling_uv(azimuth, elevation.max(0.0));
    Some((x, y, z, ceiling_u, ceiling_v, azimuth, elevation))
}

/// Label position slightly below a sky point (toward horizon on ceiling).
pub fn sky_label_below(
    azimuth_deg: f64,
    elevation_deg: f64,
    offset_deg: f64,
) -> (f64, f64, f64, f64, f64) {
    let el = (elevation_deg - offset_deg).max(0.0);
    let (x, y, z) = sky_position(azimuth_deg, el);
    let (cu, cv) = ceiling_uv(azimuth_deg, el);
    (x, y, z, cu, cv)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::AircraftSource;

    #[test]
    fn haversine_one_km_north() {
        let d = haversine_distance_m(31.0, 121.0, 31.009, 121.0);
        assert!((d - 1000.0).abs() < 80.0, "distance was {d}");
    }

    #[test]
    fn bearing_north() {
        let b = bearing_deg(0.0, 0.0, 1.0, 0.0);
        assert!(b.abs() < 1.0 || (b - 360.0).abs() < 1.0);
    }

    #[test]
    fn sky_position_north_horizon() {
        let (x, y, z) = sky_position(0.0, 0.0);
        assert!(x.abs() < 1e-6);
        assert!(y.abs() < 1e-6);
        assert!((z + 1.0).abs() < 1e-6);
    }

    #[test]
    fn filters_below_horizon() {
        let observer = Observer {
            lat: 31.23,
            lon: 121.47,
            altitude_m: 1000.0,
        };
        let ac = Aircraft {
            id: "test".into(),
            callsign: None,
            lat: 31.23,
            lon: 121.47,
            altitude_meters: Some(10.0),
            altitude_feet: None,
            ground_speed: None,
            track: None,
            vertical_rate: None,
            source: AircraftSource::Mock,
            seen_seconds: None,
            icao_type: None,
            emitter_category: None,
            origin_icao: None,
            origin_iata: None,
            destination_icao: None,
            destination_iata: None,
            origin: None,
            destination: None,
        };
        assert!(aircraft_to_sky_object(observer, &ac).is_none());
    }
}
