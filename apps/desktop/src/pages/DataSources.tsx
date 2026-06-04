import { IconDatabase, IconRadio } from "@tabler/icons-react";
import { PanelCard } from "@/components/panel-card";

export function DataSources() {
  return (
    <div className="mx-auto max-w-lg p-6">
      <PanelCard title="实时数据源" icon={IconDatabase}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          SkyOS 仅使用公开 ADS-B 数据，启动后自动拉取真实飞机位置。
        </p>
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          <li className="flex gap-2">
            <IconRadio className="mt-0.5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Airplanes.live</strong>
              <span className="text-muted-foreground">
                {" "}
                — 首选，按半径（海里）查询附近飞机
              </span>
            </span>
          </li>
          <li className="flex gap-2">
            <IconDatabase className="mt-0.5 shrink-0 text-muted-foreground" />
            <span>
              <strong className="text-foreground">OpenSky Network</strong>
              <span className="text-muted-foreground">
                {" "}
                — 首选无数据或失败时自动备用
              </span>
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          请遵守各 API 非商业用途与限速。左侧可调刷新间隔（1–10
          秒，默认 2 秒）；Airplanes.live 首选，OpenSky 匿名备用且约 10
          秒/次，备用生效时请勿把间隔设得过低。
        </p>
      </PanelCard>
    </div>
  );
}
