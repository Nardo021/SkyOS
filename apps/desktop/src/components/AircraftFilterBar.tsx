import { IconPlane, IconPlaneArrival, IconStack2 } from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  useSettingsStore,
  type AircraftDisplayFilter,
} from "../stores/settingsStore";

const filters: {
  id: AircraftDisplayFilter;
  label: string;
  icon: typeof IconStack2;
}[] = [
  { id: "all", label: "全部", icon: IconStack2 },
  { id: "air", label: "空中", icon: IconPlane },
  { id: "ground", label: "地面", icon: IconPlaneArrival },
];

export function AircraftFilterBar() {
  const { aircraftFilter, setAircraftFilter, viewMode } = useSettingsStore();

  if (viewMode !== "dome" && viewMode !== "ceiling") {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">显示</Label>
      <ToggleGroup
        value={[aircraftFilter]}
        onValueChange={(v) => {
          const next = v[0] as AircraftDisplayFilter | undefined;
          if (next) setAircraftFilter(next);
        }}
        variant="outline"
        size="sm"
        spacing={0}
      >
        {filters.map((f) => (
          <ToggleGroupItem key={f.id} value={f.id} aria-label={f.label}>
            <f.icon data-icon="inline-start" />
            {f.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
