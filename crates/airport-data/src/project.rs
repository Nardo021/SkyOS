use sky_core::{
    geo_point_to_sky, haversine_distance_m, sky_label_below, AirportLabel, Observer, RunwaySegment,
};

use crate::database::{ensure_database, AirportDatabase};

pub async fn runways_for_observer(
    cache_dir: &std::path::Path,
    observer: Observer,
    radius_km: f32,
) -> (Vec<RunwaySegment>, Vec<AirportLabel>) {
    let Ok(db) = ensure_database(cache_dir).await else {
        return (vec![], vec![]);
    };
    project(&db, observer, radius_km)
}

fn project(
    db: &AirportDatabase,
    observer: Observer,
    radius_km: f32,
) -> (Vec<RunwaySegment>, Vec<AirportLabel>) {
    let mut segments = Vec::new();
    let mut labels = Vec::new();
    let radius_m = f64::from(radius_km) * 1000.0;

    for airport in db.airports_near(observer.lat, observer.lon, radius_km) {
        let distance_meters =
            haversine_distance_m(observer.lat, observer.lon, airport.lat, airport.lon);
        if distance_meters > radius_m {
            continue;
        }
        let runways = db.runways_for_airport(&airport.ident);
        if runways.is_empty() {
            continue;
        }

        let mut mid_az = 0.0;
        let mut mid_el = 0.0;
        let mut mid_count = 0usize;

        for (idx, rw) in runways.iter().enumerate() {
            let Some((x1, y1, z1, cu1, cv1, _, _)) =
                geo_point_to_sky(observer, rw.le_lat, rw.le_lon, airport.elevation_m)
            else {
                continue;
            };
            let Some((x2, y2, z2, cu2, cv2, _, _)) =
                geo_point_to_sky(observer, rw.he_lat, rw.he_lon, airport.elevation_m)
            else {
                continue;
            };

            let center_lat = (rw.le_lat + rw.he_lat) / 2.0;
            let center_lon = (rw.le_lon + rw.he_lon) / 2.0;

            segments.push(RunwaySegment {
                id: format!("{}-{}", airport.ident, idx),
                icao: airport.ident.clone(),
                iata: airport.iata.clone(),
                le_ident: rw.le_ident.clone(),
                he_ident: rw.he_ident.clone(),
                le_lat: rw.le_lat,
                le_lon: rw.le_lon,
                he_lat: rw.he_lat,
                he_lon: rw.he_lon,
                center_lat: Some(center_lat),
                center_lon: Some(center_lon),
                length_meters: Some(rw.length_meters),
                width_meters: Some(rw.width_meters),
                heading_deg: Some(rw.heading_deg),
                elevation_m: Some(airport.elevation_m),
                x1,
                y1,
                z1,
                x2,
                y2,
                z2,
                ceiling_u1: cu1,
                ceiling_v1: cv1,
                ceiling_u2: cu2,
                ceiling_v2: cv2,
            });

            if let Some((_, _, _, _, _, az1, el1)) =
                geo_point_to_sky(observer, rw.le_lat, rw.le_lon, airport.elevation_m)
            {
                mid_az += az1;
                mid_el += el1;
                mid_count += 1;
            }
            if let Some((_, _, _, _, _, az2, el2)) =
                geo_point_to_sky(observer, rw.he_lat, rw.he_lon, airport.elevation_m)
            {
                mid_az += az2;
                mid_el += el2;
                mid_count += 1;
            }
        }

        let label_point = if mid_count > 0 {
            let az = mid_az / mid_count as f64;
            let el = mid_el / mid_count as f64;
            sky_label_below(az, el, 1.2)
        } else if let Some((_, _, _, _, _, az, el)) =
            geo_point_to_sky(observer, airport.lat, airport.lon, airport.elevation_m)
        {
            sky_label_below(az, el, 1.2)
        } else {
            continue;
        };

        labels.push(AirportLabel {
            icao: airport.ident.clone(),
            iata: airport.iata.clone(),
            lat: airport.lat,
            lon: airport.lon,
            distance_meters,
            x: label_point.0,
            y: label_point.1,
            z: label_point.2,
            ceiling_u: label_point.3,
            ceiling_v: label_point.4,
        });
    }

    (segments, labels)
}
