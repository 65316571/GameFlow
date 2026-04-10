# GameTracker 后端服务

GameFlow 后端 API 服务，使用 Node.js + Express + PostgreSQL 构建。

## 快速开始

### 1. 安装依赖

```bash
cd gametracker-server
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
DB_HOST=47.100.230.33
DB_PORT=5432
DB_NAME=GameFlow
DB_USER=hao
DB_PASSWORD=@Aa65316571
PORT=3001
```

### 3. 初始化数据库

```bash
npm run init-db
```

这会创建所有必要的表并插入初始数据（游戏类型、平台）。

### 4. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务将运行在 `http://localhost:3001`

## API 端点

### 总览
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/overview` | 获取总览数据（统计、最近记录、本周图表） |

### 游戏库
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/games` | 获取游戏列表（支持 genre_id, platform_id 筛选） |
| POST | `/api/games` | 创建游戏 |
| PUT | `/api/games/:id` | 更新游戏 |
| DELETE | `/api/games/:id` | 删除游戏 |

### 类型/平台
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/genres` | 获取所有游戏类型 |
| GET | `/api/platforms` | 获取所有游戏平台 |

### 计时/会话
| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/sessions/start` | 开始计时（请求体: `{ game_id }`） |
| POST | `/api/sessions/:id/stop` | 停止计时 |
| GET | `/api/sessions/active` | 获取当前活跃会话 |
| POST | `/api/sessions/manual` | 手动补录 |
| GET | `/api/sessions/recent` | 获取最近10条记录 |

### 统计
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/stats/playtime?period=week` | 获取时长统计（week/month/year） |

### 日历
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/calendar?year=2026&month=4` | 获取月历数据 |
| GET | `/api/calendar/day?date=2026-04-10` | 获取某日详情 |

### 健康检查
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 服务健康检查 |

## 请求示例

### 创建游戏
```bash
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "name": "塞尔达传说：王国之泪",
    "genre_id": 1,
    "platform_id": 1,
    "note": "年度神作"
  }'
```

### 开始计时
```bash
curl -X POST http://localhost:3001/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"game_id": 1}'
```

### 停止计时
```bash
curl -X POST http://localhost:3001/api/sessions/1/stop
```

### 手动补录
```bash
# 方式一：指定开始结束时间
curl -X POST http://localhost:3001/api/sessions/manual \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": 1,
    "start_time": "2026-04-10T14:00:00",
    "end_time": "2026-04-10T16:30:00",
    "source": "manual"
  }'

# 方式二：直接指定时长（秒）
curl -X POST http://localhost:3001/api/sessions/manual \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": 1,
    "duration": 7200,
    "source": "duration"
  }'
```

## 项目结构

```
gametracker-server/
├── src/
│   ├── db/
│   │   ├── index.js      # 数据库连接
│   │   └── init.js       # 数据库初始化脚本
│   ├── routes/
│   │   ├── games.js      # 游戏相关路由
│   │   ├── sessions.js   # 会话/计时路由
│   │   ├── stats.js      # 统计路由
│   │   └── calendar.js   # 日历路由
│   └── index.js          # 应用入口
├── .env                  # 环境变量
├── package.json
└── README.md
```

## 数据库表结构

- `genres` - 游戏类型表
- `platforms` - 游戏平台表
- `games` - 游戏表
- `play_sessions` - 游玩记录表
- `active_session` - 当前计时状态表（全局唯一）

## 注意事项

1. **同时只能有一个活跃计时** - 由 `active_session` 表的 `one_active_session` 唯一索引保证
2. **时间冲突检查** - 手动补录时会检查是否与现有记录时间重叠
3. **时长以秒为单位存储** - 展示时格式化为小时和分钟
4. **跨天处理** - 一个 session 跨天时按 `start_time` 归属统计，不做拆分
