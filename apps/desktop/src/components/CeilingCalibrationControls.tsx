import { useEffect, useState } from "react";
import {
  IconLock,
  IconLockOpen,
  IconMap,
  IconWorld,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  useSettingsStore,
  type CeilingProjectionMode,
} from "../stores/settingsStore";

const CARDINALS = [
  { deg: 0, label: "N" },
  { deg: 90, label: "E" },
  { deg: 180, label: "S" },
  { deg: 270, label: "W" },
] as const;

function normalizeDeg(n: number): number {
  return ((n % 360) + 360) % 360;
}

function cardinalValue(deg: number): string[] {
  const rounded = Math.round(deg);
  return CARDINALS.some((c) => c.deg === rounded) ? [String(rounded)] : [];
}

export function CeilingCalibrationControls() {
  const {
    ceilingBearingDeg,
    ceilingBearingLocked,
    ceilingProjectionMode,
    ceilingMirrorX,
    ceilingMirrorY,
    setCeilingBearingDeg,
    setCeilingBearingLocked,
    setCeiling,
  } = useSettingsStore();

  const [draftDeg, setDraftDeg] = useState(String(Math.round(ceilingBearingDeg)));

  useEffect(() => {
    setDraftDeg(String(Math.round(ceilingBearingDeg)));
  }, [ceilingBearingDeg]);

  const commitDeg = () => {
    const n = Number(draftDeg);
    if (!Number.isFinite(n)) {
      setDraftDeg(String(Math.round(ceilingBearingDeg)));
      return;
    }
    setCeilingBearingDeg(normalizeDeg(n));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/50 px-2 py-1.5">
      <ToggleGroup
        value={[ceilingProjectionMode]}
        onValueChange={(v) => {
          const next = v[0] as CeilingProjectionMode | undefined;
          if (next) setCeiling({ ceilingProjectionMode: next });
        }}
        variant="outline"
        size="sm"
        spacing={0}
      >
        <ToggleGroupItem value="sky" className="gap-1 text-xs">
          <IconWorld data-icon="inline-start" />
          穹顶
        </ToggleGroupItem>
        <ToggleGroupItem value="map" className="gap-1 text-xs">
          <IconMap data-icon="inline-start" />
          平面
        </ToggleGroupItem>
      </ToggleGroup>

      <Field className="w-auto">
        <FieldLabel htmlFor="ceiling-bearing-deg" className="sr-only">
          朝向
        </FieldLabel>
        <div className="flex items-center gap-1">
          <ToggleGroup
            value={cardinalValue(ceilingBearingDeg)}
            onValueChange={(v) => {
              const next = Number(v[0]);
              if (Number.isFinite(next)) setCeilingBearingDeg(next);
            }}
            variant="outline"
            size="sm"
            spacing={0}
            disabled={ceilingBearingLocked}
          >
            {CARDINALS.map(({ deg, label }) => (
              <ToggleGroupItem
                key={deg}
                value={String(deg)}
                className="min-w-7 px-1.5 font-mono text-xs"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <Input
            id="ceiling-bearing-deg"
            type="number"
            min={0}
            max={359}
            className="h-7 w-16 font-mono text-xs"
            value={draftDeg}
            disabled={ceilingBearingLocked}
            onChange={(e) => setDraftDeg(e.target.value)}
            onBlur={commitDeg}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitDeg();
            }}
          />

          <Slider
            className="w-24"
            min={0}
            max={359}
            step={1}
            disabled={ceilingBearingLocked}
            value={[ceilingBearingDeg]}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v;
              if (typeof next === "number") setCeilingBearingDeg(next);
            }}
          />
        </div>
      </Field>

      <Button
        type="button"
        size="icon-xs"
        variant={ceilingBearingLocked ? "secondary" : "ghost"}
        title={ceilingBearingLocked ? "解锁朝向（可拖动地图旋转）" : "锁定朝向"}
        aria-pressed={ceilingBearingLocked}
        onClick={() => setCeilingBearingLocked(!ceilingBearingLocked)}
      >
        {ceilingBearingLocked ? <IconLock /> : <IconLockOpen />}
      </Button>

      <div className="flex items-center gap-3 border-l border-border pl-2">
        <Field orientation="horizontal" className="w-auto">
          <FieldLabel htmlFor="ceiling-mirror-x" className="text-xs">
            镜像 X
          </FieldLabel>
          <Switch
            id="ceiling-mirror-x"
            checked={ceilingMirrorX}
            onCheckedChange={(v) => setCeiling({ ceilingMirrorX: v })}
          />
        </Field>
        <Field orientation="horizontal" className="w-auto">
          <FieldLabel htmlFor="ceiling-mirror-y" className="text-xs">
            Y
          </FieldLabel>
          <Switch
            id="ceiling-mirror-y"
            checked={ceilingMirrorY}
            onCheckedChange={(v) => setCeiling({ ceilingMirrorY: v })}
          />
        </Field>
      </div>
    </div>
  );
}
