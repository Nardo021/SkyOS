import type { Aircraft, AirportCodeFormat } from "@skyos/types";

/** Pick 3- or 4-letter airport code for display. */
export function pickAirportCode(
  icao?: string,
  iata?: string,
  format: AirportCodeFormat = "icao",
): string | null {
  const four = icao?.trim().toUpperCase();
  const three = iata?.trim().toUpperCase();
  if (format === "iata") {
    if (three && three.length >= 3) return three.slice(0, 3);
    if (four && four.length >= 4) return four;
    return null;
  }
  if (four && four.length >= 4) return four.slice(0, 4);
  if (three && three.length >= 3) return three.slice(0, 3);
  return null;
}

/** Departure → arrival using settings code length. */
export function formatFlightRoute(
  ac: Pick<
    Aircraft,
    | "originIcao"
    | "originIata"
    | "destinationIcao"
    | "destinationIata"
    | "origin"
    | "destination"
  >,
  format: AirportCodeFormat,
): string | null {
  const dep = pickAirportCode(
    ac.originIcao ?? ac.origin,
    ac.originIata,
    format,
  );
  const arr = pickAirportCode(
    ac.destinationIcao ?? ac.destination,
    ac.destinationIata,
    format,
  );
  if (!dep && !arr) return null;
  return `${dep ?? "—"} → ${arr ?? "—"}`;
}

/** ICAO (4-letter) + optional IATA (3-letter) for display. */
export function formatAirportCodeLines(icao: string, iata?: string): {
  icao: string;
  iata: string | null;
} {
  const code = icao.trim().toUpperCase();
  const three = iata?.trim().toUpperCase();
  return {
    icao: code,
    iata: three && three.length > 0 ? three : null,
  };
}

export function formatRunwayIdent(ident?: string): string | null {
  const s = ident?.trim().toUpperCase();
  return s && s.length > 0 ? s : null;
}
