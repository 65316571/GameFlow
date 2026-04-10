# GameFlow / GameTracker

一款用于记录游戏时间、管理游戏库的 Web 应用程序。

## 项目概述

GameFlow（前端项目名为 GameTracker）是一个游戏时间追踪和游戏资产管理系统。核心功能包括：

- **总览页**: 游戏数据统计、本周时长柱状图（含上周对比）、最近游玩记录
- **游戏库**: 游戏管理（增删改查），支持按平台和类型筛选
- **开始游玩**: 实时计时器，选择游戏后开始/停止计时
- **记录统计**: 展示最近游玩记录列表，支持手动补录数据
- **日历**: 按日历视图查看每日游玩时长和详细记录
- **百科**: 游戏类型百科（RPG、FPS、MOBA、SIM、ADV、OTHER），含介绍和代表作

## 技术栈

### 前端
- **框架**: React 19.2.4 + React DOM 19.2.4
- **路由**: React Router DOM 7.14.0
- **构建工具**: Vite 8.0.4
- **HTTP 客户端**: Axios 1.15.0
- **图表**: Chart.js 4.5.1 + react-chartjs-2 5.3.1
- **日期处理**: dayjs 1.11.20
- **代码规范**: ESLint 9.39.4 + eslint-plugin-react-hooks + eslint-plugin-react-refresh

### 后端
- **运行环境**: Node.js 18+
- **框架**: Express 4.21.0
- **数据库**: PostgreSQL (pg 8.13.0)
- **配置管理**: dotenv 16.4.5
- **跨域**: cors 2.8.5

## 项目结构

```
GameFlow/
├── gametracker-client/       # 前端项目
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js          # API 封装层，axios 实例配置和 API 方法
│   │   ├── components/
│   │   │   └── Layout.jsx        # 布局组件：侧边栏导航
│   │   ├── pages/
│   │   │   ├── Overview.jsx      # 总览页：统计数据、本周柱状图、最近记录
│   │   │   ├── Library.jsx       # 游戏库页：游戏列表、筛选、增删改
│   │   │   ├── Timer.jsx         # 开始游玩页：计时器、开始/停止计时
│   │   │   ├── Stats.jsx         # 记录统计页：最近记录、补录功能
│   │   │   ├── Calendar.jsx      # 日历页：月历视图、日期详情
│   │   │   └── Wiki.jsx          # 百科页：游戏类型百科（静态配置）
│   │   ├── utils.js              # 工具函数：时长格式化、颜色映射等
│   │   ├── index.css             # 全局样式：布局、组件、颜色变量
│   │   ├── main.jsx              # 应用入口
│   │   └── App.jsx               # 路由配置
│   ├── index.html                # HTML 模板
│   ├── package.json              # 项目依赖和脚本
│   ├── eslint.config.js          # ESLint 配置（Flat Config 格式）
│   └── .gitignore                # Git 忽略配置
│
├── gametracker-server/       # 后端项目
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js          # PostgreSQL 连接池配置
│   │   │   └── init.js           # 数据库初始化脚本（建表+初始数据）
│   │   ├── routes/
│   │   │   ├── games.js          # 游戏 CRUD 路由
│   │   │   ├── sessions.js       # 计时/会话路由
│   │   │   ├── stats.js          # 统计/总览路由
│   │   │   └── calendar.js       # 日历路由
│   │   └── index.js              # Express 应用入口
│   ├── .env                      # 环境变量（数据库配置）
│   ├── package.json              # 项目依赖和脚本
│   └── README.md                 # 后端使用文档
│
├── GameFlow.md               # 需求设计文档
└── AGENTS.md                 # 项目说明文档
```

## 开发命令

### 前端 (gametracker-client)

```bash
cd gametracker-client

# 安装依赖
npm install

# 启动开发服务器 (http://localhost:5173)
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

# 初始化数据库（创建表+插入初始数据）
npm run init-db

# 启动开发服务器（自动重启）(http://localhost:3001)
npm run dev

# 生产模式启动
npm start
```

### 开发环境启动顺序

```bash
# 1. 先启动后端服务
cd gametracker-server
npm run init-db  # 首次运行需要
npm run dev

# 2. 再启动前端服务（新终端）
cd gametracker-client
npm run dev

# 3. 访问 http://localhost:5173
```

## 后端 API 配置

后端 API 地址配置在 `src/api/index.js`：

```javascript
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 8000,
})
```

### API 端点列表

| 功能 | 方法 | 端点 | 使用页面 |
|------|------|------|----------|
| 总览数据 | GET | `/overview` | 总览 |
| 游戏列表 | GET | `/games` | 游戏库、开始游玩、记录统计 |
| 创建游戏 | POST | `/games` | 游戏库 |
| 更新游戏 | PUT | `/games/:id` | 游戏库 |
| 删除游戏 | DELETE | `/games/:id` | 游戏库 |
| 类型列表 | GET | `/genres` | 游戏库 |
| 平台列表 | GET | `/platforms` | 游戏库、开始游玩 |
| 开始计时 | POST | `/sessions/start` | 开始游玩 |
| 停止计时 | POST | `/sessions/:id/stop` | 开始游玩 |
| 活跃会话 | GET | `/sessions/active` | 开始游玩 |
| 手动补录 | POST | `/sessions/manual` | 记录统计 |
| 最近记录 | GET | `/sessions/recent` | 记录统计、总览 |
| 时长统计 | GET | `/stats/playtime` | 总览 |
| 月历数据 | GET | `/calendar` | 日历 |
| 日详情 | GET | `/calendar/day` | 日历 |

## 代码规范

### ESLint 配置

使用 ESLint Flat Config 格式，配置在 `eslint.config.js`：

- 继承 `@eslint/js` 推荐规则
- 启用 `eslint-plugin-react-hooks` 推荐规则
- 启用 `eslint-plugin-react-refresh` Vite 配置
- 忽略 `dist` 目录
- 特殊规则：`no-unused-vars` 忽略大写字母开头的变量（允许 React 组件名样式）

### 命名规范

- 组件文件使用 PascalCase（如 `Overview.jsx`）
- 工具文件使用 camelCase（如 `utils.js`）
- API 方法使用 camelCase（如 `getOverview`, `startSession`）

### 样式规范

- 使用 CSS 自定义类名（非 CSS-in-JS）
- 颜色主题基于紫色调（主色 `#7f77dd`）
- 边框使用 0.5px 细线风格
- 圆角统一使用 8px / 12px

## 关键常量定义

### 游戏类型（Genre）

代码定义在 `src/utils.js` 和 `src/pages/Wiki.jsx`：

| 代码 | 名称 | 颜色（背景/文字） |
|------|------|------------------|
| RPG | 角色扮演 | `#eeedfe` / `#534ab7` |
| FPS | 第一人称射击 | `#faece7` / `#993c1d` |
| MOBA | 多人在线战术 | `#e1f5ee` / `#0f6e56` |
| SIM | 模拟经营 | `#e6f1fb` / `#185fa5` |
| ADV | 冒险解谜 | `#faeeda` / `#854f0b` |
| OTHER | 其他 | `#f1efe8` / `#5f5e5a` |

### 平台代码

定义在 `src/utils.js`：`['NS', 'PS4', 'PC', 'APP', '网站']`

## 工具函数

### `fmtDuration(seconds)`
格式化时长（秒 → "1h 30m" 或 "45m"）

### `gameInitial(name)`
获取游戏名首字（英文取前两字母），用于头像显示

### `GENRE_AVATAR_COLORS`
类型颜色映射对象

## 路由结构

| 路径 | 页面 | 组件 | 功能描述 |
|------|------|------|----------|
| `/` | 总览 | `Overview` | 统计数据、本周柱状图、最近记录 |
| `/library` | 游戏库 | `Library` | 游戏列表、筛选、增删改 |
| `/timer` | 开始游玩 | `Timer` | 选择游戏、开始/停止计时 |
| `/stats` | 记录统计 | `Stats` | 最近记录列表、补录功能 |
| `/calendar` | 日历 | `Calendar` | 月历视图、日期详情 |
| `/wiki` | 百科 | `Wiki` | 游戏类型百科 |

## 数据库设计参考

根据 `GameFlow.md`，后端使用 PostgreSQL 数据库，主要表结构：

- `genres`: 游戏类型表
- `platforms`: 游戏平台表
- `games`: 游戏表（关联 genres、platforms）
- `play_sessions`: 游玩记录表（关联 games）
- `active_session`: 当前计时状态表（全局唯一）

## 注意事项

1. **计时系统**: 同时只能有一个游戏在计时，依赖后端 `active_session` 表做并发控制
2. **时间精度**: 时长以秒为单位存储，展示时格式化为小时和分钟
3. **跨天处理**: 一个 session 跨天时按 `start_time` 归属统计，不做拆分
4. **性能**: 生产环境需在 `play_sessions` 表上添加索引（`start_time`, `game_id`）

## 开发环境要求

- Node.js 18+
- npm 或 yarn
- 后端服务运行在 `http://localhost:3001`
