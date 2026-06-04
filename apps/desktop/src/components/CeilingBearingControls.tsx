import { useEffect, useState } from "react";
import {
  IconLock,
  IconLockOpen,
  IconRotate2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSettingsStore } from "../stores/settingsStore";

function normalizeDeg(deg: number) {
  return ((deg % 360) + 360) % 360;
}

const CARDINALS = [
  { deg: 0, label: "N" },
  { deg: 90, label: "E" },
  { deg: 180, label: "S" },
  { deg: 270, label: "W" },
] as const;

/** Ceiling map bearing: input, slider, lock, cardinal presets. */
export function CeilingBearingControls() {
  const {
    ceilingBearingDeg,
    ceilingBearingLocked,
    setCeilingBearingDeg,
    setCeilingBearingLocked,
  } = useSettingsStore();

  const [draftDeg, setDraftDeg] = useState(String(Math.round(ceilingBearingDeg)));

  useEffect(() => {
    setDraftDeg(String(Math.round(ceilingBearingDeg)));
  }, [ceilingBearingDeg]);

  const commitDraft = () => {
    const trimmed = draftDeg.trim();
    if (trimmed === "") {
      setDraftDeg(String(Math.round(ceilingBearingDeg)));
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      setDraftDeg(String(Math.round(ceilingBearingDeg)));
      return;
    }
    setCeilingBearingDeg(normalizeDeg(n));
  };

  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-1.5 border-l border-border pl-3">
      <Label
        htmlFor="ceiling-bearing-deg"
        className="shrink-0 text-xs text-muted-foreground"
        title="屏幕顶部所对的方向（0° = 北）"
      >
        朝向
      </Label>
      <div className="flex shrink-0 items-center gap-0.5">
        {CARDINALS.map(({ deg, label }) => (
          <Button
            key={deg}
            type="button"
            variant={Math.round(ceilingBearingDeg) === deg ? "secondary" : "outline"}
            size="xs"
            disabled={ceilingBearingLocked}
            className="h-6 min-w-6 px-1.5 text-[10px] font-semibold"
            aria-label={`${label} (${deg}°)`}
            onClick={() => setCeilingBearingDeg(deg)}
          >
            {label}
          </Button>
        ))}
      </div>
      <Input
        id="ceiling-bearing-deg"
        type="number"
        min={0}
        max={360}
        step={1}
        inputMode="numeric"
        disabled={ceilingBearingLocked}
        className="h-6 w-14 shrink-0 px-1.5 font-mono text-xs tabular-nums"
        value={draftDeg}
        onChange={(e) => setDraftDeg(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
            (e.target as HTMLInputElement).blur();
          }
        }}
        aria-label="朝向角度（度）"
      />
      <span className="text-xs text-muted-foreground">°</span>
      <Slider
        className="w-20 shrink-0"
        min={0}
        max={360}
        step={1}
        disabled={ceilingBearingLocked}
        value={[ceilingBearingDeg]}
        onValueChange={(v) => {
          const next = Array.isArray(v) ? v[0] : v;
          if (typeof next === "number") setCeilingBearingDeg(next);
        }}
        aria-label="朝向滑块"
      />
      <Button
        type="button"
        variant={ceilingBearingLocked ? "secondary" : "ghost"}
        size="icon-xs"
        className="shrink-0"
        title={ceilingBearingLocked ? "解锁朝向（可拖动地图旋转）" : "锁定朝向"}
        aria-pressed={ceilingBearingLocked}
        onClick={() => setCeilingBearingLocked(!ceilingBearingLocked)}
      >
        {ceilingBearingLocked ? <IconLock /> : <IconLockOpen />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0"
        title="北向上 (0°)"
        onClick={() => setCeilingBearingDeg(0)}
      >
        <IconRotate2 />
      </Button>
    </div>
  );
}
