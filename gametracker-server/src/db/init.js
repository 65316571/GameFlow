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
        description TEXT,
        example_games TEXT,
        wiki_url VARCHAR(500),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ genres table created')

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
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ games table created')

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
        start_time TIMESTAMP NOT NULL,
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
        INSERT INTO genres (code, name, description, example_games, wiki_url, sort_order) VALUES
        ('RPG', '角色扮演', '玩家扮演虚构世界中的角色，通过剧情推进和角色成长来体验游戏。注重故事叙述、角色发展和沉浸式体验。', '最终幻想、巫师3、上古卷轴、原神', 'https://zh.wikipedia.org/wiki/电子角色扮演游戏', 1),
        ('FPS', '第一人称射击', '以第一人称视角进行的射击游戏，强调反应速度和精准瞄准。通常包含多人对战和单人战役模式。', '使命召唤、CS2、Valorant、守望先锋', 'https://zh.wikipedia.org/wiki/第一人称射击游戏', 2),
        ('MOBA', '多人在线战术竞技', '两队玩家在固定地图上进行策略对抗，通过控制角色推塔摧毁对方基地获胜。', '英雄联盟、DOTA2、王者荣耀', 'https://zh.wikipedia.org/wiki/多人在线战斗竞技场游戏', 3),
        ('SIM', '模拟经营', '模拟现实世界中的各种活动，让玩家体验经营、建造或管理的过程。', '模拟人生、城市：天际线、动物园之星、星露谷物语', 'https://zh.wikipedia.org/wiki/模拟游戏', 4),
        ('ADV', '冒险解谜', '以探索、解谜和剧情为主的冒险游戏，通常包含丰富的故事和谜题要素。', '塞尔达传说、神秘海域、古墓丽影、双人成行', 'https://zh.wikipedia.org/wiki/冒险游戏', 5),
        ('OTHER', '其他', '不属于以上分类的游戏类型。', '各类独立游戏、休闲游戏', NULL, 99)
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

    // 插入示例游戏数据
    const gameCount = await query('SELECT COUNT(*) FROM games')
    if (parseInt(gameCount.rows[0].count) === 0) {
      await query(`
        INSERT INTO games (name, genre_id, platform_id, note) VALUES
        -- RPG 游戏
        ('塞尔达传说：王国之泪', 1, 1, '年度最佳游戏，开放世界神作'),
        ('巫师3：狂猎', 1, 3, '剧情封神，百玩不厌'),
        ('原神', 1, 4, '每天做日常，抽卡真香'),
        ('女神异闻录5 皇家版', 1, 2, '潮到出水的UI设计'),
        
        -- FPS 游戏
        ('CS2', 2, 3, '经典竞技， eternal classic'),
        ('Valorant', 2, 3, '瓦罗兰特，枪法与技能的结合'),
        ('使命召唤：现代战争', 2, 2, '电影级单人战役'),
        
        -- MOBA 游戏
        ('英雄联盟', 3, 3, 'S14赛季冲分中'),
        ('DOTA2', 3, 3, '永远的TI梦'),
        ('王者荣耀', 3, 4, '随时随地来一局'),
        
        -- SIM 游戏
        ('星露谷物语', 4, 3, '种田养老，治愈心灵'),
        ('模拟人生4', 4, 3, '捏人建房子能玩一天'),
        ('城市：天际线2', 4, 3, '堵车模拟器2.0'),
        ('动物森友会', 4, 1, '还房贷中...'),
        
        -- ADV 游戏
        ('双人成行', 5, 3, '必须双人游玩，创意满分'),
        ('神秘海域4', 5, 2, '德雷克的最终冒险'),
        ('逆转裁判123', 5, 4, '异议！法庭辩论经典'),
        
        -- OTHER 类型
        ('糖豆人', 6, 3, '欢乐派对游戏'),
        ('吸血鬼幸存者', 6, 3, '杀时间利器，根本停不下来')
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
      
      // 今天 - 多款游戏
      sessions.push(
        [1, new Date(today.getTime() + 9 * 3600000), new Date(today.getTime() + 11 * 3600000), 7200, 'timer'],  // 塞尔达 2h
        [9, new Date(today.getTime() + 14 * 3600000), new Date(today.getTime() + 15.5 * 3600000), 5400, 'timer'], // LOL 1.5h
        [11, new Date(today.getTime() + 20 * 3600000), new Date(today.getTime() + 21 * 3600000), 3600, 'manual']   // 星露谷 1h
      )
      
      // 昨天
      const yesterday = new Date(today.getTime() - 86400000)
      sessions.push(
        [2, new Date(yesterday.getTime() + 19 * 3600000), new Date(yesterday.getTime() + 22 * 3600000), 10800, 'timer'], // 巫师3 3h
        [8, new Date(yesterday.getTime() + 14 * 3600000), new Date(yesterday.getTime() + 15 * 3600000), 3600, 'timer']   // DOTA2 1h
      )
      
      // 前天
      const dayBeforeYesterday = new Date(today.getTime() - 2 * 86400000)
      sessions.push(
        [3, new Date(dayBeforeYesterday.getTime() + 10 * 3600000), new Date(dayBeforeYesterday.getTime() + 12 * 3600000), 7200, 'timer'], // 原神 2h
        [16, new Date(dayBeforeYesterday.getTime() + 20 * 3600000), new Date(dayBeforeYesterday.getTime() + 21.5 * 3600000), 5400, 'manual'] // 双人成行 1.5h
      )
      
      // 本周其他天数
      const days = [3, 4, 5, 6] // 本周三至周六
      days.forEach((dayOffset, idx) => {
        const date = new Date(today.getTime() - dayOffset * 86400000)
        const gameIds = [5, 6, 9, 11, 13, 15, 17]
        const baseGameId = gameIds[idx % gameIds.length]
        const duration = [3600, 5400, 7200, 4800][idx % 4]
        const startHour = [19, 20, 14, 15][idx % 4]
        
        sessions.push([
          baseGameId,
          new Date(date.getTime() + startHour * 3600000),
          new Date(date.getTime() + (startHour * 3600000) + duration * 1000),
          duration,
          idx % 2 === 0 ? 'timer' : 'manual'
        ])
      })
      
      // 上月的一些记录（用于测试月历）
      for (let i = 1; i <= 10; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - 1, i * 2 + 5)
        if (date.getMonth() !== today.getMonth()) {
          const gameId = (i % 10) + 1
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

    console.log('\n✅ Database initialization completed!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message)
    process.exit(1)
  }
}

initDatabase()
