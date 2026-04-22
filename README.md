# GameFlow（原 GameTracker）

GameFlow 是一款用于记录游戏时间、管理游戏库的 Web 应用（前后端分离：React + Node.js/Express + PostgreSQL）。

## 功能概览

- 总览（`/`）：统计数据、本周每日时长图表、最近游玩记录
- 游戏库（`/library`）：游戏增删改查，按平台/类型筛选
- 游玩（`/timer`）：计时器（开始/暂停/继续/停止/取消），支持沉浸模式
- 记录（`/stats`）：最近记录列表 + 手动补录
- 日历（`/calendar`）：按日历查看每日时长与当日明细
- 百科（`/wiki`）：类型百科（后端维护类型百科字段与图片上传）
- 设计（`/design`）：主题/移动端视图/侧边栏/沉浸模式等设置

## 技术栈

### 前端（`gametracker-client`）

- React 19 + React Router DOM 7
- Vite 8
- Axios
- Chart.js 4 + react-chartjs-2
- dayjs
- ESLint（Flat Config）

### 后端（`gametracker-server`）

- Node.js 18+
- Express 4
- PostgreSQL（pg）
- multer（图片上传）
- dotenv + cors

## 目录结构

```
GameFlow/
├── gametracker-client/        # 前端（React + Vite）
│   ├── src/
│   │   ├── api/               # axios 实例 + API 方法封装
│   │   ├── components/        # Layout 等通用组件
│   │   ├── contexts/          # SettingsContext（主题/视图/侧边栏/沉浸模式）
│   │   ├── pages/             # 页面：Overview/Library/Timer/Stats/Calendar/Wiki/Design
│   │   ├── index.css          # 全局样式与主题变量
│   │   ├── App.jsx            # 路由配置
│   │   └── main.jsx           # 入口
│   └── vite.config.js         # Vite 配置（含 /api、/uploads 代理）
├── gametracker-server/        # 后端（Express + PostgreSQL）
│   ├── src/
│   │   ├── db/                # DB 连接与初始化/迁移脚本
│   │   ├── routes/            # API 路由
│   │   └── index.js           # 服务入口
│   └── README.md              # 后端说明
├── AGENTS.md                  # 项目约定与说明（更详细）
├── package.json               # 根脚本（concurrently 启动前后端）
└── README.md                  # 本文件
```

## 快速开始

### 1）安装依赖

```bash
npm run install:all
```

也可以分别安装：

```bash
cd gametracker-client && npm install
cd ../gametracker-server && npm install
```

### 2）配置后端环境变量（PostgreSQL）

在 `gametracker-server/` 下创建 `.env`（不要提交到仓库）：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gametracker
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3003
```

### 3）初始化数据库（首次运行需要）

```bash
npm run init-db
```

### 4）启动开发环境

```bash
npm run dev
```

- 后端默认：`http://localhost:3003`
- 前端默认：`http://localhost:5173`（如端口被占用会自动递增）

## 常用命令

### 前端

```bash
cd gametracker-client
npm run dev
npm run lint
npm run build
npm run preview
```

### 后端

```bash
cd gametracker-server
npm run dev
npm start
npm run init-db
```

## 开发说明

- 前端开发环境通过 Vite 代理将 `/api`、`/uploads` 转发到后端（默认 `http://localhost:3003`）。
- 项目详细说明、接口列表、数据库结构等请查看 [AGENTS.md](file:///c:/Data/Project/Local/GameFlow/AGENTS.md)。
