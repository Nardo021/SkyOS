import { useMemo, useState } from "react";
import type { LocationProfile, SkyConfig } from "@skyos/config";
import { nextISSPass } from "@skyos/skylight";
import type { ConnectionState } from "../lib/useSkyConnection";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[var(--border)] py-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">{label}</span>
        {hint ? <span className="text-xs text-[var(--muted)]">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`h-7 w-12 rounded-full border border-[var(--border)] px-0.5 transition ${checked ? "bg-[var(--accent)]" : "bg-[#1a1f2e]"}`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`block size-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={label} hint={`${value}${unit ?? ""}`}>
      <input
        type="range"
        className="w-full accent-[var(--accent)]"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Row>
  );
}

type Props = {
  state: ConnectionState;
  patch: (p: Partial<SkyConfig>) => void;
  onReset: () => void;
};

export function ControlApp({ state, patch, onReset }: Props) {
  const cfg = state.config;
  const [geoQuery, setGeoQuery] = useState("");
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);

  const issPassMs = useMemo(() => {
    if (!cfg || !state.tles.length) return null;
    return nextISSPass(Date.now(), cfg.centerLat, cfg.centerLon, state.tles);
  }, [cfg, state.tles]);

  if (!cfg) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--muted)]">
        {state.connected ? "加载配置…" : "连接中…"}
      </div>
    );
  }

  const searchLocation = async () => {
    const q = geoQuery.trim();
    if (!q) return;
    setGeoBusy(true);
    setGeoErr(null);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!r.ok) {
        setGeoErr(r.status === 404 ? "未找到地点" : "搜索失败");
        return;
      }
      const hit = (await r.json()) as { lat: number; lon: number; name: string };
      patch({ centerLat: hit.lat, centerLon: hit.lon, locationName: hit.name });
    } catch {
      setGeoErr("搜索失败");
    } finally {
      setGeoBusy(false);
    }
  };

  const genId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const saveProfile = () => {
    const name =
      cfg.locationName?.trim() ||
      `${cfg.centerLat.toFixed(4)}, ${cfg.centerLon.toFixed(4)}`;
    const profile: LocationProfile = {
      id: genId(),
      name,
      lat: cfg.centerLat,
      lon: cfg.centerLon,
      radiusKm: cfg.radiusKm,
    };
    const rest = cfg.locationProfiles.filter(
      (p) =>
        Math.abs(p.lat - cfg.centerLat) > 1e-4 ||
        Math.abs(p.lon - cfg.centerLon) > 1e-4,
    );
    patch({ locationProfiles: [...rest, profile] });
  };

  const acCount = state.snapshot?.aircraftCount ?? state.snapshot?.aircraft.length ?? 0;

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-8">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)] py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={`size-2 rounded-full ${state.connected ? "bg-emerald-400" : "bg-red-400"}`}
          />
          SkyOS 遥控
        </div>
        <div className="text-xs text-[var(--muted)]">
          {state.snapshot?.source ?? "—"} · {acCount} 架飞机
        </div>
      </header>

      <Section title="地点">
        <Row label={cfg.locationName || "位置"} hint={`${cfg.centerLat.toFixed(4)}, ${cfg.centerLon.toFixed(4)}`}>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[#12151c] px-3 py-2 text-sm"
              placeholder="城市或 lat,lon"
              value={geoQuery}
              onChange={(e) => setGeoQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void searchLocation();
              }}
            />
            <button
              type="button"
              className="rounded border border-[var(--border)] px-3 text-sm"
              disabled={geoBusy}
              onClick={() => void searchLocation()}
            >
              搜索
            </button>
          </div>
        </Row>
        {geoErr ? <p className="text-xs text-red-400">{geoErr}</p> : null}
        <div className="flex flex-wrap gap-2">
          {cfg.locationProfiles.map((p) => (
            <button
              key={p.id}
              type="button"
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs"
              onClick={() =>
                patch({
                  centerLat: p.lat,
                  centerLon: p.lon,
                  locationName: p.name,
                  radiusKm: p.radiusKm,
                })
              }
            >
              {p.name}
            </button>
          ))}
          <button
            type="button"
            className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs"
            onClick={saveProfile}
          >
            + 保存当前
          </button>
        </div>
        <SliderRow
          label="半径"
          value={cfg.radiusKm}
          min={1}
          max={100}
          step={1}
          unit=" km"
          onChange={(v) => patch({ radiusKm: v })}
        />
      </Section>

      <Section title="显示">
        <Row label="航司">
          <Toggle checked={cfg.showAirline} onChange={(v) => patch({ showAirline: v })} />
        </Row>
        <Row label="机型">
          <Toggle checked={cfg.showType} onChange={(v) => patch({ showType: v })} />
        </Row>
        <Row label="注册号">
          <Toggle
            checked={cfg.showRegistration}
            onChange={(v) => patch({ showRegistration: v })}
          />
        </Row>
        <Row label="目的地弧线">
          <Toggle
            checked={cfg.ceilingShowDestArc}
            onChange={(v) => patch({ ceilingShowDestArc: v })}
          />
        </Row>
        <Row label="航线详情">
          <Toggle
            checked={cfg.ceilingShowRouteDetail}
            onChange={(v) => patch({ ceilingShowRouteDetail: v })}
          />
        </Row>
        <SliderRow
          label="亮度"
          value={cfg.ceilingBrightness}
          min={0.3}
          max={1}
          step={0.05}
          onChange={(v) => patch({ ceilingBrightness: v })}
        />
      </Section>

      <Section title="运动">
        <Row label="插值">
          <Toggle
            checked={cfg.interpolateMotion}
            onChange={(v) => patch({ interpolateMotion: v })}
          />
        </Row>
        <SliderRow
          label="尾迹长度"
          value={cfg.ceilingTrailSeconds}
          min={0}
          max={120}
          step={5}
          unit=" s"
          onChange={(v) => patch({ ceilingTrailSeconds: v })}
        />
        <SliderRow
          label="过期时间"
          value={cfg.ceilingStaleSec}
          min={5}
          max={60}
          step={1}
          unit=" s"
          onChange={(v) => patch({ ceilingStaleSec: v })}
        />
        <SliderRow
          label="最大外推"
          value={cfg.ceilingMaxExtrapolationSec}
          min={0}
          max={15}
          step={1}
          unit=" s"
          onChange={(v) => patch({ ceilingMaxExtrapolationSec: v })}
        />
      </Section>

      <Section title="天空">
        <Row label="恒星">
          <Toggle
            checked={cfg.ceilingShowStars}
            onChange={(v) => patch({ ceilingShowStars: v })}
          />
        </Row>
        <Row label="卫星 / ISS">
          <Toggle
            checked={cfg.ceilingShowSatellites}
            onChange={(v) => patch({ ceilingShowSatellites: v })}
          />
        </Row>
        <SliderRow
          label="天空时间偏移"
          value={cfg.ceilingSkyTimeOffsetMin}
          min={-720}
          max={720}
          step={15}
          unit=" min"
          onChange={(v) => patch({ ceilingSkyTimeOffsetMin: v, skyTimeOffsetMin: v })}
        />
        {issPassMs ? (
          <div className="rounded border border-[var(--border)] p-3 text-sm">
            <div className="text-[var(--muted)]">下次 ISS 过境</div>
            <div>
              {new Date(issPassMs).toLocaleString()} (
              {Math.round((issPassMs - Date.now()) / 60000)} 分钟后)
            </div>
            <button
              type="button"
              className="mt-2 rounded bg-[var(--accent)] px-3 py-1.5 text-xs text-white"
              onClick={() => {
                const offsetMin = Math.round((issPassMs - Date.now()) / 60000);
                patch({
                  ceilingSkyTimeOffsetMin: offsetMin,
                  skyTimeOffsetMin: offsetMin,
                });
              }}
            >
              跳转到过境时间
            </button>
          </div>
        ) : null}
      </Section>

      <Section title="系统">
        <button
          type="button"
          className="w-full rounded border border-red-400/40 py-2 text-sm text-red-300"
          onClick={onReset}
        >
          重置为默认
        </button>
      </Section>
    </div>
  );
}
