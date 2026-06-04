import {
  IconArrowsMoveHorizontal,
  IconCircle,
  IconCompass,
  IconEye,
  IconGauge,
  IconPalette,
  IconPlane,
  IconRoute,
  IconSettings,
  IconTag,
} from "@tabler/icons-react";
import type { TablerIcon } from "@/lib/tabler-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  clampRenderFps,
  MAX_RENDER_FPS,
  MIN_RENDER_FPS,
  useSettingsStore,
  type RenderFpsMode,
} from "../stores/settingsStore";
import type { AirportCodeFormat } from "@skyos/types";

function SettingSwitch({
  id,
  label,
  icon: ItemIcon,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  icon: TablerIcon;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="flex items-center gap-2 text-xs font-normal">
        <ItemIcon className="size-3.5 shrink-0 text-muted-foreground" />
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function RendererSettingsMenu() {
  const s = useSettingsStore();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
          />
        }
      >
        <IconSettings data-icon="inline-start" />
        渲染设置
      </PopoverTrigger>
      <PopoverContent className="w-[min(20rem,calc(100vw-2rem))]" align="end">
        <div className="max-h-[min(70vh,28rem)] overflow-y-auto p-4">
          <PopoverTitle className="text-sm font-semibold">渲染设置</PopoverTitle>
          <PopoverDescription className="mt-1 text-xs text-muted-foreground">
            Sky Dome / Ceiling 显示选项
          </PopoverDescription>

          <Separator className="my-3" />

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            标签
          </p>
          <div className="flex flex-col gap-3">
            <SettingSwitch
              id="popover-show-callsign"
              label="呼号"
              icon={IconTag}
              checked={s.showCallsign}
              onCheckedChange={(v) => s.setRenderer({ showCallsign: v })}
            />
            <SettingSwitch
              id="popover-show-altitude"
              label="高度"
              icon={IconGauge}
              checked={s.showAltitude}
              onCheckedChange={(v) => s.setRenderer({ showAltitude: v })}
            />
            <SettingSwitch
              id="popover-show-speed"
              label="地速"
              icon={IconGauge}
              checked={s.showSpeed}
              onCheckedChange={(v) => s.setRenderer({ showSpeed: v })}
            />
            <SettingSwitch
              id="popover-show-heading"
              label="航向"
              icon={IconCompass}
              checked={s.showHeading}
              onCheckedChange={(v) => s.setRenderer({ showHeading: v })}
            />
            <SettingSwitch
              id="popover-show-route"
              label="起降机场"
              icon={IconRoute}
              checked={s.showRoute}
              onCheckedChange={(v) => s.setRenderer({ showRoute: v })}
            />
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-normal text-muted-foreground">
                机场代码
              </Label>
              <ToggleGroup
                value={[s.airportCodeFormat]}
                onValueChange={(v) => {
                  const next = v[0] as AirportCodeFormat | undefined;
                  if (next) s.setRenderer({ airportCodeFormat: next });
                }}
                variant="outline"
                size="sm"
                spacing={0}
                className="w-full"
              >
                <ToggleGroupItem value="icao" className="flex-1 text-xs">
                  四字 ICAO
                </ToggleGroupItem>
                <ToggleGroupItem value="iata" className="flex-1 text-xs">
                  三字 IATA
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <Separator className="my-3" />

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            实时渲染
          </p>
          <div className="flex flex-col gap-3">
            <SettingSwitch
              id="popover-interpolate"
              label="位置插值动画"
              icon={IconGauge}
              checked={s.interpolateMotion}
              onCheckedChange={(v) => s.setRenderer({ interpolateMotion: v })}
            />
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-normal text-muted-foreground">
                渲染帧率
              </Label>
              <ToggleGroup
                value={[s.renderFpsMode]}
                onValueChange={(v) => {
                  const next = v[0] as RenderFpsMode | undefined;
                  if (next) s.setRenderer({ renderFpsMode: next });
                }}
                variant="outline"
                size="sm"
                spacing={0}
                className="w-full"
              >
                <ToggleGroupItem value="display" className="flex-1 text-xs">
                  跟随显示器
                </ToggleGroupItem>
                <ToggleGroupItem value="custom" className="flex-1 text-xs">
                  自定义
                </ToggleGroupItem>
              </ToggleGroup>
              {s.renderFpsMode === "custom" ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>目标 FPS</span>
                    <span className="font-mono">{s.renderFps}</span>
                  </div>
                  <Slider
                    min={MIN_RENDER_FPS}
                    max={MAX_RENDER_FPS}
                    step={1}
                    value={[s.renderFps]}
                    onValueChange={(v) => {
                      const next = Array.isArray(v) ? v[0] : v;
                      if (typeof next === "number") {
                        s.setRenderer({ renderFps: clampRenderFps(next) });
                      }
                    }}
                  />
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  与显示器刷新率同步（通常 60–144Hz），在两次 ADS-B 更新之间平滑插值。
                </p>
              )}
            </div>
          </div>

          <Separator className="my-3" />

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            画面
          </p>
          <div className="flex flex-col gap-3">
            <SettingSwitch
              id="popover-show-trails"
              label="航迹"
              icon={IconRoute}
              checked={s.showTrails}
              onCheckedChange={(v) => s.setRenderer({ showTrails: v })}
            />
            <SettingSwitch
              id="popover-show-runways"
              label="跑道 / 机场"
              icon={IconPlane}
              checked={s.showRunways}
              onCheckedChange={(v) => s.setRenderer({ showRunways: v })}
            />
            <SettingSwitch
              id="popover-show-horizon"
              label="地平线 / 方位"
              icon={IconCompass}
              checked={s.showHorizon}
              onCheckedChange={(v) => s.setRenderer({ showHorizon: v })}
            />
            <SettingSwitch
              id="popover-use-alt-color"
              label="高度配色"
              icon={IconPalette}
              checked={s.useAltitudeColor}
              onCheckedChange={(v) => s.setRenderer({ useAltitudeColor: v })}
            />
            <SettingSwitch
              id="popover-use-dist-scale"
              label="距离缩放图标"
              icon={IconArrowsMoveHorizontal}
              checked={s.useDistanceScale}
              onCheckedChange={(v) => s.setRenderer({ useDistanceScale: v })}
            />
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2 text-xs font-normal">
                <IconEye className="size-3.5 text-muted-foreground" />
                图标缩放 ({s.iconScale.toFixed(1)})
              </Label>
              <Slider
                min={0.5}
                max={2}
                step={0.1}
                value={[s.iconScale]}
                onValueChange={(v) => {
                  const next = Array.isArray(v) ? v[0] : v;
                  if (typeof next === "number") {
                    s.setRenderer({ iconScale: next });
                  }
                }}
              />
            </div>
          </div>

          <Separator className="my-3" />

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            高度图例
          </p>
          <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <IconCircle className="size-2.5 fill-[#4ade80] text-[#4ade80]" />
              &lt; 3,000 ft
            </li>
            <li className="flex items-center gap-2">
              <IconCircle className="size-2.5 fill-[#fbbf24] text-[#fbbf24]" />
              3k – 10k ft
            </li>
            <li className="flex items-center gap-2">
              <IconCircle className="size-2.5 fill-[#fb923c] text-[#fb923c]" />
              10k – 25k ft
            </li>
            <li className="flex items-center gap-2">
              <IconCircle className="size-2.5 fill-[#f87171] text-[#f87171]" />
              &gt; 25k ft
            </li>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
