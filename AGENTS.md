# GameFlow / GameTracker

一款用于记录游戏时间、管理游戏库的 Web 应用程序。

## 项目概述

GameFlow（前端项目名为 GameTracker）是一个游戏时间追踪和游戏资产管理系统，采用前后端分离架构。核心功能包括：

- **总览页 (`/`)**: 游戏数据统计、本周每日时长柱状图（含上周对比折线图）、最近游玩记录
- **游戏库 (`/library`)**: 游戏管理（增删改查），支持按平台（NS / PS4 / Xbox / Steam / APP / 网站）和类型（RPG / FPS / MOBA / SIM / ADV / OTHER）筛选
- **开始游玩 (`/timer`)**: 实时计时器，选择平台 → 选择游戏 → 开始/暂停/继续/停止计时，支持沉浸模式限定单款游戏
- **记录统计 (`/stats`)**: 展示最近 10 条游玩记录列表，支持手动补录（填时间段或直接填时长）
- **日历 (`/calendar`)**: 按日历视图查看每日游玩时长和点击日期查看当天明细记录
- **百科 (`/wiki`)**: 游戏类型百科，支持从后端 CRUD 管理类型及其代表游戏，支持图片上传
- **设计 (`/design`)**: 应用设置页，包含沉浸模式开关、主题切换（浅色/深色/跟随系统）、手机模式切换（自动/桌面/手机）、侧边栏悬浮开关

## 技术栈

### 前端
- **框架**: React 19.2.4 + React DOM 19.2.4
- **路由**: React Router DOM 7.14.0
- **构建工具**: Vite 8.0.4（开发服务器代理 `/api` 和 `/uploads` 到 `http://localhost:3003`）
- **HTTP 客户端**: Axios 1.15.0
- **图表**: Chart.js 4.5.1 + react-chartjs-2 5.3.1
- **日期处理**: dayjs 1.11.20
- **代码规范**: ESLint 9.39.4（Flat Config 格式），启用 `@eslint/js` 推荐规则、`eslint-plugin-react-hooks` 推荐规则、`eslint-plugin-react-refresh` Vite 配置

### 后端
- **运行环境**: Node.js 18+
- **框架**: Express 4.21.0
- **数据库**: PostgreSQL（驱动 `pg` 8.13.0）
- **文件上传**: multer 2.1.1（限制 5MB，仅图片）
- **配置管理**: dotenv 16.4.5
- **跨域**: cors 2.8.5

## 项目结构

```
GameFlow/
├── gametracker-client/       # 前端项目
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js          # API 封装层：axios 实例配置和所有 API 方法
│   │   ├── components/
│   │   │   └── Layout.jsx        # 布局组件：侧边栏导航 + 移动端顶部栏 + 沉浸模式横幅
│   │   ├── contexts/
│   │   │   ├── SettingsContext.jsx  # 设置上下文 Provider（主题、沉浸模式、移动端视图、侧边栏状态）
│   │   │   ├── settingsStore.js     # SettingsContext 与 defaultSettings 定义
│   │   │   └── useSettings.js       # 自定义 Hook
│   │   ├── pages/
│   │   │   ├── Overview.jsx      # 总览页
│   │   │   ├── Library.jsx       # 游戏库页（含筛选、增删改弹窗）
│   │   │   ├── Timer.jsx         # 开始游玩页（计时器、沉浸模式阻止遮罩）
│   │   │   ├── Stats.jsx         # 记录统计页（最近记录、补录表单）
│   │   │   ├── Calendar.jsx      # 日历页（月历 + 日期详情）
│   │   │   ├── Wiki.jsx          # 百科页（类型 CRUD、游戏 CRUD、图片上传）
│   │   │   └── Design.jsx        # 设计/设置页
│   │   ├── utils.js              # 工具函数：fmtDuration、gameInitial、类型/平台常量映射
│   │   ├── index.css             # 全局样式：CSS 变量（浅色+深色主题）、组件通用类
│   │   ├── main.jsx              # 应用入口
│   │   └── App.jsx               # 路由配置（BrowserRouter + 7 条 Route）
│   ├── public/                   # 静态资源（favicon、平台图标 SVG）
│   ├── dist/                     # 生产构建产物
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js            # Vite 配置（含代理）
│   └── eslint.config.js          # ESLint Flat Config
│
├── gametracker-server/       # 后端项目
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js          # PostgreSQL 连接池配置（Pool）
│   │   │   ├── init.js           # 数据库初始化脚本（建表 + 初始数据 + 示例记录）
│   │   │   ├── migrate-pause.js  # 迁移脚本：为 active_session 添加暂停相关字段
│   │   │   └── migrate-wiki.js   # 迁移脚本：为 genres/games 补齐百科字段并创建 wiki_games 表
│   │   ├── routes/
│   │   │   ├── games.js          # 游戏 CRUD 路由 + genres/platforms/list 别名
│   │   │   ├── sessions.js       # 计时/会话路由（start/stop/cancel/pause/resume/active/manual/recent）
│   │   │   ├── stats.js          # 统计/总览路由（overview、playtime）
│   │   │   ├── calendar.js       # 日历路由（月数据、日详情）
│   │   │   └── wiki.js           # 百科路由（genres CRUD、upload）
│   │   └── index.js              # Express 应用入口（挂载路由、定义 /api/overview、/api/genres、/api/platforms、/health）
│   ├── uploads/                  # 上传文件存放目录（运行时自动创建）
│   ├── .env                      # 环境变量（数据库配置、PORT）
│   ├── package.json
│   └── README.md
│
├── package.json              # 根项目脚本（使用 concurrently 同时启动前后端）
├── package-lock.json
├── GameFlow.md               # 原始需求设计文档（含数据库设计参考）
└── AGENTS.md                 # 本文档
```

## 开发命令

### 根项目（同时启动前后端）

```bash
# 安装所有依赖
npm run install:all

# 初始化数据库（首次运行需要）
npm run init-db

# 同时启动后端（http://localhost:3003）和前端开发服务器（http://localhost:5173）
npm run dev
```

### 前端 (gametracker-client)

```bash
cd gametracker-client

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览生产构建
npm run preview
```

### 后端 (gametracker-server)

```bash
cd gametracker-server

# 安装依赖
npm install

# 初始化数据库（创建表 + 插入初始类型/平台/游戏/示例游玩记录）
npm run init-db

# 启动开发服务器（Node.js --watch 自动重启）
npm run dev

# 生产模式启动
npm start

# 运行迁移脚本（如有需要）
npm run migrate-pause
node src/db/migrate-wiki.js
```

## 后端 API 端点

| 功能 | 方法 | 端点 | 说明 |
|------|------|------|------|
| 总览数据 | GET | `/api/overview` | 统计、本周图表、最近 5 条记录 |
| 游戏列表 | GET | `/api/games` | 支持 `genre_id`/`platform_id`/`genre_code`/`platform_code` 筛选 |
| 创建游戏 | POST | `/api/games` | |
| 更新游戏 | PUT | `/api/games/:id` | |
| 删除游戏 | DELETE | `/api/games/:id` | |
| 类型列表 | GET | `/api/genres` | |
| 平台列表 | GET | `/api/platforms` | |
| 开始计时 | POST | `/api/sessions/start` | 请求体 `{ game_id }` |
| 停止计时 | POST | `/api/sessions/:id/stop` | 保存记录并删除活跃会话 |
| 取消计时 | POST | `/api/sessions/:id/cancel` | 不保存记录直接删除活跃会话 |
| 暂停计时 | POST | `/api/sessions/:id/pause` | |
| 继续计时 | POST | `/api/sessions/:id/resume` | |
| 活跃会话 | GET | `/api/sessions/active` | 获取当前计时状态；暂停超过 15 分钟自动结束 |
| 手动补录 | POST | `/api/sessions/manual` | 支持 `start_time+end_time` 或 `duration+date` |
| 最近记录 | GET | `/api/sessions/recent` | 最近 10 条 |
| 时长统计 | GET | `/api/stats/playtime?period=week|month|year` | `week` 返回本周+上周对比数据 |
| 月历数据 | GET | `/api/calendar?year=YYYY&month=M` | |
| 日详情 | GET | `/api/calendar/day?date=YYYY-MM-DD` | |
| 百科类型 | GET | `/api/wiki/genres` | |
| 新增类型 | POST | `/api/wiki/genres` | |
| 更新类型 | PUT | `/api/wiki/genres/:code` | |
| 删除类型 | DELETE | `/api/wiki/genres/:code` | 软删除（`is_active = FALSE`） |
| 上传图片 | POST | `/api/wiki/upload` | `multipart/form-data`，单文件，限制 5MB |
| 健康检查 | GET | `/health` | |

## 数据库表结构

主要表：

- `genres` - 游戏类型表（含 `code`, `name`, `full_name`, `icon`, `theme_key`, `description`, `wiki_url`, `wiki_label`, `sort_order`, `is_active`）
- `platforms` - 游戏平台表
- `games` - 游戏表（关联 `genres` 和 `platforms`，含 `cover_url`, `official_url`, `publisher`, `wiki_intro`, `note`）
- `play_sessions` - 游玩记录表（关联 `games`，`duration` 以秒为单位，`source` 可为 `timer` / `manual` / `duration`）
- `active_session` - 当前计时状态表（全局唯一，通过 `one_active_session` 唯一索引保证只有一个活跃会话；含 `session_start_time`, `accumulated_seconds`, `paused`, `paused_at`）
- `wiki_games` - 百科游戏条目表（与 `games` 解耦，目前由迁移脚本维护）

性能索引：
- `idx_sessions_start_time` on `play_sessions(start_time)`
- `idx_sessions_game_id` on `play_sessions(game_id)`
- `idx_games_genre_id` on `games(genre_id)`
- `idx_games_platform_id` on `games(platform_id)`
- `idx_wiki_games_genre_id` on `wiki_games(genre_id)`

## 代码规范与约定

### ESLint 配置
- 使用 Flat Config 格式，配置在 `gametracker-client/eslint.config.js`
- 忽略 `dist` 目录
- 特殊规则：`no-unused-vars` 忽略大写字母开头的变量（允许 React 组件名样式未被使用时不报错）

### 命名规范
- 组件文件使用 PascalCase（如 `Overview.jsx`）
- 工具文件使用 camelCase（如 `utils.js`）
- API 方法使用 camelCase（如 `getOverview`, `startSession`）

### 样式规范
- 使用纯 CSS 自定义类名（非 CSS-in-JS），全局样式在 `src/index.css`
- 颜色主题基于紫色调（主色 `#7f77dd` / `#534ab7`）
- 边框使用 0.5px 细线风格
- 圆角统一使用 8px / 12px / 14px
- 支持通过 `data-theme="dark"` 切换深色主题

### 关键常量
- **游戏类型代码**: `RPG`, `FPS`, `MOBA`, `SIM`, `ADV`, `OTHER`
- **平台代码**: `NS`, `PS4`, `Xbox`, `Steam`, `APP`, `网站`
- 类型配色映射和平台图标映射定义在 `src/utils.js`

## 前端状态管理

设置状态通过 `SettingsContext` 管理，持久化到 `localStorage`（key: `gametracker-settings`）。

`defaultSettings` 包含：
- `immersiveMode: false` — 沉浸模式开关
- `immersiveGameId: null` — 沉浸模式限定的游戏 ID
- `themeMode: 'light'` — 主题模式（`light` / `dark` / `auto`）
- `mobileMode: 'auto'` — 移动端视图模式（`auto` / `mobile` / `desktop`）
- `isMobileView: false` — 当前是否处于移动端视图（由 `mobileMode` 和窗口尺寸/UserAgent 自动计算）
- `sidebarFloat: true` — 侧边栏是否悬浮
- `sidebarCollapsed: false` — 侧边栏是否收起

沉浸模式逻辑：
- 开启后，在 `/timer` 页面自动锁定为限定的游戏，无法选择其他游戏；若尝试选择其他游戏会弹出阻止遮罩。
- 在 `/library` 页面，非沉浸游戏卡片会显示 `blocked` 样式且编辑/删除按钮禁用。

## 计时系统说明

- 同时只能有一个游戏在计时，依赖后端 `active_session` 表做并发控制。
- 支持暂停/继续：暂停时会将已运行时长累加到 `accumulated_seconds`，并记录 `paused_at`；继续时重置 `start_time` 为当前时间。
- 前端和后端均有 15 分钟自动结束逻辑：若会话处于暂停状态且超过 15 分钟未恢复，自动停止并保存记录。
- 时长以秒为单位存储，展示时格式化为 `Xh Ym` 或 `Zm`。
- 跨天处理：一个 session 跨天时按 `start_time` 的日期归属统计，不做拆分。

## 测试策略

当前项目**没有配置测试框架和测试用例**。如需添加测试，建议：
- 前端：使用 Vitest（与 Vite 集成良好）+ React Testing Library
- 后端：使用 Node.js 内置 `node:test` 或 Jest + Supertest 测试 Express API

## 安全注意事项

1. **环境变量中的数据库凭据**：`gametracker-server/.env` 文件包含 PostgreSQL 数据库连接密码等敏感信息，**切勿将其提交到公开仓库**（已配置在 `.gitignore` 中，但仍需确认）。
2. **CORS**：后端当前使用 `app.use(cors())` 允许所有来源，生产环境建议限制为前端部署域名。
3. **文件上传**：`/api/wiki/upload` 限制了 5MB 且仅允许 `image/*` MIME 类型，上传文件存储在 `gametracker-server/uploads/wiki/` 目录并通过 `/uploads` 静态服务暴露。
4. **SQL 注入**：后端路由中使用参数化查询（`$1`, `$2`…），目前无直接拼接用户输入的情况，风险较低。
5. **SSL**：数据库连接池配置中 `ssl: false`，若数据库暴露在公网，建议启用 SSL/TLS。

## 部署提示

- 前端生产构建产物输出到 `gametracker-client/dist/`，可直接部署到静态托管服务。
- 后端生产启动命令为 `npm start`（在 `gametracker-server` 目录下），监听端口由 `.env` 中的 `PORT` 决定（默认 3003）。
- 若前后端部署到不同域名，需调整前端 `src/api/index.js` 中的 `API_BASE_URL` 或正确配置 Vite 代理/生产环境请求转发。
