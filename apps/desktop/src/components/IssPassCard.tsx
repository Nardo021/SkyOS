import { useEffect, useMemo, useState } from "react";
import { nextISSPass, type Tle } from "@skyos/skylight";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { fetchTleFromBackend } from "../lib/tle";
import { useSettingsStore } from "../stores/settingsStore";

export function IssPassCard() {
  const { lat, lon, ceilingSkyTimeOffsetMin, setCeiling } = useSettingsStore();
  const [tles, setTles] = useState<Tle[]>([]);

  useEffect(() => {
    void fetchTleFromBackend().then(setTles);
  }, []);

  const passMs = useMemo(
    () => (tles.length ? nextISSPass(Date.now(), lat, lon, tles) : null),
    [tles, lat, lon],
  );

  const jumpToPass = () => {
    if (!passMs) return;
    const offsetMin = Math.round((passMs - Date.now()) / 60000);
    setCeiling({ ceilingSkyTimeOffsetMin: offsetMin });
  };

  return (
    <>
      <Field>
        <div className="flex justify-between text-xs text-muted-foreground">
          <FieldLabel>天空时间偏移</FieldLabel>
          <span className="font-mono">{ceilingSkyTimeOffsetMin} min</span>
        </div>
        <input
          type="range"
          className="w-full accent-primary"
          min={-720}
          max={720}
          step={15}
          value={ceilingSkyTimeOffsetMin}
          onChange={(e) =>
            setCeiling({ ceilingSkyTimeOffsetMin: Number(e.target.value) })
          }
        />
        <FieldDescription>
          {ceilingSkyTimeOffsetMin === 0 ? "实时" : "相对当前时间的偏移"}
        </FieldDescription>
      </Field>
      {passMs ? (
        <Field>
          <FieldLabel className="text-xs">下次 ISS 过境</FieldLabel>
          <FieldDescription>
            {new Date(passMs).toLocaleString()}（约{" "}
            {Math.max(0, Math.round((passMs - Date.now()) / 60000))} 分钟后）
          </FieldDescription>
          <Button type="button" variant="outline" size="sm" onClick={jumpToPass}>
            跳转到过境时间
          </Button>
        </Field>
      ) : null}
    </>
  );
}
