// Flat ceiling polar projection (matches frontend skyToCeilingPoint on 0-1 space).

pub fn ceiling_uv(azimuth_deg: f64, elevation_deg: f64) -> (f64, f64) {
    let width: f64 = 1.0;
    let height: f64 = 1.0;
    let cx = width / 2.0;
    let cy = height / 2.0;
    let max_radius = width.min(height) * 0.48;

    let elevation = elevation_deg.clamp(0.0, 90.0);
    let azimuth_rad = azimuth_deg.to_radians();

    let r = ((90.0 - elevation) / 90.0) * max_radius;

    let u = cx + r * azimuth_rad.sin();
    let v = cy - r * azimuth_rad.cos();

    (u.clamp(0.02, 0.98), v.clamp(0.02, 0.98))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zenith_at_center() {
        let (u, v) = ceiling_uv(0.0, 90.0);
        assert!((u - 0.5).abs() < 0.01);
        assert!((v - 0.5).abs() < 0.01);
    }

    #[test]
    fn north_on_horizon_at_top() {
        let (u, v) = ceiling_uv(0.0, 0.0);
        assert!((u - 0.5).abs() < 0.01);
        assert!(v < 0.05);
    }

    #[test]
    fn east_on_horizon_at_right() {
        let (u, v) = ceiling_uv(90.0, 0.0);
        assert!(u > 0.95);
        assert!((v - 0.5).abs() < 0.01);
    }

    #[test]
    fn south_on_horizon_at_bottom() {
        let (u, v) = ceiling_uv(180.0, 0.0);
        assert!((u - 0.5).abs() < 0.01);
        assert!(v > 0.95);
    }

    #[test]
    fn west_on_horizon_at_left() {
        let (u, v) = ceiling_uv(270.0, 0.0);
        assert!(u < 0.05);
        assert!((v - 0.5).abs() < 0.01);
    }
}
