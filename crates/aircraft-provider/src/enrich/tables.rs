use std::collections::HashMap;
use std::sync::OnceLock;

struct Tables {
    airlines: HashMap<String, String>,
    types: HashMap<String, String>,
}

static TABLES: OnceLock<Tables> = OnceLock::new();

fn load_tables() -> &'static Tables {
    TABLES.get_or_init(|| {
        let airlines: HashMap<String, String> =
            serde_json::from_str(include_str!("data/airlines.json")).unwrap_or_default();
        let types: HashMap<String, String> =
            serde_json::from_str(include_str!("data/types.json")).unwrap_or_default();
        Tables { airlines, types }
    })
}

/// Map an ICAO type code (e.g. "B738") to a human name.
pub fn lookup_type(code: Option<&str>) -> Option<String> {
    let code = code?.trim();
    if code.is_empty() {
        return None;
    }
    load_tables().types.get(&code.to_uppercase()).cloned()
}

/// Map a callsign to an airline name via its 3-letter ICAO prefix.
pub fn lookup_airline(callsign: Option<&str>) -> Option<String> {
    let cs = callsign?.trim().to_uppercase();
    if cs.len() < 4 {
        return None;
    }
    let prefix = &cs[..3];
    if !prefix.chars().all(|c| c.is_ascii_alphabetic()) {
        return None;
    }
    if !cs.as_bytes().get(3)?.is_ascii_digit() {
        return None;
    }
    load_tables().airlines.get(prefix).cloned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lookup_type_known_code() {
        assert!(lookup_type(Some("B738")).is_some());
    }

    #[test]
    fn lookup_airline_from_callsign() {
        let name = lookup_airline(Some("QFA1"));
        assert!(name.is_some());
    }
}
