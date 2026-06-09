import { useMemo, useRef } from "react";

import {
  filterAirportsInRadius,
  SkylightCeilingView,
  SkyScene,
} from "@skyos/renderer";
import { cn } from "@/lib/utils";
import { fetchTleFromBackend } from "@/lib/tle";
import { useCeilingSettings } from "@/lib/ceilingSettings";

import { LeftPanel } from "../components/LeftPanel";
import { RightPanel } from "../components/RightPanel";
import { StatusBar } from "../components/StatusBar";
import { ViewModeSwitcher } from "../components/ViewModeSwitcher";
import { DebugMapView } from "../components/DebugMapView";
import { httpBaseFromWsUrl } from "../lib/tauriConfig";
import { useSkyStore } from "../stores/skyStore";
import { useSettingsStore } from "../stores/settingsStore";

interface LiveSkyProps {
  wsUrl: string;
}

export function LiveSky({ wsUrl }: LiveSkyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    observer,
    skyObjects,
    aircraft,
    trails,
    runways,
    airportLabels,
    selectedId,
    selectAircraft,
    updatedAt,
  } = useSkyStore();

  const settings = useSettingsStore();
  const ceilingSettings = useCeilingSettings();

  const { airportLabels: airportsInRange, runways: runwaysInRange } = useMemo(
    () =>
      filterAirportsInRadius(
        airportLabels,
        runways,
        settings.radiusKm,
        observer,
      ),
    [airportLabels, runways, settings.radiusKm, observer],
  );

  const rendererOptions = {
    showCallsign: settings.showCallsign,
    showAltitude: settings.showAltitude,
    showSpeed: settings.showSpeed,
    showHeading: settings.showHeading,
    showRoute: settings.showRoute,
    airportCodeFormat: settings.airportCodeFormat,
    showTrails: settings.showTrails,
    showRunways: settings.showRunways,
    showHorizon: settings.showHorizon,
    useAltitudeColor: settings.useAltitudeColor,
    useDistanceScale: settings.useDistanceScale,
    iconScale: settings.iconScale,
    selectedId,
    aircraftFilter: settings.aircraftFilter,
    interpolateMotion: settings.interpolateMotion,
    renderFpsMode: settings.renderFpsMode,
    renderFps: settings.renderFps,
    interpolationDurationMs: settings.refreshSecs * 1000,
  };

  const mapObserver = observer ?? {
    lat: settings.lat,
    lon: settings.lon,
    altitudeM: settings.altitudeM,
  };

  const sceneProps = {
    observer: mapObserver,
    skyObjects,
    aircraft,
    trails,
    runways: runwaysInRange,
    airportLabels: airportsInRange,
    options: rendererOptions,
  };

  const onFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen();
    }
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-background">
      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <aside className="w-56 shrink-0">
          <LeftPanel httpBase={httpBaseFromWsUrl(wsUrl)} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-2">
          <ViewModeSwitcher />

          <div
            className={cn(
              "relative min-h-0 flex-1 overflow-hidden",
              settings.viewMode === "ceiling"
                ? "rounded-none border-0 ring-0"
                : "rounded-xl border border-border ring-1 ring-foreground/10",
            )}
          >
            {settings.viewMode === "dome" && (
              <SkyScene {...sceneProps} dataTick={updatedAt ?? 0} />
            )}

            {settings.viewMode === "ceiling" && (
              <SkylightCeilingView
                {...sceneProps}
                observer={mapObserver}
                ceilingSettings={ceilingSettings}
                bearingLocked={settings.ceilingBearingLocked}
                onBearingChange={settings.setCeilingBearingDeg}
                fetchTle={fetchTleFromBackend}
              />
            )}

            {settings.viewMode === "map" && (
              <DebugMapView
                lat={settings.lat}
                lon={settings.lon}
                radiusKm={settings.radiusKm}
                aircraft={aircraft}
                selectedId={selectedId}
                onSelect={selectAircraft}
              />
            )}
          </div>
        </main>

        <aside className="w-52 shrink-0">
          <RightPanel />
        </aside>
      </div>

      <StatusBar wsUrl={wsUrl} onFullscreen={onFullscreen} />
    </div>
  );
}
