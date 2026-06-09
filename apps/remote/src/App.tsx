import { useState } from "react";
import { ControlApp } from "./components/ControlApp";
import { useSkyConnection } from "./lib/useSkyConnection";

const TOKEN_KEY = "skyos-remote-token";

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [draft, setDraft] = useState(token);
  const active = token.trim();
  const { state, patchConfig, resetConfig } = useSkyConnection(active);

  if (!active) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-lg font-semibold">SkyOS 遥控</h1>
        <p className="text-center text-sm text-[var(--muted)]">
          输入桌面端「数据源」页中显示的内网访问令牌。
        </p>
        <input
          className="w-full max-w-sm rounded border border-[var(--border)] bg-[#12151c] px-3 py-2 text-sm"
          placeholder="访问令牌"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="button"
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm text-white"
          onClick={() => {
            const t = draft.trim();
            localStorage.setItem(TOKEN_KEY, t);
            setToken(t);
          }}
        >
          连接
        </button>
      </div>
    );
  }

  return <ControlApp state={state} patch={patchConfig} onReset={resetConfig} />;
}
