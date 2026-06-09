import { useEffect, useRef, useState } from "react";
import type { LocationProfile } from "@skyos/config";
import {
  IconAlertTriangle,
  IconDatabase,
  IconMapPin,
  IconPlane,
  IconDeviceFloppy,
  IconRadio,
  IconSearch,
  IconTrash,
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
import { applySkyPatch } from "../lib/configBridge";
import { setObserver, setRadiusKm, setRefreshSecs } from "../lib/tauriConfig";

type LeftPanelProps = {
  httpBase?: string;
};

export function LeftPanel({ httpBase = "http://127.0.0.1:9731" }: LeftPanelProps) {
  const {
    lat,
    lon,
    altitudeM,
    locationName,
    locationProfiles,
    radiusKm,
    refreshSecs,
    setLocation,
    setLocationName,
    setLocationProfiles,
    setRadiusKm: setRadiusLocal,
    setRefreshSecs: setRefreshLocal,
  } = useSettingsStore();
  const { source, aircraftCount, updatedAt, error } = useSkyStore();
  const [geoQuery, setGeoQuery] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  const applyLocation = async () => {
    await setObserver(lat, lon, altitudeM);
    await applySkyPatch({
      centerLat: lat,
      centerLon: lon,
      altitudeM,
      locationName,
    });
  };

  const searchLocation = async () => {
    const q = geoQuery.trim();
    if (!q) return;
    setGeoBusy(true);
    setGeoErr(null);
    try {
      const r = await fetch(`${httpBase}/api/geocode?q=${encodeURIComponent(q)}`);
      if (!r.ok) {
        setGeoErr(r.status === 404 ? `未找到「${q}」` : "搜索失败");
        return;
      }
      const hit = (await r.json()) as { lat: number; lon: number; name: string };
      setLocation(hit.lat, hit.lon, altitudeM);
      setLocationName(hit.name);
      await applySkyPatch({
        centerLat: hit.lat,
        centerLon: hit.lon,
        locationName: hit.name,
      });
      await setObserver(hit.lat, hit.lon, altitudeM);
    } catch {
      setGeoErr("搜索失败");
    } finally {
      setGeoBusy(false);
    }
  };

  const genId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const atCurrent = (p: { lat: number; lon: number }) =>
    Math.abs(p.lat - lat) < 1e-4 && Math.abs(p.lon - lon) < 1e-4;

  const saveProfile = async () => {
    const name = locationName.trim() || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const profile: LocationProfile = {
      id: genId(),
      name,
      lat,
      lon,
      radiusKm,
    };
    const rest = locationProfiles.filter((p) => !atCurrent(p));
    const next = [...rest, profile];
    setLocationProfiles(next);
    await applySkyPatch({ locationProfiles: next });
  };

  const applyProfile = async (p: LocationProfile) => {
    setLocation(p.lat, p.lon, altitudeM);
    setLocationName(p.name);
    setRadiusLocal(p.radiusKm);
    await applySkyPatch({
      centerLat: p.lat,
      centerLon: p.lon,
      locationName: p.name,
      radiusKm: p.radiusKm,
    });
    await setObserver(p.lat, p.lon, altitudeM);
  };

  const removeProfile = async (id: string) => {
    const next = locationProfiles.filter((p) => p.id !== id);
    setLocationProfiles(next);
    await applySkyPatch({ locationProfiles: next });
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
        <Field>
          <FieldLabel htmlFor="location-search">地点搜索</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="location-search"
              placeholder="城市名或 lat,lon"
              value={geoQuery}
              onChange={(e) => setGeoQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void searchLocation();
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={geoBusy}
              onClick={() => void searchLocation()}
              aria-label="搜索地点"
            >
              <IconSearch />
            </Button>
          </div>
          {locationName ? (
            <FieldDescription>当前：{locationName}</FieldDescription>
          ) : null}
          {geoErr ? (
            <FieldDescription className="text-destructive">{geoErr}</FieldDescription>
          ) : null}
        </Field>

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

        <Button onClick={() => void applyLocation()} className="w-full">
          <IconDeviceFloppy data-icon="inline-start" />
          Apply location
        </Button>

        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void saveProfile()}>
            保存当前地点
          </Button>
          {locationProfiles.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {locationProfiles.map((p) => (
                <li key={p.id} className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start text-xs"
                    onClick={() => void applyProfile(p)}
                  >
                    {p.name}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-7 px-0"
                    onClick={() => void removeProfile(p.id)}
                    aria-label={`删除 ${p.name}`}
                  >
                    <IconTrash className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

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
