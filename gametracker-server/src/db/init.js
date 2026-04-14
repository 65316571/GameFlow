import pool, { query } from './index.js'

const initDatabase = async () => {
  try {
    console.log('Initializing database...')

    // 创建类型表
    await query(`
      CREATE TABLE IF NOT EXISTS genres (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        full_name VARCHAR(255),
        icon VARCHAR(20),
        theme_key VARCHAR(50),
        description TEXT,
        example_games TEXT,
        wiki_url VARCHAR(500),
        wiki_label VARCHAR(200),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ genres table created')

    // 为旧库补齐 genres 的新增字段（防止已存在的表缺列）
    await query(`ALTER TABLE genres ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`)
    await query(`ALTER TABLE genres ADD COLUMN IF NOT EXISTS icon VARCHAR(20)`)
    await query(`ALTER TABLE genres ADD COLUMN IF NOT EXISTS theme_key VARCHAR(50)`)
    await query(`ALTER TABLE genres ADD COLUMN IF NOT EXISTS wiki_label VARCHAR(200)`)

    // 创建百科游戏条目表（与用户游戏库 games 解耦）
    await query(`
      CREATE TABLE IF NOT EXISTS wiki_games (
        id SERIAL PRIMARY KEY,
        genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        publisher VARCHAR(255),
        intro TEXT,
        image_url VARCHAR(500),
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await query(`CREATE INDEX IF NOT EXISTS idx_wiki_games_genre_id ON wiki_games(genre_id)`)
    console.log('✓ wiki_games table created')

    // 创建平台表
    await query(`
      CREATE TABLE IF NOT EXISTS platforms (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_url VARCHAR(500),
        official_url VARCHAR(500),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ platforms table created')

    // 创建游戏表
    await query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        genre_id INT REFERENCES genres(id),
        platform_id INT REFERENCES platforms(id),
        cover_url VARCHAR(500),
        official_url VARCHAR(500),
        publisher VARCHAR(255),
        wiki_intro TEXT,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ games table created')

    // 为旧库补齐 games 的新增字段（防止已存在的表缺列）
    await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)`)
    await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS official_url VARCHAR(500)`)
    await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS publisher VARCHAR(255)`)
    await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS wiki_intro TEXT`)

    await query(`CREATE INDEX IF NOT EXISTS idx_games_genre_id ON games(genre_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_games_platform_id ON games(platform_id)`)

    // 创建游玩记录表
    await query(`
      CREATE TABLE IF NOT EXISTS play_sessions (
        id SERIAL PRIMARY KEY,
        game_id INT REFERENCES games(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INT,
        source VARCHAR(20) DEFAULT 'timer',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ play_sessions table created')

    // 创建当前计时状态表
    await query(`
      CREATE TABLE IF NOT EXISTS active_session (
        id SERIAL PRIMARY KEY,
        game_id INT REFERENCES games(id),
        session_start_time TIMESTAMP NOT NULL,
        start_time TIMESTAMP NOT NULL,
        accumulated_seconds INT NOT NULL DEFAULT 0,
        paused BOOLEAN NOT NULL DEFAULT FALSE,
        paused_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ active_session table created')

    // 创建唯一索引确保只有一个活跃会话
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'one_active_session'
        ) THEN
          CREATE UNIQUE INDEX one_active_session ON active_session ((true));
        END IF;
      END $$;
    `)
    console.log('✓ active_session index created')

    // 创建性能索引
    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON play_sessions(start_time)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_game_id ON play_sessions(game_id)
    `)
    console.log('✓ performance indexes created')

    // 插入初始类型数据
    const genreCount = await query('SELECT COUNT(*) FROM genres')
    if (parseInt(genreCount.rows[0].count) === 0) {
      await query(`
        INSERT INTO genres (code, name, full_name, icon, theme_key, description, example_games, wiki_url, wiki_label, sort_order) VALUES
        ('RPG', '角色扮演', 'Role-Playing Game', '⚔️', 'RPG', '玩家扮演虚构世界中的角色，通过剧情推进和角色成长来体验游戏。注重故事叙述、角色发展和沉浸式体验。', '最终幻想、巫师3、上古卷轴、原神', 'https://zh.wikipedia.org/wiki/电子角色扮演游戏', '维基百科 · 角色扮演游戏', 1),
        ('FPS', '第一人称射击', 'First-Person Shooter', '🔫', 'FPS', '以第一人称视角进行的射击游戏，强调反应速度和精准瞄准。通常包含多人对战和单人战役模式。', '使命召唤、CS2、Valorant、守望先锋', 'https://zh.wikipedia.org/wiki/第一人称射击游戏', '维基百科 · 第一人称射击游戏', 2),
        ('MOBA', '多人在线战术竞技', 'Multiplayer Online Battle Arena', '⚡', 'MOBA', '两队玩家在固定地图上进行策略对抗，通过控制角色推塔摧毁对方基地获胜。', '英雄联盟、DOTA2、王者荣耀', 'https://zh.wikipedia.org/wiki/多人在线战斗竞技场游戏', '维基百科 · MOBA', 3),
        ('SIM', '模拟经营', 'Simulation Game', '🏗️', 'SIM', '模拟现实世界中的各种活动，让玩家体验经营、建造或管理的过程。', '模拟人生、城市：天际线、动物园之星、星露谷物语', 'https://zh.wikipedia.org/wiki/模拟游戏', '维基百科 · 模拟游戏', 4),
        ('ADV', '冒险解谜', 'Adventure Game', '🗺️', 'ADV', '以探索、解谜和剧情为主的冒险游戏，通常包含丰富的故事和谜题要素。', '塞尔达传说、神秘海域、古墓丽影、双人成行', 'https://zh.wikipedia.org/wiki/冒险游戏', '维基百科 · 冒险游戏', 5),
        ('OTHER', '其他', 'Other / Miscellaneous', '🎯', 'OTHER', '不属于以上分类的游戏类型。', '各类独立游戏、休闲游戏', NULL, '维基百科 · 电子游戏类型总览', 99)
      `)
      console.log('✓ genres data inserted')
    }

    // 插入初始平台数据
    const platformCount = await query('SELECT COUNT(*) FROM platforms')
    if (parseInt(platformCount.rows[0].count) === 0) {
      await query(`
        INSERT INTO platforms (code, name, description, sort_order) VALUES
        ('NS', 'Nintendo Switch', '任天堂出品的混合型游戏主机', 1),
        ('PS4', 'PlayStation 4', '索尼出品的游戏主机', 2),
        ('Xbox', 'Xbox Series X/S', '微软出品的游戏主机', 3),
        ('Steam', 'Steam 平台', 'Steam 游戏平台 (Windows/Mac/Linux)', 4),
        ('APP', '手机游戏', 'iOS/Android 移动设备', 5),
        ('网站', '网页游戏', '浏览器可直接游玩的游戏', 6)
      `)
      console.log('✓ platforms data inserted')
    }

    // 插入示例游戏数据（用于百科：客观信息放到 games；note 保留为个人评价，不在这里写入）
    const gameCount = await query('SELECT COUNT(*) FROM games')
    if (parseInt(gameCount.rows[0].count) === 0) {
      await query(`
        INSERT INTO games (name, genre_id, platform_id, publisher, official_url, cover_url, wiki_intro, note) VALUES
        -- RPG
        ('塞尔达传说：王国之泪',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '开放世界动作冒险游戏，强调探索、解谜与自由构筑玩法。',
          NULL
        ),
        ('巫师3：狂猎',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'CD PROJEKT RED',
          'https://thewitcher.com/',
          NULL,
          '剧情驱动的开放世界角色扮演游戏，以支线叙事与世界沉浸感著称。',
          NULL
        ),
        ('原神',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          '米哈游',
          'https://ys.mihoyo.com/',
          NULL,
          '开放世界动作角色扮演游戏，围绕元素反应与角色养成展开。',
          NULL
        ),

        -- FPS
        ('CS2',
          (SELECT id FROM genres WHERE code = 'FPS'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Valve',
          'https://www.counter-strike.net/cs2',
          NULL,
          '经典竞技射击游戏的延续，强调团队协作、地图控制与枪法对抗。',
          NULL
        ),
        ('Valorant',
          (SELECT id FROM genres WHERE code = 'FPS'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Riot Games',
          'https://playvalorant.com/',
          NULL,
          '战术射击与英雄技能结合的竞技 FPS，强调团队配合与战术执行。',
          NULL
        ),

        -- MOBA
        ('英雄联盟',
          (SELECT id FROM genres WHERE code = 'MOBA'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Riot Games',
          'https://www.leagueoflegends.com/',
          NULL,
          '多人在线战术竞技游戏，围绕英雄对线、团战与地图目标展开。',
          NULL
        ),
        ('Dota 2',
          (SELECT id FROM genres WHERE code = 'MOBA'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Valve',
          'https://www.dota2.com/',
          NULL,
          '高策略深度的 MOBA，强调资源管理、团战与阵容协同。',
          NULL
        ),

        -- SIM
        ('星露谷物语',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'ConcernedApe',
          'https://www.stardewvalley.net/',
          NULL,
          '像素风农场模拟经营，包含种植、社交、探索等多种玩法循环。',
          NULL
        ),
        ('城市：天际线',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Paradox Interactive',
          'https://www.paradoxinteractive.com/',
          NULL,
          '城市建设与交通规划模拟，侧重系统联动与城市运行效率。',
          NULL
        ),

        -- ADV
        ('双人成行',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Hazelight Studios',
          'https://www.ea.com/games/it-takes-two',
          NULL,
          '双人合作冒险游戏，关卡机制持续变化，强调协作与沟通。',
          NULL
        ),
        ('神秘海域4',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Naughty Dog',
          'https://www.playstation.com/',
          NULL,
          '电影化叙事动作冒险，融合探索、解谜与战斗演出。',
          NULL
        ),

        -- OTHER
        ('吸血鬼幸存者',
          (SELECT id FROM genres WHERE code = 'OTHER'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'poncle',
          'https://vampire-survivors.com/',
          NULL,
          '轻量 Roguelite 弹幕生存玩法，强调构筑与数值成长带来的爽感。',
          NULL
        )
      `)
      console.log('✓ sample games data inserted')
    }

    // 插入示例游玩记录（用于测试统计图表）
    const sessionCount = await query('SELECT COUNT(*) FROM play_sessions')
    if (parseInt(sessionCount.rows[0].count) === 0) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // 生成本周的游玩记录
      const sessions = []

      const gamesRes = await query(`SELECT id, name FROM games ORDER BY id`)
      const gameIdByName = new Map(gamesRes.rows.map(r => [r.name, r.id]))
      const gameIds = gamesRes.rows.map(r => r.id)

      const pushSession = (gameName, start, end, duration, source) => {
        const id = gameIdByName.get(gameName)
        if (!id) return
        sessions.push([id, start, end, duration, source])
      }
      
      // 今天 - 多款游戏
      pushSession('塞尔达传说：王国之泪', new Date(today.getTime() + 9 * 3600000), new Date(today.getTime() + 11 * 3600000), 7200, 'timer')
      pushSession('英雄联盟', new Date(today.getTime() + 14 * 3600000), new Date(today.getTime() + 15.5 * 3600000), 5400, 'timer')
      pushSession('星露谷物语', new Date(today.getTime() + 20 * 3600000), new Date(today.getTime() + 21 * 3600000), 3600, 'manual')
      
      // 昨天
      const yesterday = new Date(today.getTime() - 86400000)
      pushSession('巫师3：狂猎', new Date(yesterday.getTime() + 19 * 3600000), new Date(yesterday.getTime() + 22 * 3600000), 10800, 'timer')
      pushSession('Dota 2', new Date(yesterday.getTime() + 14 * 3600000), new Date(yesterday.getTime() + 15 * 3600000), 3600, 'timer')
      
      // 前天
      const dayBeforeYesterday = new Date(today.getTime() - 2 * 86400000)
      pushSession('原神', new Date(dayBeforeYesterday.getTime() + 10 * 3600000), new Date(dayBeforeYesterday.getTime() + 12 * 3600000), 7200, 'timer')
      pushSession('双人成行', new Date(dayBeforeYesterday.getTime() + 20 * 3600000), new Date(dayBeforeYesterday.getTime() + 21.5 * 3600000), 5400, 'manual')
      
      // 本周其他天数
      const days = [3, 4, 5, 6] // 本周三至周六
      days.forEach((dayOffset, idx) => {
        const date = new Date(today.getTime() - dayOffset * 86400000)
        const gamePool = ['CS2', 'Valorant', '英雄联盟', '星露谷物语', '城市：天际线', '双人成行', '吸血鬼幸存者']
        const baseGameName = gamePool[idx % gamePool.length]
        const duration = [3600, 5400, 7200, 4800][idx % 4]
        const startHour = [19, 20, 14, 15][idx % 4]
        
        pushSession(
          baseGameName,
          new Date(date.getTime() + startHour * 3600000),
          new Date(date.getTime() + (startHour * 3600000) + duration * 1000),
          duration,
          idx % 2 === 0 ? 'timer' : 'manual'
        )
      })
      
      // 上月的一些记录（用于测试月历）
      for (let i = 1; i <= 10; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - 1, i * 2 + 5)
        if (date.getMonth() !== today.getMonth()) {
          const gameId = gameIds.length ? gameIds[i % gameIds.length] : null
          if (!gameId) continue
          const duration = [1800, 3600, 5400, 7200][i % 4]
          sessions.push([
            gameId,
            new Date(date.getTime() + 19 * 3600000),
            new Date(date.getTime() + 19 * 3600000 + duration * 1000),
            duration,
            i % 2 === 0 ? 'timer' : 'manual'
          ])
        }
      }
      
      // 批量插入
      for (const session of sessions) {
        await query(
          `INSERT INTO play_sessions (game_id, start_time, end_time, duration, source) 
           VALUES ($1, $2, $3, $4, $5)`,
          session
        )
      }
      console.log(`✓ ${sessions.length} sample play sessions inserted`)
    }

    const defaultGenreRes = await query(`SELECT id FROM genres WHERE code = 'OTHER' LIMIT 1`)
    const defaultPlatformRes = await query(`SELECT id FROM platforms WHERE code = 'Steam' LIMIT 1`)
    const defaultGenreId = defaultGenreRes.rows[0]?.id
    const defaultPlatformId = defaultPlatformRes.rows[0]?.id
    if (defaultGenreId) {
      await query(`UPDATE games SET genre_id = $1 WHERE genre_id IS NULL`, [defaultGenreId])
    }
    if (defaultPlatformId) {
      await query(`UPDATE games SET platform_id = $1 WHERE platform_id IS NULL`, [defaultPlatformId])
    }

    await query(`ALTER TABLE games ALTER COLUMN genre_id SET NOT NULL`)
    await query(`ALTER TABLE games ALTER COLUMN platform_id SET NOT NULL`)

    console.log('\n✅ Database initialization completed!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message)
    process.exit(1)
  }
}

initDatabase()
