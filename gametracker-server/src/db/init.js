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
        ('RPG', '角色扮演', 'Role-Playing Game', '⚔️', 'RPG', '玩家扮演虚构世界中的角色，通过剧情推进和角色成长来体验游戏。注重故事叙述、角色发展和沉浸式体验。', '最终幻想、巫师3、上古卷轴、原神、博德之门3', 'https://zh.wikipedia.org/wiki/电子角色扮演游戏', '维基百科 · 角色扮演游戏', 1),
        ('ARPG', '动作角色扮演', 'Action Role-Playing Game', '⚔️', 'ARPG', '结合了动作游戏的操作感与角色扮演的成长要素，强调实时战斗与装备收集。', '艾尔登法环、暗黑破坏神、怪物猎人、仁王', 'https://zh.wikipedia.org/wiki/动作角色扮演游戏', '维基百科 · 动作角色扮演游戏', 2),
        ('MMORPG', '大型多人在线角色扮演', 'Massively Multiplayer Online RPG', '👥', 'MMORPG', '数千名玩家同时在线的虚拟世界，强调社交、公会、副本和持续的内容更新。', '魔兽世界、最终幻想14、剑网3、EVE Online', 'https://zh.wikipedia.org/wiki/大型多人在线角色扮演游戏', '维基百科 · MMORPG', 3),
        ('FPS', '第一人称射击', 'First-Person Shooter', '🔫', 'FPS', '以第一人称视角进行的射击游戏，强调反应速度和精准瞄准。通常包含多人对战和单人战役模式。', '使命召唤、CS2、Valorant、守望先锋、战地风云', 'https://zh.wikipedia.org/wiki/第一人称射击游戏', '维基百科 · 第一人称射击游戏', 4),
        ('TPS', '第三人称射击', 'Third-Person Shooter', '🎯', 'TPS', '以第三人称越肩视角进行的射击游戏，玩家可以观察角色动作和掩体位置。', '绝地求生、战争机器、堡垒之夜、全境封锁', 'https://zh.wikipedia.org/wiki/第三人称射击游戏', '维基百科 · 第三人称射击游戏', 5),
        ('ACT', '动作', 'Action Game', '👊', 'ACT', '强调玩家的反应速度、手眼协调和操作技巧，通常包含连击、闪避和平台跳跃。', '鬼泣5、战神、猎天使魔女、只狼：影逝二度', 'https://zh.wikipedia.org/wiki/动作游戏', '维基百科 · 动作游戏', 6),
        ('MOBA', '多人在线战术竞技', 'Multiplayer Online Battle Arena', '⚡', 'MOBA', '两队玩家在固定地图上进行策略对抗，通过控制角色推塔摧毁对方基地获胜。', '英雄联盟、DOTA2、王者荣耀、风暴英雄', 'https://zh.wikipedia.org/wiki/多人在线战斗竞技场游戏', '维基百科 · MOBA', 7),
        ('RTS', '即时战略', 'Real-Time Strategy', '♟️', 'RTS', '玩家在游戏中实时采集资源、建造基地、指挥部队，与对手进行策略对抗。', '星际争霸2、帝国时代4、红色警戒、魔兽争霸3', 'https://zh.wikipedia.org/wiki/即时战略游戏', '维基百科 · 即时战略游戏', 8),
        ('SLG', '策略战棋', 'Simulation / Strategy Game', '🏛️', 'SLG', '强调策略规划与战术部署，包含回合制战棋、4X策略和兵棋推演等玩法。', '文明6、火焰纹章、全面战争、XCOM', 'https://zh.wikipedia.org/wiki/战略游戏', '维基百科 · 策略游戏', 9),
        ('SIM', '模拟经营', 'Simulation Game', '🏗️', 'SIM', '模拟现实世界中的各种活动，让玩家体验经营、建造或管理的过程。', '模拟人生、城市：天际线、动物园之星、星露谷物语', 'https://zh.wikipedia.org/wiki/模拟游戏', '维基百科 · 模拟游戏', 10),
        ('RAC', '竞速', 'Racing Game', '🏎️', 'RAC', '以各种载具竞速为核心玩法，追求速度感与驾驶技巧。', '极限竞速：地平线、马力欧赛车、GT赛车、极品飞车', 'https://zh.wikipedia.org/wiki/竞速游戏', '维基百科 · 竞速游戏', 11),
        ('SPG', '体育', 'Sports Game', '⚽', 'SPG', '模拟真实体育运动项目，让玩家扮演运动员或管理球队。', 'FIFA、NBA 2K、实况足球、任天堂明星大乱斗', 'https://zh.wikipedia.org/wiki/体育游戏', '维基百科 · 体育游戏', 12),
        ('FTG', '格斗', 'Fighting Game', '🥊', 'FTG', '玩家操控角色进行一对一或多人混战，强调连招、帧数判定和对抗心理。', '街霸6、铁拳8、拳皇15、任天堂明星大乱斗', 'https://zh.wikipedia.org/wiki/格斗游戏', '维基百科 · 格斗游戏', 13),
        ('ADV', '冒险解谜', 'Adventure Game', '🗺️', 'ADV', '以探索、解谜和剧情为主的冒险游戏，通常包含丰富的故事和谜题要素。', '塞尔达传说、神秘海域、古墓丽影、双人成行', 'https://zh.wikipedia.org/wiki/冒险游戏', '维基百科 · 冒险游戏', 14),
        ('PUZ', '益智休闲', 'Puzzle Game', '🧩', 'PUZ', '通过逻辑推理、空间想象或反应速度来解决谜题，通常规则简单但富有深度。', '俄罗斯方块、纪念碑谷、Portal、Baba Is You', 'https://zh.wikipedia.org/wiki/益智游戏', '维基百科 · 益智游戏', 15),
        ('Roguelike', '肉鸽', 'Roguelike / Roguelite', '🎲', 'Roguelike', '以随机地图、永久死亡和回合制/即时战斗为核心，每次游玩体验都不相同。', '哈迪斯、杀戮尖塔、以撒的结合、死亡细胞', 'https://zh.wikipedia.org/wiki/Roguelike', '维基百科 · Roguelike', 16),
        ('Horror', '恐怖生存', 'Survival Horror', '💀', 'Horror', '通过氛围营造、资源管理和未知威胁来制造紧张感，强调生存与心理压迫。', '生化危机、寂静岭、逃生、恐鬼症', 'https://zh.wikipedia.org/wiki/恐怖游戏', '维基百科 · 恐怖游戏', 17),
        ('Sandbox', '沙盒', 'Sandbox Game', '⛏️', 'Sandbox', '提供极高的自由度，玩家可以在开放世界中创造、破坏和探索，没有固定目标。', '我的世界、泰拉瑞亚、饥荒、盖瑞模组', 'https://zh.wikipedia.org/wiki/沙盒类游戏', '维基百科 · 沙盒游戏', 18),
        ('Rhythm', '音乐节奏', 'Rhythm Game', '🎵', 'Rhythm', '玩家需要配合音乐节奏按下按键，强调节拍感与手速。', '节奏天国、太鼓达人、OSU!、初音未来 Project DIVA', 'https://zh.wikipedia.org/wiki/节奏游戏', '维基百科 · 节奏游戏', 19),
        ('OTHER', '其他', 'Other / Miscellaneous', '📌', 'OTHER', '不属于以上分类的游戏类型，或是跨类型的创新作品。', '各类独立游戏、实验性游戏、互动电影', NULL, '维基百科 · 电子游戏类型总览', 99)
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
        ('PC', '电脑游戏', '除去Steam平台的电脑游戏（拳头、暴雪等厂商）', 3),
        ('Steam', 'Steam 平台', 'Steam 游戏平台 (Windows/Mac/Linux)', 4),
        ('Xbox', 'Xbox Series X/S', '微软出品的游戏主机', 5),
        ('APP', '手机游戏', 'iOS/Android 移动设备', 6),
        ('Web', '网页游戏', '浏览器可直接游玩的游戏', 7)
      `)
      console.log('✓ platforms data inserted')
    }

    // 插入示例游戏数据
    // 平台优先级: NS > PS4 > PC > Steam > Xbox > APP > Web
    // PS4 为独占游戏
    const gameCount = await query('SELECT COUNT(*) FROM games')
    if (parseInt(gameCount.rows[0].count) === 0) {
      await query(`
        INSERT INTO games (name, genre_id, platform_id, publisher, official_url, cover_url, wiki_intro, note) VALUES

        -- ============================================
        -- NS 独占/优先游戏 (platform_id = 1)
        -- ============================================
        ('塞尔达传说：王国之泪',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '2023年度最佳游戏，开放世界动作冒险巅峰，自由建造与探索的极致体验。',
          'NS独占神作'
        ),
        ('马力欧赛车8 豪华版',
          (SELECT id FROM genres WHERE code = 'RAC'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '欢乐向卡丁车竞速游戏，道具互坑与赛道设计深受全年龄喜爱。',
          'NS销量最高游戏'
        ),
        ('火焰纹章：结合',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Intelligent Systems',
          'https://www.nintendo.com/',
          NULL,
          '战棋策略角色扮演，强调兵种克制、角色培养与战术走位。',
          'NS独占SRPG'
        ),
        ('动物森友会：新地平线',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '任天堂社交模拟游戏，在无人的岛屿上开始新生活。',
          'NS独占治愈神作'
        ),
        ('任天堂明星大乱斗 特别版',
          (SELECT id FROM genres WHERE code = 'FTG'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '平台格斗游戏巅峰，任天堂全明星集结，销量最高的格斗游戏。',
          'NS独占格斗巅峰'
        ),
        ('节奏天国',
          (SELECT id FROM genres WHERE code = 'Rhythm'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '任天堂创意节奏游戏，各种搞怪场景配合精准节拍。',
          'NS独占创意节奏'
        ),
        ('太鼓达人',
          (SELECT id FROM genres WHERE code = 'Rhythm'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Bandai Namco',
          'https://taiko-ch.net/',
          NULL,
          '以日本传统太鼓为题材的欢乐音乐节奏游戏，曲库丰富。',
          'NS优先体验'
        ),
        ('猎天使魔女3',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Platinum',
          'https://www.nintendo.com/',
          NULL,
          '魔女贝优妮塔的华丽动作冒险，极致的连击评分系统。',
          'NS独占动作'
        ),
        ('斯普拉遁3',
          (SELECT id FROM genres WHERE code = 'TPS'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '4v4涂地对战射击游戏，独特的墨水机制与潮流风格。',
          'NS独占射击'
        ),
        ('宝可梦 朱/紫',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Game Freak',
          'https://www.pokemon.com/',
          NULL,
          '开放世界宝可梦正统续作，在帕底亚地区展开冒险。',
          'NS独占RPG'
        ),
        ('异度神剑3',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Monolith Soft',
          'https://www.nintendo.com/',
          NULL,
          '日式RPG宏大叙事，连接异度神剑系列的世界观。',
          'NS独占JRPG'
        ),
        ('马里奥奥德赛',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '3D平台跳跃动作冒险，与帽子凯比一起环游世界。',
          'NS独占平台神作'
        ),

        -- ============================================
        -- PS4 独占游戏 (platform_id = 2)
        -- ============================================
        ('战神：诸神黄昏',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Santa Monica Studio',
          'https://www.playstation.com/',
          NULL,
          '一镜到底的叙事动作冒险，父子旅程与北欧神话交织的史诗之作。',
          'PS独占神作'
        ),
        ('神秘海域4',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Naughty Dog',
          'https://www.playstation.com/',
          NULL,
          '电影化叙事动作冒险，德雷克的最终冒险。',
          'PS独占电影化神作'
        ),
        ('GT赛车7',
          (SELECT id FROM genres WHERE code = 'RAC'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Polyphony',
          'https://www.gran-turismo.com/',
          NULL,
          '拟真赛车模拟游戏，追求极致的真实驾驶体验。',
          'PS独占拟真赛车'
        ),
        ('最后生还者 第二部',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Naughty Dog',
          'https://www.playstation.com/',
          NULL,
          '末日生存动作冒险，艾莉的复仇之旅与深刻叙事。',
          'PS独占叙事神作'
        ),
        ('对马岛之魂',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Sucker Punch',
          'https://www.playstation.com/',
          NULL,
          '日本武士题材开放世界动作游戏，极致的画面与氛围。',
          'PS独占武士动作'
        ),
        ('血源诅咒',
          (SELECT id FROM genres WHERE code = 'ARPG'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'FromSoftware',
          'https://www.playstation.com/',
          NULL,
          '维多利亚风格魂系ARPG，亚楠的恐怖狩猎之夜。',
          'PS独占魂系经典'
        ),
        ('地平线：西之绝境',
          (SELECT id FROM genres WHERE code = 'ARPG'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Guerrilla',
          'https://www.playstation.com/',
          NULL,
          '后启示录开放世界ARPG，机械兽与原始部落并存。',
          'PS独占开放世界'
        ),
        ('漫威蜘蛛侠2',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Insomniac',
          'https://www.playstation.com/',
          NULL,
          '开放世界超级英雄动作游戏，彼得与迈尔斯双主角。',
          'PS独占超级英雄'
        ),
        ('死亡搁浅',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Kojima Productions',
          'https://www.playstation.com/',
          NULL,
          '小岛秀夫独特叙事的快递模拟冒险游戏。',
          'PS独占艺术冒险'
        ),
        ('恶魔之魂 重制版',
          (SELECT id FROM genres WHERE code = 'ARPG'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Bluepoint',
          'https://www.playstation.com/',
          NULL,
          '魂系游戏开山之作的重制版，柏雷塔尼亚的黑暗冒险。',
          'PS独占魂系起源'
        ),
        ('瑞奇与叮当：时空跳转',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Insomniac',
          'https://www.playstation.com/',
          NULL,
          '科幻动作平台跳跃，利用次元裂缝快速移动。',
          'PS独占平台动作'
        ),
        ('麻布仔大冒险',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Sumo Digital',
          'https://www.playstation.com/',
          NULL,
          '可爱的平台跳跃冒险游戏，支持多人合作。',
          'PS独占家庭游戏'
        ),

        -- ============================================
        -- PC 平台游戏（拳头、暴雪等，非Steam）(platform_id = 3)
        -- ============================================
        ('英雄联盟',
          (SELECT id FROM genres WHERE code = 'MOBA'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Riot Games',
          'https://www.leagueoflegends.com/',
          NULL,
          '多人在线战术竞技游戏，围绕英雄对线、团战与地图目标展开。',
          '拳头PC独占'
        ),
        ('Valorant',
          (SELECT id FROM genres WHERE code = 'FPS'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Riot Games',
          'https://playvalorant.com/',
          NULL,
          '战术射击与英雄技能结合的竞技FPS，强调团队配合与战术执行。',
          '拳头PC独占'
        ),
        ('云顶之弈',
          (SELECT id FROM genres WHERE code = 'OTHER'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Riot Games',
          'https://teamfighttactics.leagueoflegends.com/',
          NULL,
          '自走棋策略游戏，基于英雄联盟宇宙的英雄组合对战。',
          '拳头PC独占'
        ),
        ('无畏契约',
          (SELECT id FROM genres WHERE code = 'FPS'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Riot Games',
          'https://playvalorant.com/',
          NULL,
          '5v5战术射击游戏，英雄技能与精准枪法的结合。',
          '拳头PC独占'
        ),
        ('魔兽世界',
          (SELECT id FROM genres WHERE code = 'MMORPG'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Blizzard Entertainment',
          'https://worldofwarcraft.com/',
          NULL,
          'MMORPG的王者，艾泽拉斯的史诗冒险。',
          '暴雪PC独占'
        ),
        ('守望先锋2',
          (SELECT id FROM genres WHERE code = 'FPS'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Blizzard',
          'https://overwatch.blizzard.com/',
          NULL,
          '团队射击游戏续作，强调英雄配合与目标争夺。',
          '暴雪PC独占'
        ),
        ('暗黑破坏神4',
          (SELECT id FROM genres WHERE code = 'ARPG'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Blizzard',
          'https://diablo4.blizzard.com/',
          NULL,
          '经典ARPG系列续作，在庇护之地对抗莉莉丝的黑暗势力。',
          '暴雪PC独占'
        ),
        ('星际争霸2',
          (SELECT id FROM genres WHERE code = 'RTS'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Blizzard Entertainment',
          'https://starcraft2.com/',
          NULL,
          '科幻题材即时战略巅峰之作，以极高的操作上限与电竞生态著称。',
          '暴雪PC独占'
        ),
        ('风暴英雄',
          (SELECT id FROM genres WHERE code = 'MOBA'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Blizzard',
          'https://heroesofthestorm.com/',
          NULL,
          '暴雪全明星MOBA，强调团队经验共享与地图机制。',
          '暴雪PC独占'
        ),
        ('魔兽争霸3：重制版',
          (SELECT id FROM genres WHERE code = 'RTS'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Blizzard',
          'https://warcraft3.blizzard.com/',
          NULL,
          'RTS与MOBA的鼻祖，艾泽拉斯的史诗战役。',
          '暴雪PC独占'
        ),
        ('炉石传说',
          (SELECT id FROM genres WHERE code = 'OTHER'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Blizzard',
          'https://hearthstone.blizzard.com/',
          NULL,
          '魔兽题材卡牌对战游戏，快节奏策略对决。',
          '暴雪PC独占'
        ),
        ('暗黑破坏神：不朽',
          (SELECT id FROM genres WHERE code = 'ARPG'),
          (SELECT id FROM platforms WHERE code = 'PC'),
          'Blizzard',
          'https://diabloimmortal.blizzard.com/',
          NULL,
          '暗黑破坏神系列手游移植PC版，随时随地刷装备。',
          '暴雪PC独占'
        ),

        -- ============================================
        -- Steam 平台游戏 (platform_id = 4)
        -- ============================================
        ('巫师3：狂猎',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'CD PROJEKT RED',
          'https://thewitcher.com/',
          NULL,
          '剧情驱动的开放世界角色扮演游戏，以支线叙事与世界沉浸感著称。',
          'Steam经典RPG'
        ),
        ('博德之门3',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Larian Studios',
          'https://baldursgate3.game/',
          NULL,
          '基于龙与地下城规则的CRPG，以极高的自由度与叙事分支闻名。',
          'Steam年度神作'
        ),
        ('艾尔登法环',
          (SELECT id FROM genres WHERE code = 'ARPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'FromSoftware',
          'https://www.eldenring.jp/',
          NULL,
          '2022年度最佳游戏，魂系开放世界巅峰之作。',
          'Steam魂系神作'
        ),
        ('怪物猎人：荒野',
          (SELECT id FROM genres WHERE code = 'ARPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Capcom',
          'https://www.monsterhunter.com/wilds/',
          NULL,
          '大型怪物共斗动作角色扮演，强调武器熟练度与团队配合狩猎。',
          'Steam共斗神作'
        ),
        ('CS2',
          (SELECT id FROM genres WHERE code = 'FPS'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Valve',
          'https://www.counter-strike.net/cs2',
          NULL,
          '经典竞技射击游戏的延续，强调团队协作、地图控制与枪法对抗。',
          'Steam竞技射击'
        ),
        ('Dota 2',
          (SELECT id FROM genres WHERE code = 'MOBA'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Valve',
          'https://www.dota2.com/',
          NULL,
          '高策略深度的MOBA，强调资源管理、团战与阵容协同。',
          'Steam MOBA神作'
        ),
        ('绝地求生',
          (SELECT id FROM genres WHERE code = 'TPS'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'KRAFTON',
          'https://pubg.com/',
          NULL,
          '大逃杀游戏开创者，百人空降竞技。',
          'Steam吃鸡鼻祖'
        ),
        ('鬼泣5',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Capcom',
          'https://www.devilmaycry.com/5/',
          NULL,
          '高速华丽动作游戏的代表作，强调连招评分与多种武器风格切换。',
          'Steam动作巅峰'
        ),
        ('只狼：影逝二度',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'FromSoftware',
          'https://www.sekirothegame.com/',
          NULL,
          '2019年度最佳游戏，日本战国忍者动作游戏，强调架势与弹反。',
          'Steam年度动作'
        ),
        ('帝国时代4',
          (SELECT id FROM genres WHERE code = 'RTS'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Relic Entertainment',
          'https://www.ageofempires.com/',
          NULL,
          '历史题材即时战略游戏，强调文明特色、经济运营与军事对抗。',
          'Steam RTS经典'
        ),
        ('文明6',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Firaxis Games',
          'https://civilization.com/',
          NULL,
          '回合制4X策略游戏代表作，玩家从远古时代领导文明走向胜利。',
          'Steam策略神作'
        ),
        ('全面战争：三国',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Creative Assembly',
          'https://www.totalwar.com/',
          NULL,
          '回合制战略与即时战术结合，体验三国时代的史诗战争。',
          'Steam三国策略'
        ),
        ('XCOM 2',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Firaxis',
          'https://xcom.com/',
          NULL,
          '外星入侵背景的策略战棋，管理反抗军基地。',
          'Steam战棋经典'
        ),
        ('星露谷物语',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'ConcernedApe',
          'https://www.stardewvalley.net/',
          NULL,
          '像素风农场模拟经营，包含种植、社交、探索等多种玩法循环。',
          'Steam种田神作'
        ),
        ('城市：天际线',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Paradox Interactive',
          'https://www.paradoxinteractive.com/',
          NULL,
          '城市建设与交通规划模拟，侧重系统联动与城市运行效率。',
          'Steam城建模拟'
        ),
        ('模拟人生4',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Maxis',
          'https://www.ea.com/games/the-sims',
          NULL,
          '生活模拟游戏经典，创建虚拟人物并引导他们的人生。',
          'Steam生活模拟'
        ),
        ('极限竞速：地平线5',
          (SELECT id FROM genres WHERE code = 'RAC'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Playground Games',
          'https://forza.net/',
          NULL,
          '开放世界赛车竞速游戏，以墨西哥风光与海量授权车辆为特色。',
          'Steam赛车神作'
        ),
        ('极品飞车：不羁',
          (SELECT id FROM genres WHERE code = 'RAC'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Criterion',
          'https://www.ea.com/',
          NULL,
          '街头赛车游戏，漫画风格的视觉特效与警匪追逐。',
          'Steam街头赛车'
        ),
        ('EA SPORTS FC 25',
          (SELECT id FROM genres WHERE code = 'SPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'EA Sports',
          'https://www.ea.com/',
          NULL,
          '年度足球模拟游戏，拥有海量真实授权球员与联赛数据。',
          'Steam足球模拟'
        ),
        ('NBA 2K25',
          (SELECT id FROM genres WHERE code = 'SPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          '2K',
          'https://nba.2k.com/',
          NULL,
          '篮球模拟游戏，以拟真操作与MyCareer生涯模式为核心卖点。',
          'Steam篮球模拟'
        ),
        ('街头霸王6',
          (SELECT id FROM genres WHERE code = 'FTG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Capcom',
          'https://www.streetfighter.com/6/',
          NULL,
          '2D格斗游戏的标杆之作，以现代操作模式降低入门门槛。',
          'Steam格斗标杆'
        ),
        ('铁拳8',
          (SELECT id FROM genres WHERE code = 'FTG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Bandai Namco',
          'https://tk8.tekken-official.eu/',
          NULL,
          '3D格斗游戏代表作，强调走位、帧数与三维空间的攻防博弈。',
          'Steam 3D格斗'
        ),
        ('拳皇15',
          (SELECT id FROM genres WHERE code = 'FTG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'SNK',
          'https://www.snk-corp.co.jp/',
          NULL,
          '2D格斗游戏经典，SNK全明星大乱斗，情怀与竞技并存。',
          'Steam格斗经典'
        ),
        ('双人成行',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Hazelight Studios',
          'https://www.ea.com/games/it-takes-two',
          NULL,
          '双人合作冒险游戏，关卡机制持续变化，强调协作与沟通。',
          'Steam双人神作'
        ),
        ('古墓丽影：暗影',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Eidos-Montréal',
          'https://www.tombraider.com/',
          NULL,
          '劳拉·克劳馥的起源三部曲终章。',
          'Steam冒险经典'
        ),
        ('俄罗斯方块效应：连接',
          (SELECT id FROM genres WHERE code = 'PUZ'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Monstars Inc.',
          'https://www.tetriseffect.connected/',
          NULL,
          '经典方块玩法与沉浸式音画演出结合。',
          'Steam益智神作'
        ),
        ('Portal 2',
          (SELECT id FROM genres WHERE code = 'PUZ'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Valve',
          'https://www.thinkwithportals.com/',
          NULL,
          '第一人称物理解谜神作，GLaDOS的黑色幽默。',
          'Steam解谜神作'
        ),
        ('Baba Is You',
          (SELECT id FROM genres WHERE code = 'PUZ'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Hempuli',
          'https://hempuli.com/',
          NULL,
          '推箱子规则改变游戏，通过改变游戏规则来通关。',
          'Steam创意解谜'
        ),
        ('哈迪斯',
          (SELECT id FROM genres WHERE code = 'Roguelike'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Supergiant Games',
          'https://www.supergiantgames.com/games/hades/',
          NULL,
          '高口碑动作Roguelike，以希腊神话叙事与爽快战斗著称。',
          'Steam肉鸽神作'
        ),
        ('杀戮尖塔',
          (SELECT id FROM genres WHERE code = 'Roguelike'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Mega Crit',
          'https://www.megacrit.com/',
          NULL,
          '卡牌构筑Roguelike代表作，开创了"爬塔"品类。',
          'Steam卡牌肉鸽'
        ),
        ('以撒的结合：忏悔',
          (SELECT id FROM genres WHERE code = 'Roguelike'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Nicalis',
          'https://bindingofisaac.com/',
          NULL,
          'Roguelike射击游戏，宗教隐喻与黑暗幽默。',
          'Steam肉鸽经典'
        ),
        ('死亡细胞',
          (SELECT id FROM genres WHERE code = 'Roguelike'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Motion Twin',
          'https://dead-cells.com/',
          NULL,
          'Roguelite银河恶魔城，流畅的动作战斗。',
          'Steam银河恶魔城'
        ),
        ('生化危机4 重制版',
          (SELECT id FROM genres WHERE code = 'Horror'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Capcom',
          'https://www.residentevil.com/re4/',
          NULL,
          '第三人称恐怖生存射击，以资源管理与压迫感战斗重塑经典。',
          'Steam恐怖重制'
        ),
        ('逃生2',
          (SELECT id FROM genres WHERE code = 'Horror'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Red Barrels',
          'https://redbarrelsgames.com/',
          NULL,
          '第一人称恐怖游戏，摄像机夜视模式下的绝望逃亡。',
          'Steam恐怖逃生'
        ),
        ('恐鬼症',
          (SELECT id FROM genres WHERE code = 'Horror'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Kinetic Games',
          'https://www.kineticgames.co.uk/',
          NULL,
          '多人合作恐怖游戏，扮演捉鬼团队调查灵异事件。',
          'Steam多人恐怖'
        ),
        ('我的世界',
          (SELECT id FROM genres WHERE code = 'Sandbox'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Mojang',
          'https://www.minecraft.net/',
          NULL,
          '史上最畅销游戏，无限可能的方块世界。',
          'Steam沙盒神作'
        ),
        ('泰拉瑞亚',
          (SELECT id FROM genres WHERE code = 'Sandbox'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Re-Logic',
          'https://terraria.org/',
          NULL,
          '2D沙盒动作冒险，融合建造、探索、战斗与RPG成长要素。',
          'Steam 2D沙盒'
        ),
        ('饥荒',
          (SELECT id FROM genres WHERE code = 'Sandbox'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Klei',
          'https://www.klei.com/',
          NULL,
          '哥特风格生存沙盒，在诡异的世界中收集资源、对抗怪物。',
          'Steam生存沙盒'
        ),
        ('盖瑞模组',
          (SELECT id FROM genres WHERE code = 'Sandbox'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Facepunch',
          'https://gmod.facepunch.com/',
          NULL,
          'Source引擎物理沙盒，玩家创造各种搞笑场景。',
          'Steam物理沙盒'
        ),
        ('OSU!',
          (SELECT id FROM genres WHERE code = 'Rhythm'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'peppy',
          'https://osu.ppy.sh/',
          NULL,
          '免费PC节奏游戏，社区创作谱面，多种游戏模式。',
          'Steam免费音游'
        ),
        ('吸血鬼幸存者',
          (SELECT id FROM genres WHERE code = 'OTHER'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'poncle',
          'https://vampire-survivors.com/',
          NULL,
          '轻量Roguelite弹幕生存玩法，强调构筑与数值成长带来的爽感。',
          'Steam独立黑马'
        ),
        ('糖豆人',
          (SELECT id FROM genres WHERE code = 'OTHER'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Mediatonic',
          'https://www.fallguys.com/',
          NULL,
          '欢乐派对游戏，60人同台竞技，各种趣味关卡。',
          'Steam派对游戏'
        ),
        ('潜水员戴夫',
          (SELECT id FROM genres WHERE code = 'OTHER'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'MINTROCKET',
          'https://store.steampowered.com/',
          NULL,
          '白天捕鱼晚上经营寿司店，融合多种玩法的独立游戏黑马。',
          'Steam独立佳作'
        ),

        -- ============================================
        -- Xbox 平台游戏 (platform_id = 5)
        -- ============================================
        ('战争机器5',
          (SELECT id FROM genres WHERE code = 'TPS'),
          (SELECT id FROM platforms WHERE code = 'Xbox'),
          'The Coalition',
          'https://www.gearsofwar.com/',
          NULL,
          '科幻题材第三人称掩体射击，以血腥处决与coop战役为特色。',
          'Xbox独占射击'
        ),
        ('光环：无限',
          (SELECT id FROM genres WHERE code = 'FPS'),
          (SELECT id FROM platforms WHERE code = 'Xbox'),
          '343 Industries',
          'https://www.halowaypoint.com/',
          NULL,
          'Xbox旗舰FPS，士官长的最新冒险，开放世界战役。',
          'Xbox独占旗舰'
        ),
        ('极限竞速',
          (SELECT id FROM genres WHERE code = 'RAC'),
          (SELECT id FROM platforms WHERE code = 'Xbox'),
          'Turn 10',
          'https://forza.net/',
          NULL,
          '拟真赛车模拟，Xbox平台的GT赛车竞品。',
          'Xbox独占赛车'
        ),
        ('盗贼之海',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'Xbox'),
          'Rare',
          'https://www.seaofthieves.com/',
          NULL,
          '海盗题材开放世界冒险，与好友一起航海寻宝。',
          'Xbox独占海盗'
        ),
        ('禁闭求生',
          (SELECT id FROM genres WHERE code = 'Sandbox'),
          (SELECT id FROM platforms WHERE code = 'Xbox'),
          'Obsidian',
          'https://www.groundedgame.com/',
          NULL,
          '微观世界生存冒险，被缩小后在后院生存。',
          'Xbox独占生存'
        ),
        ('完美音浪',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'Xbox'),
          'Tango Gameworks',
          'https://www.bethesda.net/',
          NULL,
          '节奏动作游戏，跟随音乐节奏进行战斗。',
          'Xbox独占节奏动作'
        ),

        -- ============================================
        -- APP 手机游戏 (platform_id = 6)
        -- ============================================
        ('王者荣耀',
          (SELECT id FROM genres WHERE code = 'MOBA'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          '腾讯',
          'https://pvp.qq.com/',
          NULL,
          '国民级手游MOBA，5v5王者峡谷对战。',
          '手游MOBA霸主'
        ),
        ('原神',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          '米哈游',
          'https://ys.mihoyo.com/',
          NULL,
          '开放世界动作角色扮演游戏，围绕元素反应与角色养成展开。',
          '手游开放世界'
        ),
        ('纪念碑谷2',
          (SELECT id FROM genres WHERE code = 'PUZ'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          'ustwo games',
          'https://www.monumentvalleygame.com/',
          NULL,
          '视错觉艺术解谜游戏，以极简美学与母女情感故事打动人心。',
          '手游解谜艺术'
        ),
        ('和平精英',
          (SELECT id FROM genres WHERE code = 'TPS'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          '腾讯',
          'https://gp.qq.com/',
          NULL,
          '国内版绝地求生手游，百人战术竞技。',
          '手游吃鸡霸主'
        ),
        ('阴阳师',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          '网易',
          'https://yys.163.com/',
          NULL,
          '日式和风回合制RPG，收集式神进行战斗。',
          '手游日式RPG'
        ),
        ('明日方舟',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          '鹰角网络',
          'https://ak.hypergryph.com/',
          NULL,
          '塔防策略游戏，精美的二次元画风与深度剧情。',
          '手游塔防策略'
        ),
        ('崩坏：星穹铁道',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          '米哈游',
          'https://sr.mihoyo.com/',
          NULL,
          '回合制太空冒险RPG，崩坏系列新作。',
          '手游回合制RPG'
        ),
        ('蛋仔派对',
          (SELECT id FROM genres WHERE code = 'OTHER'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          '网易',
          'https://party.163.com/',
          NULL,
          '欢乐派对游戏，类似糖豆人的手游版。',
          '手游派对游戏'
        ),

        -- ============================================
        -- Web 网页游戏 (platform_id = 7)
        -- 真正的网页游戏：洛克王国、奥奇传说等
        -- ============================================
        ('洛克王国',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '腾讯',
          'https://17roco.qq.com/',
          NULL,
          '儿童向宠物养成网页游戏，捕捉精灵进行冒险。',
          '经典网页RPG'
        ),
        ('奥奇传说',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '百田',
          'https://aoqi.100bt.com/',
          NULL,
          '精灵收集养成网页游戏，策略回合制战斗。',
          '经典网页RPG'
        ),
        ('赛尔号',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '淘米',
          'https://seer.61.com/',
          NULL,
          '太空探险题材网页游戏，捕捉训练精灵。',
          '经典网页RPG'
        ),
        ('摩尔庄园',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '淘米',
          'https://mole.61.com/',
          NULL,
          '儿童向社区养成网页游戏，经营自己的庄园。',
          '经典网页模拟'
        ),
        ('奥拉星',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '百田',
          'https://aola.100bt.com/',
          NULL,
          '亚比收集养成网页游戏，回合制战斗系统。',
          '经典网页RPG'
        ),
        ('功夫派',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '淘米',
          'https://gongfu.61.com/',
          NULL,
          '武侠题材横版动作网页游戏。',
          '经典网页动作'
        ),
        ('弹弹堂',
          (SELECT id FROM genres WHERE code = 'OTHER'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '第七大道',
          'https://ddt.7road.com/',
          NULL,
          '弹射对战网页游戏，类似疯狂坦克的玩法。',
          '经典网页对战'
        ),
        ('热血三国',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '乐港',
          'https://sg.ledu.com/',
          NULL,
          '三国题材策略网页游戏，经营城池征战天下。',
          '经典网页策略'
        ),
        ('神仙道',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '心动网络',
          'https://sxd.xd.com/',
          NULL,
          '仙侠题材回合制RPG网页游戏。',
          '经典网页仙侠'
        ),
        ('七雄争霸',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '腾讯',
          'https://7.qq.com/',
          NULL,
          '战国七雄题材策略网页游戏，国战为核心玩法。',
          '经典网页国战'
        ),
        ('烽火战国',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '腾讯',
          'https://zg.qq.com/',
          NULL,
          '春秋战国题材策略网页游戏。',
          '经典网页策略'
        ),
        ('QQ农场',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '腾讯',
          'https://nc.qq.com/',
          NULL,
          '社交农场游戏，偷菜玩法风靡一时。',
          '经典网页农场'
        ),
        ('QQ牧场',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '腾讯',
          'https://mc.qq.com/',
          NULL,
          'QQ农场姊妹篇，养殖动物的社交游戏。',
          '经典网页牧场'
        ),
        ('开心农场',
          (SELECT id FROM genres WHERE code = 'SIM'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '五分钟',
          'https://kx.5minutes.com/',
          NULL,
          '最早的社交农场游戏之一，种菜偷菜玩法。',
          '经典网页农场'
        ),
        ('植物大战僵尸OL',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          '腾讯',
          'https://pvz.qq.com/',
          NULL,
          '植物大战僵尸网页版，塔防策略玩法。',
          '经典网页塔防'
        ),
        ('部落冲突网页版',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'Web'),
          'Supercell',
          'https://clashofclans.com/',
          NULL,
          '策略经营网页游戏，建造部落征战四方。',
          '经典网页策略'
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
        const gamePool = ['CS2', 'Valorant', '英雄联盟', 'Dota 2', '星露谷物语', '城市：天际线', '双人成行', '神秘海域4', '艾尔登法环', '怪物猎人：荒野', '巫师3：狂猎', '博德之门3', '鬼泣5', '塞尔达传说：王国之泪', '哈迪斯', '我的世界']
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