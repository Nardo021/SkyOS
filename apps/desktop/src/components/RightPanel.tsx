import { useMemo, useState } from "react";
import { filterSkyObjects, formatFlightRoute } from "@skyos/renderer";
import { IconPlane, IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { PanelCard } from "@/components/panel-card";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "../stores/settingsStore";
import { useSkyStore } from "../stores/skyStore";

const emptyByFilter = {
  all: "No aircraft in view",
  air: "暂无空中飞机",
  ground: "暂无地面飞机",
} as const;

export function RightPanel() {
  const { skyObjects, aircraft, selectedId, selectAircraft } = useSkyStore();
  const aircraftFilter = useSettingsStore((s) => s.aircraftFilter);
  const showRoute = useSettingsStore((s) => s.showRoute);
  const airportCodeFormat = useSettingsStore((s) => s.airportCodeFormat);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byFilter = filterSkyObjects(skyObjects, aircraft, aircraftFilter);
    const list = q
      ? byFilter.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            o.id.toLowerCase().includes(q),
        )
      : byFilter;

    return list.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
        numeric: true,
      }),
    );
  }, [skyObjects, aircraft, aircraftFilter, query]);

  const selected = skyObjects.find((o) => o.id === selectedId);
  const selectedAc = aircraft.find((a) => a.id === selectedId);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <PanelCard
        title={`Aircraft (${filtered.length})`}
        icon={IconPlane}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        contentClassName="flex min-h-0 flex-1 flex-col gap-2"
      >
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search callsign / hex…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto text-xs">
          {filtered.length === 0 ? (
            <li className="text-muted-foreground">
              {skyObjects.length === 0
                ? emptyByFilter.all
                : query.trim()
                  ? "No matches"
                  : emptyByFilter[aircraftFilter]}
            </li>
          ) : (
            filtered.map((obj) => (
              <li key={obj.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors",
                    selectedId === obj.id
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-muted",
                  )}
                  onClick={() => selectAircraft(obj.id)}
                >
                  <IconPlane data-icon="inline-start" className="opacity-70" />
                  <span className="font-medium">{obj.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {obj.azimuthDeg.toFixed(0)}°/{obj.elevationDeg.toFixed(0)}°
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </PanelCard>

      {selected ? (
        <PanelCard title="Detail" icon={IconPlane}>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Callsign</dt>
            <dd>{selected.label}</dd>
            <dt className="text-muted-foreground">Azimuth</dt>
            <dd>{selected.azimuthDeg.toFixed(1)}°</dd>
            <dt className="text-muted-foreground">Elevation</dt>
            <dd>{selected.elevationDeg.toFixed(1)}°</dd>
            <dt className="text-muted-foreground">Distance</dt>
            <dd>{(selected.distanceMeters / 1000).toFixed(1)} km</dd>
            {selectedAc?.altitudeFeet != null ? (
              <>
                <dt className="text-muted-foreground">Altitude</dt>
                <dd>{Math.round(selectedAc.altitudeFeet)} ft</dd>
              </>
            ) : null}
            {selectedAc?.groundSpeed != null ? (
              <>
                <dt className="text-muted-foreground">Speed</dt>
                <dd>{selectedAc.groundSpeed.toFixed(0)} kts</dd>
              </>
            ) : null}
            {showRoute && selectedAc ? (
              <>
                <dt className="text-muted-foreground">Route</dt>
                <dd className="font-mono">
                  {formatFlightRoute(selectedAc, airportCodeFormat) ?? "—"}
                </dd>
              </>
            ) : null}
          </dl>
        </PanelCard>
      ) : null}
    </div>
  );
}
