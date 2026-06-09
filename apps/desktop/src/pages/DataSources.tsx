import { IconDatabase, IconRadio } from "@tabler/icons-react";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { PanelCard } from "@/components/panel-card";
import { RemoteControlCard } from "../components/RemoteControlCard";

export function DataSources() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-6">
      <PanelCard title="实时数据源" icon={IconDatabase}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          SkyOS 仅使用公开 ADS-B 数据，启动后自动拉取真实飞机位置。
        </p>
        <ItemGroup className="mt-4">
          <Item variant="outline">
            <ItemMedia variant="icon">
              <IconRadio />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Airplanes.live</ItemTitle>
              <ItemDescription>首选，按半径（海里）查询附近飞机</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline">
            <ItemMedia variant="icon">
              <IconDatabase />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>OpenSky Network</ItemTitle>
              <ItemDescription>首选无数据或失败时自动备用</ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
        <p className="mt-4 text-xs text-muted-foreground">
          请遵守各 API 非商业用途与限速。左侧可调刷新间隔（1–10
          秒，默认 2 秒）；Airplanes.live 首选，OpenSky 匿名备用且约 10
          秒/次，备用生效时请勿把间隔设得过低。
        </p>
      </PanelCard>
      <RemoteControlCard />
    </div>
  );
}
