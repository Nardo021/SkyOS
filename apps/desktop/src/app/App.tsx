import { useEffect, useState } from "react";
import { NavLink, BrowserRouter, Route, Routes } from "react-router-dom";
import { IconDatabase, IconRadio, IconSparkles } from "@tabler/icons-react";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LiveSky } from "../pages/LiveSky";
import { DataSources } from "../pages/DataSources";
import {
  hydrateFromSkyConfig,
  initConfigSync,
  loadSkyConfig,
} from "../lib/configBridge";
import { connectSkySocket } from "../lib/skySocket";
import { loadConfig, setDataMode } from "../lib/tauriConfig";
import { useSkyStore } from "../stores/skyStore";
import { useSettingsStore } from "../stores/settingsStore";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    isActive && "bg-muted text-foreground",
  );

export function App() {
  const [wsUrl, setWsUrl] = useState("ws://127.0.0.1:9731/sky");
  const setSnapshot = useSkyStore((s) => s.setSnapshot);
  const setWsStatus = useSkyStore((s) => s.setWsStatus);
  const hydrate = useSettingsStore((s) => s.hydrateFromConfig);

  useEffect(() => {
    let conn: ReturnType<typeof connectSkySocket> | undefined;
    let stopSync: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      let url = "ws://127.0.0.1:9731/sky";
      try {
        const { config, wsUrl: cfgUrl } = await loadConfig();
        url = cfgUrl;
        if (!cancelled) {
          setWsUrl(url);
          hydrate({
            lat: config.observer.lat,
            lon: config.observer.lon,
            altitudeM: config.observer.altitudeM,
            radiusKm: config.data.radiusKm,
            refreshSecs: config.data.refreshSecs,
            mode: "live",
          });
          await setDataMode("live");
          await loadSkyConfig();
        }
      } catch {
        /* browser-only dev without Tauri */
      }
      if (!cancelled) {
        stopSync = initConfigSync();
        conn = connectSkySocket(
          url,
          {
            onSnapshot: setSnapshot,
            onConfig: hydrateFromSkyConfig,
            onStatus: setWsStatus,
          },
          "display",
        );
      }
    })();

    return () => {
      cancelled = true;
      stopSync?.();
      conn?.disconnect();
    };
  }, [setSnapshot, setWsStatus, hydrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        const el = document.documentElement;
        if (document.fullscreenElement) void document.exitFullscreen();
        else void el.requestFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex h-full flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-2">
          <span
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "pointer-events-none gap-1.5 font-semibold tracking-wide text-primary",
            )}
          >
            <IconSparkles data-icon="inline-start" />
            SkyOS
          </span>
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex items-center gap-1">
            <NavLink to="/" className={navClass} end>
              <IconRadio data-icon="inline-start" />
              Live Sky
            </NavLink>
            <NavLink to="/sources" className={navClass}>
              <IconDatabase data-icon="inline-start" />
              Data Sources
            </NavLink>
          </nav>
        </header>
        <div className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<LiveSky wsUrl={wsUrl} />} />
            <Route path="/sources" element={<DataSources />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
