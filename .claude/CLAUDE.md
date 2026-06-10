# 部署规则

本项目部署在 **腾讯云 EdgeOne Pages**，使用 **Cloud Functions (Node.js)** 处理 API 请求。

## 目录结构

```
/
├── edgeone.json              # EdgeOne Pages 构建配置
├── package.json              # Cloud Functions 依赖（zod、dayjs）
├── node-functions/           # Cloud Functions 源码，路径自动映射为 URL
│   ├── api/proposals/
│   │   ├── generate.ts       → POST   /api/proposals/generate
│   │   └── share.ts          → POST   /api/proposals/share, GET /api/proposals/share?code=xxx
│   ├── services/             # 业务逻辑（从 backend 同步）
│   ├── shared/               # 工具函数（cors.ts）
│   ├── types/
│   ├── validators/
│   └── data/                 # 静态产品数据
├── frontend/                 # 前端 SPA（React + Vite）
└── backend/                  # 本地开发用 Express 服务（不部署）
```

## Cloud Functions 规则

1. **路径自动映射**：`node-functions/api/proposals/generate.ts` 对应 `POST /api/proposals/generate`，无需在 `edgeone.json` 配 rewrites。
2. **路径段数必须一致**：`[param].ts` 只匹配**一段**路径。例如 `api/proposals/[code].ts` 匹配 `/api/proposals/abc` 但不匹配 `/api/proposals/share/abc`（两段）。多段路径用目录嵌套：`api/proposals/share/[code].ts` → `/api/proposals/share/:code`。
3. **⚠️ 不可跨文件共享内存状态**：EdgeOne Pages 对每个 `.ts` 文件独立打包，各自文件的 `import` 会获得独立的模块实例。如果两个函数的业务逻辑需要共享同一份数据（如内存 Map），**必须放在同一个 `.ts` 文件中**，通过查询参数 `?code=xxx` 区分操作。
4. **Handler 签名**：使用 `export async function onRequestGet(context)` / `onRequestPost(context)` 按 HTTP 方法导出，参数类型 `{ request: Request, params: Record<string, string> }`。
5. **CORS**：每个 handler 需同时导出 `onRequestOptions` 处理预检请求，响应头统一用 `shared/cors.ts` 中的 `corsHeaders`。
6. **响应格式**：使用 `shared/cors.ts` 的 `jsonResponse(data, status)` 工具函数。
7. **依赖管理**：函数所需依赖（如 `zod`、`dayjs`）放在根目录 `package.json`，由 `installCommand` 安装。
8. **纯函数服务**：`services/productMatch.service.ts` 和 `services/proposalGenerate.service.ts` 保持纯函数，无副作用。
9. **数据持久化**：**不可使用 `fs.readFile/writeFile`**，Serverless 环境文件系统临时性。MVP 使用内存 Map 存储分享数据（冷启动丢失），后续需升级为数据库或 Blob 存储。
10. **短链策略**：EdgeOne Pages 上推荐使用前端生成的压缩自包含链接（`/?d=...`），不要把生产可用性建立在内存 Map 短码（`?s=xxx`）上；后者只适合本地开发或临时兼容。

## edgeone.json 关键配置

- `installCommand`：必须安装**两个目录**的依赖——根目录（函数依赖）和 `frontend/`（前端依赖）
- 不设 `rootDir`，函数放根目录，通过 `cd frontend` 构建前端
- `outputDirectory` 指向 `frontend/dist`

## 本地开发

后端仍用 `backend/` 目录的 Express 服务：`cd backend && npm run dev`（端口 3000）。
前端 `vite.config.ts` 中 `/api` 代理到 `localhost:3000`，与 EdgeOne 部署互不影响。

## 新增/修改函数步骤

1. 在 `node-functions/` 下创建对应路径的文件
2. 导出 `onRequestGet/Post/Options` handler
3. 业务逻辑复用 `services/` 中的纯函数
4. 提交代码，推送到 GitHub，EdgeOne Pages 自动部署
