export const AIRCRAFT_MODEL_BASE = "/models";
export const DEFAULT_AIRCRAFT_MODEL_KEY = "airplane";

const failedModelKeys = new Set<string>();
const loadFailureListeners = new Set<() => void>();

export function markAircraftModelLoadFailed(modelKey: string): void {
  const key = modelKey.toLowerCase();
  if (key === DEFAULT_AIRCRAFT_MODEL_KEY) return;
  if (failedModelKeys.has(key)) return;
  failedModelKeys.add(key);
  loadFailureListeners.forEach((fn) => fn());
}

export function subscribeAircraftModelLoadFailures(listener: () => void): () => void {
  loadFailureListeners.add(listener);
  return () => loadFailureListeners.delete(listener);
}

export function effectiveAircraftModelKey(resolvedKey: string): string {
  const key = resolvedKey.toLowerCase();
  if (key === DEFAULT_AIRCRAFT_MODEL_KEY) return key;
  if (failedModelKeys.has(key)) return DEFAULT_AIRCRAFT_MODEL_KEY;
  return key;
}

export const AVAILABLE_MODEL_KEYS = new Set([
  "airplane",
  "a318",
  "a319",
  "a320",
  "a321",
  "a332",
  "a333",
  "a343",
  "a346",
  "a359",
  "a380",
  "an225",
  "ask21",
  "atr42",
  "b736",
  "b737",
  "b738",
  "b739",
  "b744",
  "b748",
  "b752",
  "b753",
  "b762",
  "b763",
  "b764",
  "b772",
  "b773",
  "b788",
  "b789",
  "bae146",
  "beluga",
  "citation",
  "crj700",
  "crj900",
  "cs100",
  "cs300",
  "e170",
  "e190",
  "heli",
  "pa28",
  "q400",
]);

const ICAO_TO_MODEL: Record<string, string> = {
  A318: "a318",
  A319: "a319",
  A19N: "a319",
  A320: "a320",
  A20N: "a320",
  A321: "a321",
  A21N: "a321",
  A332: "a332",
  A333: "a333",
  A343: "a343",
  A346: "a346",
  A359: "a359",
  A35K: "a359",
  A388: "a380",
  A380: "a380",
  A306: "beluga",
  A3ST: "beluga",
  B736: "b736",
  B737: "b737",
  B738: "b738",
  B739: "b739",
  B38M: "b738",
  B39M: "b739",
  B744: "b744",
  B748: "b748",
  B752: "b752",
  B753: "b753",
  B762: "b762",
  B763: "b763",
  B764: "b764",
  B772: "b772",
  B77L: "b772",
  B77W: "b773",
  B773: "b773",
  B788: "b788",
  B789: "b789",
  B78X: "b789",
  AT42: "atr42",
  AT43: "atr42",
  AT45: "atr42",
  AT46: "atr42",
  AT72: "atr42",
  AT73: "atr42",
  AT75: "atr42",
  AT76: "atr42",
  B461: "bae146",
  B462: "bae146",
  B463: "bae146",
  RJ1H: "bae146",
  RJ70: "bae146",
  RJ85: "bae146",
  GLID: "ask21",
  C172: "pa28",
  C182: "pa28",
  C208: "pa28",
  PA28: "pa28",
  PA32: "pa28",
  PA44: "pa28",
  SR22: "pa28",
  C510: "citation",
  C525: "citation",
  C550: "citation",
  C560: "citation",
  C680: "citation",
  C750: "citation",
  CL30: "citation",
  CL35: "citation",
  CL60: "citation",
  CRJ1: "crj700",
  CRJ2: "crj700",
  CRJ7: "crj700",
  CRJ9: "crj900",
  CRJX: "crj900",
  E170: "e170",
  E75L: "e170",
  E75S: "e170",
  E190: "e190",
  E195: "e190",
  E290: "e190",
  E295: "e190",
  BCS1: "cs100",
  BCS3: "cs300",
  DH8A: "q400",
  DH8B: "q400",
  DH8C: "q400",
  DH8D: "q400",
  AN12: "an225",
  AN22: "an225",
  AN24: "an225",
  AN26: "an225",
  AN28: "an225",
  AN30: "an225",
  AN32: "an225",
  AN72: "an225",
  A124: "an225",
  A225: "an225",
  EC35: "heli",
  EC45: "heli",
  EC55: "heli",
  H60: "heli",
  AS50: "heli",
  B505: "heli",
  R22: "heli",
  R44: "heli",
  S76: "heli",
};

const CATEGORY_TO_MODEL: Record<number, string> = {
  1: "pa28",
  2: "citation",
  3: "b738",
  4: "b752",
  5: "b772",
  6: "b772",
  7: "heli",
  8: "ask21",
  9: "airplane",
  10: "airplane",
  11: "pa28",
  12: "airplane",
};

function normalizeIcaoType(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return t.length >= 3 ? t.slice(0, 4) : undefined;
}

export function resolveAircraftModelKey(
  icaoType: string | undefined,
  emitterCategory?: number,
): string {
  const code = normalizeIcaoType(icaoType);
  if (code) {
    const direct = ICAO_TO_MODEL[code];
    if (direct && AVAILABLE_MODEL_KEYS.has(direct)) return direct;
    const short3 = code.slice(0, 3);
    for (const [k, v] of Object.entries(ICAO_TO_MODEL)) {
      if (k.startsWith(short3) && AVAILABLE_MODEL_KEYS.has(v)) return v;
    }
    const lower = code.toLowerCase();
    if (AVAILABLE_MODEL_KEYS.has(lower)) return lower;
  }
  if (
    emitterCategory != null &&
    CATEGORY_TO_MODEL[emitterCategory] &&
    AVAILABLE_MODEL_KEYS.has(CATEGORY_TO_MODEL[emitterCategory])
  ) {
    return CATEGORY_TO_MODEL[emitterCategory];
  }
  return DEFAULT_AIRCRAFT_MODEL_KEY;
}

export function aircraftModelUrl(modelKey: string): string {
  const key = modelKey.toLowerCase();
  return `${AIRCRAFT_MODEL_BASE}/${key}.glb`;
}

export function preloadCommonAircraftModels(
  preload: (url: string) => void,
): void {
  for (const key of [
    DEFAULT_AIRCRAFT_MODEL_KEY,
    "b738",
    "a320",
    "b772",
    "e190",
    "crj700",
    "heli",
    "pa28",
  ]) {
    preload(aircraftModelUrl(key));
  }
}
