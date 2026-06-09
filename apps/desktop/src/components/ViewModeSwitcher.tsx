import { IconCircle, IconMap, IconWorld } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AircraftFilterBar } from "./AircraftFilterBar";
import { CeilingCalibrationControls } from "./CeilingCalibrationControls";
import { RendererSettingsMenu } from "./RendererSettingsMenu";
import { useSettingsStore, type ViewMode } from "../stores/settingsStore";

const tabs: { id: ViewMode; label: string; icon: typeof IconWorld }[] = [
  { id: "dome", label: "Sky Dome", icon: IconWorld },
  { id: "ceiling", label: "Ceiling", icon: IconCircle },
  { id: "map", label: "Debug Map", icon: IconMap },
];

export function ViewModeSwitcher() {
  const { viewMode, setViewMode } = useSettingsStore();

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-nowrap items-center gap-3">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
        >
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                <t.icon data-icon="inline-start" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <AircraftFilterBar />
        {viewMode === "ceiling" ? <CeilingCalibrationControls /> : null}
      </div>
      <RendererSettingsMenu />
    </div>
  );
}
