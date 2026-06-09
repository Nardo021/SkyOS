import { useEffect, useState } from "react";
import { IconCopy, IconRefresh, IconWifi } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PanelCard } from "@/components/panel-card";
import { applySkyPatch } from "../lib/configBridge";
import {
  getLanHttpUrl,
  regenerateRemoteToken,
} from "../lib/tauriConfig";
import { useSettingsStore } from "../stores/settingsStore";

export function RemoteControlCard() {
  const { remoteControlEnabled, configSyncEnabled, remoteAccessToken } =
    useSettingsStore();
  const [lanUrl, setLanUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!remoteControlEnabled) {
      setLanUrl(null);
      return;
    }
    void getLanHttpUrl().then(setLanUrl);
  }, [remoteControlEnabled]);

  const toggleRemote = (enabled: boolean) =>
    void applySkyPatch({ remoteControlEnabled: enabled });

  const toggleSync = (enabled: boolean) =>
    void applySkyPatch({ configSyncEnabled: enabled });

  const copyToken = () => {
    if (remoteAccessToken) void navigator.clipboard.writeText(remoteAccessToken);
  };

  const regenToken = async () => {
    const token = await regenerateRemoteToken();
    useSettingsStore.setState({ remoteAccessToken: token });
  };

  return (
    <PanelCard title="内网遥控" icon={IconWifi}>
      <FieldGroup className="gap-4">
        <Field orientation="horizontal">
          <FieldLabel htmlFor="remote-enabled" className="text-sm">
            启用遥控页
          </FieldLabel>
          <Switch
            id="remote-enabled"
            checked={remoteControlEnabled}
            onCheckedChange={toggleRemote}
          />
        </Field>
        <FieldDescription>
          开启后在内网提供 /control/ 静态页，需访问令牌。HTTP 与 WebSocket 绑定
          0.0.0.0。
        </FieldDescription>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="sync-enabled" className="text-sm">
            配置双向同步
          </FieldLabel>
          <Switch
            id="sync-enabled"
            checked={configSyncEnabled}
            onCheckedChange={toggleSync}
          />
        </Field>
        <FieldDescription>
          关闭时手机遥控页为只读，patchConfig 将被拒绝。
        </FieldDescription>

        {remoteControlEnabled ? (
          <>
            {lanUrl ? (
              <Field>
                <FieldLabel>遥控地址</FieldLabel>
                <Input readOnly value={lanUrl} className="font-mono text-xs" />
                <FieldDescription>
                  手机浏览器打开上述地址，输入下方令牌。请确保防火墙允许入站连接。
                </FieldDescription>
              </Field>
            ) : null}
            <Field>
              <FieldLabel>访问令牌</FieldLabel>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={remoteAccessToken || "（开启遥控后生成）"}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToken}
                  disabled={!remoteAccessToken}
                  aria-label="复制令牌"
                >
                  <IconCopy />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void regenToken()}
                  aria-label="重新生成令牌"
                >
                  <IconRefresh />
                </Button>
              </div>
            </Field>
          </>
        ) : null}
      </FieldGroup>
    </PanelCard>
  );
}
