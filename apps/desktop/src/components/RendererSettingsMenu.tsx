import type { LabelDensity, Theme } from "@skyos/skylight";
import {
  IconArrowsMoveHorizontal,
  IconCircle,
  IconCompass,
  IconEye,
  IconGauge,
  IconMoon,
  IconPalette,
  IconPlane,
  IconRoute,
  IconSettings,
  IconSparkles,
  IconSun,
  IconTag,
  IconWorld,
} from "@tabler/icons-react";
import type { TablerIcon } from "@/lib/tabler-icon";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { IssPassCard } from "./IssPassCard";

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
    <Field orientation="horizontal">
      <FieldLabel htmlFor={id} className="flex items-center gap-2 text-xs">
        <ItemIcon data-icon="inline-start" className="text-muted-foreground" />
        {label}
      </FieldLabel>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </Field>
  );
}

const altitudeLegend = [
  { color: "#4ade80", label: "< 3,000 ft" },
  { color: "#fbbf24", label: "3k – 10k ft" },
  { color: "#fb923c", label: "10k – 25k ft" },
  { color: "#f87171", label: "> 25k ft" },
] as const;

export function RendererSettingsMenu() {
  const s = useSettingsStore();
  const isCeiling = s.viewMode === "ceiling";

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
      <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-0" align="end">
        <ScrollArea className="max-h-[min(70vh,28rem)]">
          <div className="p-4">
            <PopoverTitle className="text-sm font-semibold">渲染设置</PopoverTitle>
            <PopoverDescription className="mt-1 text-xs text-muted-foreground">
              Sky Dome / Ceiling 显示选项
            </PopoverDescription>

            <Separator className="my-3" />

            <FieldSet>
              <FieldLegend className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                标签
              </FieldLegend>
              <FieldGroup className="gap-3">
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
                <SettingSwitch
                  id="popover-show-airline"
                  label="航司"
                  icon={IconTag}
                  checked={s.showAirline}
                  onCheckedChange={(v) => s.setRenderer({ showAirline: v })}
                />
                <SettingSwitch
                  id="popover-show-type"
                  label="机型"
                  icon={IconPlane}
                  checked={s.showType}
                  onCheckedChange={(v) => s.setRenderer({ showType: v })}
                />
                <SettingSwitch
                  id="popover-show-registration"
                  label="注册号"
                  icon={IconTag}
                  checked={s.showRegistration}
                  onCheckedChange={(v) => s.setRenderer({ showRegistration: v })}
                />
                <Field>
                  <FieldLabel className="text-xs text-muted-foreground">
                    机场代码
                  </FieldLabel>
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
                </Field>
              </FieldGroup>
            </FieldSet>

            <Separator className="my-3" />

            <FieldSet>
              <FieldLegend className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                实时渲染
              </FieldLegend>
              <FieldGroup className="gap-3">
                <SettingSwitch
                  id="popover-interpolate"
                  label="位置插值动画"
                  icon={IconGauge}
                  checked={s.interpolateMotion}
                  onCheckedChange={(v) => s.setRenderer({ interpolateMotion: v })}
                />
                <Field>
                  <FieldLabel className="text-xs text-muted-foreground">
                    渲染帧率
                  </FieldLabel>
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
                    <>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <FieldLabel htmlFor="render-fps">目标 FPS</FieldLabel>
                        <span className="font-mono">{s.renderFps}</span>
                      </div>
                      <Slider
                        id="render-fps"
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
                    </>
                  ) : (
                    <FieldDescription>
                      与显示器刷新率同步（通常 60–144Hz），在两次 ADS-B
                      更新之间平滑插值。
                    </FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>

            <Separator className="my-3" />

            <FieldSet>
              <FieldLegend className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                画面
              </FieldLegend>
              <FieldGroup className="gap-3">
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
                <Field>
                  <FieldLabel className="flex items-center gap-2 text-xs">
                    <IconEye data-icon="inline-start" className="text-muted-foreground" />
                    图标缩放 ({s.iconScale.toFixed(1)})
                  </FieldLabel>
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
                </Field>
              </FieldGroup>
            </FieldSet>

            {isCeiling ? (
              <>
                <Separator className="my-3" />
                <FieldSet>
                  <FieldLegend className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Ceiling 天空层
                  </FieldLegend>
                  <FieldGroup className="gap-3">
                    <SettingSwitch
                      id="popover-ceiling-stars"
                      label="恒星"
                      icon={IconSparkles}
                      checked={s.ceilingShowStars}
                      onCheckedChange={(v) => s.setCeiling({ ceilingShowStars: v })}
                    />
                    <SettingSwitch
                      id="popover-ceiling-sun"
                      label="太阳"
                      icon={IconSun}
                      checked={s.ceilingShowSun}
                      onCheckedChange={(v) => s.setCeiling({ ceilingShowSun: v })}
                    />
                    <SettingSwitch
                      id="popover-ceiling-moon"
                      label="月亮"
                      icon={IconMoon}
                      checked={s.ceilingShowMoon}
                      onCheckedChange={(v) => s.setCeiling({ ceilingShowMoon: v })}
                    />
                    <SettingSwitch
                      id="popover-ceiling-planets"
                      label="行星"
                      icon={IconWorld}
                      checked={s.ceilingShowPlanets}
                      onCheckedChange={(v) => s.setCeiling({ ceilingShowPlanets: v })}
                    />
                    <SettingSwitch
                      id="popover-ceiling-sats"
                      label="卫星 / ISS"
                      icon={IconSparkles}
                      checked={s.ceilingShowSatellites}
                      onCheckedChange={(v) =>
                        s.setCeiling({ ceilingShowSatellites: v })
                      }
                    />
                    <SettingSwitch
                      id="popover-ceiling-sat-labels"
                      label="卫星名称"
                      icon={IconTag}
                      checked={s.ceilingSatelliteLabels}
                      onCheckedChange={(v) =>
                        s.setCeiling({ ceilingSatelliteLabels: v })
                      }
                    />
                    <SettingSwitch
                      id="popover-ceiling-dest-arc"
                      label="目的地弧线"
                      icon={IconRoute}
                      checked={s.ceilingShowDestArc}
                      onCheckedChange={(v) => s.setCeiling({ ceilingShowDestArc: v })}
                    />
                    <SettingSwitch
                      id="popover-ceiling-route-detail"
                      label="航线详情"
                      icon={IconRoute}
                      checked={s.ceilingShowRouteDetail}
                      onCheckedChange={(v) =>
                        s.setCeiling({ ceilingShowRouteDetail: v })
                      }
                    />
                    <SettingSwitch
                      id="popover-ceiling-emergency"
                      label="紧急代码高亮"
                      icon={IconPlane}
                      checked={s.ceilingHighlightEmergency}
                      onCheckedChange={(v) =>
                        s.setCeiling({ ceilingHighlightEmergency: v })
                      }
                    />
                    <Field>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <FieldLabel>尾迹长度</FieldLabel>
                        <span className="font-mono">{s.ceilingTrailSeconds}s</span>
                      </div>
                      <Slider
                        min={0}
                        max={120}
                        step={5}
                        value={[s.ceilingTrailSeconds]}
                        onValueChange={(v) => {
                          const next = Array.isArray(v) ? v[0] : v;
                          if (typeof next === "number") {
                            s.setCeiling({ ceilingTrailSeconds: next });
                          }
                        }}
                      />
                    </Field>
                    <Field>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <FieldLabel>过期剔除</FieldLabel>
                        <span className="font-mono">{s.ceilingStaleSec}s</span>
                      </div>
                      <Slider
                        min={5}
                        max={60}
                        step={1}
                        value={[s.ceilingStaleSec]}
                        onValueChange={(v) => {
                          const next = Array.isArray(v) ? v[0] : v;
                          if (typeof next === "number") {
                            s.setCeiling({ ceilingStaleSec: next });
                          }
                        }}
                      />
                    </Field>
                    <Field>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <FieldLabel>最大外推</FieldLabel>
                        <span className="font-mono">
                          {s.ceilingMaxExtrapolationSec}s
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={15}
                        step={1}
                        value={[s.ceilingMaxExtrapolationSec]}
                        onValueChange={(v) => {
                          const next = Array.isArray(v) ? v[0] : v;
                          if (typeof next === "number") {
                            s.setCeiling({ ceilingMaxExtrapolationSec: next });
                          }
                        }}
                      />
                    </Field>
                    <IssPassCard />
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">
                        标签密度
                      </FieldLabel>
                      <ToggleGroup
                        value={[s.ceilingLabelDensity]}
                        onValueChange={(v) => {
                          const next = v[0] as LabelDensity | undefined;
                          if (next) s.setCeiling({ ceilingLabelDensity: next });
                        }}
                        variant="outline"
                        size="sm"
                        spacing={0}
                        className="w-full"
                      >
                        <ToggleGroupItem value="all" className="flex-1 text-xs">
                          全部
                        </ToggleGroupItem>
                        <ToggleGroupItem value="nearestN" className="flex-1 text-xs">
                          最近 N
                        </ToggleGroupItem>
                        <ToggleGroupItem value="nearestOnly" className="flex-1 text-xs">
                          最近 1
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">
                        主题
                      </FieldLabel>
                      <ToggleGroup
                        value={[s.ceilingTheme]}
                        onValueChange={(v) => {
                          const next = v[0] as Theme | undefined;
                          if (next) s.setCeiling({ ceilingTheme: next });
                        }}
                        variant="outline"
                        size="sm"
                        spacing={0}
                        className="w-full"
                      >
                        <ToggleGroupItem value="ambient" className="flex-1 text-xs">
                          氛围
                        </ToggleGroupItem>
                        <ToggleGroupItem value="telemetry" className="flex-1 text-xs">
                          遥测
                        </ToggleGroupItem>
                        <ToggleGroupItem value="focus" className="flex-1 text-xs">
                          聚焦
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </Field>
                    <Field>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <FieldLabel>亮度</FieldLabel>
                        <span className="font-mono">
                          {s.ceilingBrightness.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={0.3}
                        max={1}
                        step={0.05}
                        value={[s.ceilingBrightness]}
                        onValueChange={(v) => {
                          const next = Array.isArray(v) ? v[0] : v;
                          if (typeof next === "number") {
                            s.setCeiling({ ceilingBrightness: next });
                          }
                        }}
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </>
            ) : null}

            <Separator className="my-3" />

            <FieldSet>
              <FieldLegend className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                高度图例
              </FieldLegend>
              <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                {altitudeLegend.map(({ color, label }) => (
                  <li key={label} className="flex items-center gap-2">
                    <IconCircle
                      className="fill-current text-current"
                      style={{ color }}
                    />
                    {label}
                  </li>
                ))}
              </ul>
            </FieldSet>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
