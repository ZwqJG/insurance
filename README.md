# 儿童重疾险智能方案生成器 MVP

## 项目介绍

面向保险代理人的儿童重疾险智能方案生成工具。
代理人填写客户基本信息，系统自动从 JSON 产品数据中匹配 2~3 款儿童重疾险产品，
生成产品对比方案，代理人可基础修改后通过浏览器打印导出 PDF。

## 项目结构

```
insurance-proposal-mvp/
  backend/          Node.js + Express + TypeScript 后端
  frontend/         React + TypeScript + Vite 前端
  README.md
```

## 快速启动

### 1. 启动后端

```bash
cd backend
npm install
npm run dev
# 后端运行在 http://localhost:3000
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
# 前端运行在 http://localhost:5173
```

### 3. 打开浏览器

访问 http://localhost:5173 即可使用

## 产品数据维护

产品数据在 `backend/src/data/child-critical-illness.json`，
直接编辑 JSON 文件后重启后端服务即可生效。

## 导出 PDF

在方案预览页点击右上角「导出 PDF」按钮，
浏览器会弹出打印对话框，选择「另存为 PDF」即可。

## 分享短链

在方案预览页点击「生成短链」，系统会生成一个可直接发给客户的短链接，
格式类似 `http://localhost:5173/?s=xxxxxx`。
客户打开后可以直接查看该方案，并通过浏览器打印导出 PDF。

## 技术栈

- 前端：React 18 + TypeScript + Vite + Ant Design 5
- 后端：Node.js 20 + Express + TypeScript + Zod
- 产品数据：本地 JSON 文件
- PDF 导出：浏览器打印（window.print）
- 数据库：无
- 登录：无

## 部署

```bash
# 前端打包
cd frontend && npm run build

# 后端打包
cd backend && npm run build

# 用 Nginx 托管前端 dist，PM2 启动后端
pm2 start backend/dist/app.js --name insurance-proposal-api
```

详细部署配置参考产品说明书。
