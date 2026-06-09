import { useEffect, useRef } from "react";
import {
  IconAlertTriangle,
  IconDatabase,
  IconMapPin,
  IconPlane,
  IconDeviceFloppy,
  IconRadio,
} from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { PanelCard } from "@/components/panel-card";
import {
  clampRadiusKm,
  clampRefreshSecs,
  MAX_RADIUS_KM,
  MAX_REFRESH_SECS,
  MIN_RADIUS_KM,
  MIN_REFRESH_SECS,
  useSettingsStore,
} from "../stores/settingsStore";
import { useSkyStore } from "../stores/skyStore";
import {
  setObserver,
  setRadiusKm,
  setRefreshSecs,
} from "../lib/tauriConfig";

export function LeftPanel() {
  const {
    lat,
    lon,
    altitudeM,
    radiusKm,
    refreshSecs,
    setLocation,
    setRadiusKm: setRadiusLocal,
    setRefreshSecs: setRefreshLocal,
  } = useSettingsStore();
  const { source, aircraftCount, updatedAt, error } = useSkyStore();

  const applyLocation = async () => {
    await setObserver(lat, lon, altitudeM);
  };

  const backendSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (backendSyncRef.current) clearTimeout(backendSyncRef.current);
    backendSyncRef.current = setTimeout(() => {
      void setRadiusKm(clampRadiusKm(radiusKm));
      void setRefreshSecs(clampRefreshSecs(refreshSecs));
    }, 350);
    return () => {
      if (backendSyncRef.current) clearTimeout(backendSyncRef.current);
    };
  }, [radiusKm, refreshSecs]);

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString()
    : "—";

  return (
    <PanelCard
      title="Settings"
      icon={IconMapPin}
      className="flex h-full flex-col"
      contentClassName="flex flex-col gap-4"
    >
      <Alert>
        <IconRadio />
        <AlertDescription>
          <span className="font-medium text-foreground">实时 ADS-B</span>
          <br />
          <span className="text-muted-foreground">
            Airplanes.live → OpenSky 备用
          </span>
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <IconDatabase data-icon="inline-start" />
        Source: <span className="text-foreground">{source}</span>
      </div>

      {error ? (
        <Alert variant="destructive">
          <IconAlertTriangle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {aircraftCount === 0 && !error ? (
        <Alert>
          <IconAlertTriangle />
          <AlertDescription>
            该区域暂无 ADS-B 数据，可扩大半径或稍后再试。
          </AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="lat">Lat</FieldLabel>
            <Input
              id="lat"
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) =>
                setLocation(Number(e.target.value), lon, altitudeM)
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lon">Lon</FieldLabel>
            <Input
              id="lon"
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) =>
                setLocation(lat, Number(e.target.value), altitudeM)
              }
            />
          </Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="alt">Altitude (m)</FieldLabel>
            <Input
              id="alt"
              type="number"
              value={altitudeM}
              onChange={(e) =>
                setLocation(lat, lon, Number(e.target.value))
              }
            />
          </Field>
        </div>

        <Button onClick={applyLocation} className="w-full">
          <IconDeviceFloppy data-icon="inline-start" />
          Apply location
        </Button>

        <Field>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="radius-km">半径</FieldLabel>
            <span className="font-mono text-xs text-muted-foreground">
              {radiusKm} km
            </span>
          </div>
          <Slider
            id="radius-km"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            step={1}
            value={[radiusKm]}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v;
              if (typeof next === "number") setRadiusLocal(clampRadiusKm(next));
            }}
          />
          <Input
            type="number"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            step={1}
            value={radiusKm}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setRadiusLocal(clampRadiusKm(n));
            }}
            className="font-mono"
          />
          <FieldDescription>
            {MIN_RADIUS_KM}–{MAX_RADIUS_KM} km，影响飞机与机场数据范围
          </FieldDescription>
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="refresh-secs">刷新间隔</FieldLabel>
            <span className="font-mono text-xs text-muted-foreground">
              {refreshSecs} s
            </span>
          </div>
          <Slider
            id="refresh-secs"
            min={MIN_REFRESH_SECS}
            max={MAX_REFRESH_SECS}
            step={1}
            value={[refreshSecs]}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v;
              if (typeof next === "number")
                setRefreshLocal(clampRefreshSecs(next));
            }}
          />
          <FieldDescription>
            仅拉取飞机位置，默认 1s（Airplanes.live）；机场跑道约 45s
            更新一次。首选 Airplanes.live；若频繁失败会走 OpenSky（建议 ≥10s）。
          </FieldDescription>
        </Field>
      </FieldGroup>

      <Separator />

      <div className="mt-auto flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-1.5">
          <IconPlane data-icon="inline-start" className="text-primary" />
          Aircraft:{" "}
          <span className="font-medium text-primary">{aircraftCount}</span>
        </div>
        <div className="text-muted-foreground">Updated: {updatedLabel}</div>
      </div>
    </PanelCard>
  );
}
