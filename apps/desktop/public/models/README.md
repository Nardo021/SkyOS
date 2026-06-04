# Sky Dome 本地 3D 机型

将 GLB 放在此目录，开发时通过 `http://localhost:1420/models/<文件名>` 加载（`pnpm dev` / Tauri 打包后路径相同）。

## 通用回退（必放）

| 你的文件 | 保存为 |
|----------|--------|
| general 机型 | **`airplane.glb`**（文件名必须是 `airplane`，不是 `airplan`） |

Sky Dome 按 ADS-B 选具体机型；**无 `t` 字段、无法映射、或对应 GLB 加载失败**时一律用 `airplane.glb`。

## 机型文件名（与 FR24 模型库键名一致）

从 [fr24-3d-models/models](https://github.com/Flightradar24/fr24-3d-models/tree/master/models) 下载后，请**重命名为下表左侧文件名**（小写、无空格）：

| 机型 | 文件名 |
|------|--------|
| Boeing 737-600 | `b736.glb` |
| Boeing 737-700 | `b737.glb` |
| Boeing 737-800 | `b738.glb` |
| Boeing 737-900 | `b739.glb` |
| Boeing 747-400 | `b744.glb` |
| Boeing 747-8i | `b748.glb` |
| Boeing 757-200 | `b752.glb` |
| Boeing 757-300 | `b753.glb` |
| Boeing 767-200 | `b762.glb` |
| Boeing 767-300 | `b763.glb` |
| Boeing 767-400 | `b764.glb` |
| Boeing 777-200 | `b772.glb` |
| Boeing 777-300 | `b773.glb` |
| Boeing 787-800 | `b788.glb` |
| Boeing 787-900 | `b789.glb` |
| Airbus A318 | `a318.glb` |
| Airbus A319 | `a319.glb` |
| Airbus A320 | `a320.glb` |
| Airbus A321 | `a321.glb` |
| Airbus A330-200 | `a332.glb` |
| Airbus A330-300 | `a333.glb` |
| Airbus A340-300 | `a343.glb` |
| Airbus A340-600 | `a346.glb` |
| Airbus A350 | `a359.glb` |
| Airbus A380 | `a380.glb` |
| ATR 42 | `atr42.glb` |
| Cessna Citation II | `citation.glb` |
| Piper PA-28 | `pa28.glb` |
| Bombardier CRJ700 | `crj700.glb` |
| Bombardier CRJ900 | `crj900.glb` |
| Embraer E170 | `e170.glb` |
| Embraer E190 | `e190.glb` |
| Eurocopter EC135 | `heli.glb` |
| AN-225 Mriya | `an225.glb`（若上游只有 `.gltf`，请转换或导出为 GLB） |
| A300-600ST Beluga | `beluga.glb` |
| Bombardier CS100 | `cs100.glb` |
| Bombardier CS300 | `cs300.glb` |
| Bombardier Dash 8 Q400 | `q400.glb` |
| BAe 146 | `bae146.glb` |
| ASK 21 | `ask21.glb` |

## 未接入 SkyOS 映射的模型

以下文件可放在同目录备用，但**当前不会**被 ADS-B 机型码自动选用：

- Millennium Falcon、Santa Claus 等趣味模型（需在 `packages/renderer/src/aircraftModelCatalog.ts` 中自行增加键名与 ICAO 映射）

## 许可

若使用 Flightradar24 官方模型包，请遵守其 **GPLv2** 许可与署名要求。
