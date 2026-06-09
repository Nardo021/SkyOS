import { IconPlane, IconPlaneArrival, IconStack2 } from "@tabler/icons-react";
import { Field, FieldLabel } from "@/components/ui/field";
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
    <Field orientation="horizontal" className="w-auto">
      <FieldLabel className="text-xs text-muted-foreground">显示</FieldLabel>
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
    </Field>
  );
}
