技术组合应明确为：

- **数据库**：PostgreSQL
- **前端**：React
- **后端**：Node.js（例如 Express / NestJS）
- **进程管理**：PM2

服务器：
地址：47.100.230.33
端口：5432
用户名：hao
密码：@Aa65316571
数据库：GameTracker

一、总览页

游戏总数、总时长、本周时长、本月时长
最近 5 条游玩记录
本周每日时长柱状图
今日是否有游玩记录（自动判断，替代签到打卡）

二、游戏库

添加游戏：名称 + 类型 + 平台（NS / PS4 / PC / APP / Web）
按类型、平台筛选
编辑 / 删除

三、游玩计时

开始：选平台 → 选游戏 → 计时
同时只能一款游戏计时中
停止后自动记录
补录方式一：填开始时间 + 结束时间
补录方式二：填游戏 + 直接填时长

四、日历

每格显示当天游玩总时长
有记录的日期高亮
点击某天看当天游戏明细

五、百科

按游戏类型分类（RPG / FPS / MOBA / SIM / ADV / OTHER）
每个类型：一段介绍文字 + 代表游戏举例
每个类型附外部链接（维基百科 / 游戏官网等）




一、核心建模（先定“数据结构”，再谈页面）

你的系统本质是一个时间记录 + 游戏资产管理系统，核心只有三类实体：

-------------------------- 数据库 -------------------------- 
-- 游戏类型表
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    example_games TEXT,        -- 新增：代表游戏举例
    wiki_url VARCHAR(500),     -- 新增：外部百科链接
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 游戏平台表
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),     -- 新增
    official_url VARCHAR(500), -- 新增
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 游戏表
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    genre_id INT REFERENCES genres(id),
    platform_id INT REFERENCES platforms(id),
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 游玩记录表
CREATE TABLE play_sessions (
    id SERIAL PRIMARY KEY,
    game_id INT REFERENCES games(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration INT,              -- 秒
    source VARCHAR(20) DEFAULT 'timer',  -- timer / manual / duration
    created_at TIMESTAMP DEFAULT NOW()
);

-- 当前计时状态表（全局唯一）
CREATE TABLE active_session (
    id SERIAL PRIMARY KEY,
    game_id INT REFERENCES games(id),
    start_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX one_active_session ON active_session ((true));

二、核心逻辑设计（避免后期踩坑）
1）计时系统
开始计时

流程：

检查 active_session 是否存在
如果存在 → 拒绝 or 自动结束旧计时
写入新记录
停止计时
INSERT INTO play_sessions (game_id, start_time, end_time, duration, source)
VALUES (...)

然后：

DELETE FROM active_session;
2）时间冲突问题（必须处理）

补录时要校验：

SELECT * FROM play_sessions
WHERE game_id = ?
AND tsrange(start_time, end_time) && tsrange($new_start, $new_end);

避免：

时间重叠
数据污染
三、统计逻辑（总览页的本质）
1）总游戏数
SELECT COUNT(*) FROM games;
2）总时长
SELECT SUM(duration) FROM play_sessions;
3）本周时长
SELECT SUM(duration)
FROM play_sessions
WHERE start_time >= date_trunc('week', NOW());
4）本月时长
SELECT SUM(duration)
FROM play_sessions
WHERE start_time >= date_trunc('month', NOW());
5）最近 5 条记录
SELECT ps.*, g.name
FROM play_sessions ps
JOIN games g ON ps.game_id = g.id
ORDER BY ps.start_time DESC
LIMIT 5;
6）今日是否游玩（替代签到）
SELECT EXISTS (
    SELECT 1 FROM play_sessions
    WHERE start_time >= CURRENT_DATE
);
7）本周柱状图
SELECT 
    DATE(start_time) as day,
    SUM(duration) as total
FROM play_sessions
WHERE start_time >= date_trunc('week', NOW())
GROUP BY day
ORDER BY day;


四、模块拆解（前端 React 结构）
页面结构建议
/dashboard        总览页
/games            游戏库
/timer            计时页
/calendar         日历页
/wiki             百科页
组件结构
1）总览页
StatsCard（统计卡片）
RecentList（最近记录）
WeeklyChart（柱状图）
TodayStatus（是否游玩）
2）游戏库
GameTable
FilterBar（类型 + 平台）
GameForm（新增/编辑）
3）计时页
GameSelector
PlatformSelector
TimerDisplay
Start / Stop Button
4）日历页

建议使用：
react-calendar 或 fullcalendar

数据结构：

{
  date: "2026-04-10",
  totalDuration: 7200
}
5）百科页

静态 + 配置驱动：

const genres = [
  {
    type: "RPG",
    desc: "...",
    examples: ["Final Fantasy", "Witcher"],
    link: "https://en.wikipedia.org/wiki/Role-playing_video_game"
  }
]
五、后端结构（Node.js）
推荐用 NestJS（比 Express 更稳）

结构：

src/
 ├── modules/
 │    ├── games/
 │    ├── sessions/
 │    ├── stats/
 │    ├── timer/
 │
 ├── common/
 │
 ├── main.ts
API 设计
游戏
GET    /games
POST   /games
PUT    /games/:id
DELETE /games/:id
计时
POST /timer/start
POST /timer/stop
GET  /timer/status
记录
GET  /sessions
POST /sessions/manual
统计
GET /stats/overview
GET /stats/weekly

六、关键风险点（你现在没提，但后面一定会出问题）
1）时间精度问题
用 INT（秒） 存 duration
不要用分钟或浮点数
2）跨天问题
一个 session 跨天：
不拆
统计时按 start_time 归属

3）多设备并发
必须依赖：
active_session
否则：
手机开一个
PC再开一个
数据直接错

4）性能问题
当数据量上来：
必须加索引：
CREATE INDEX idx_sessions_start_time ON play_sessions(start_time);
CREATE INDEX idx_sessions_game_id ON play_sessions(game_id);


