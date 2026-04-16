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
        ('巫师3：狂猎',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'CD PROJEKT RED',
          'https://thewitcher.com/',
          NULL,
          '剧情驱动的开放世界角色扮演游戏，以支线叙事与世界沉浸感著称。',
          NULL
        ),
        ('博德之门3',
          (SELECT id FROM genres WHERE code = 'RPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Larian Studios',
          'https://baldursgate3.game/',
          NULL,
          '基于龙与地下城规则的CRPG，以极高的自由度与叙事分支闻名。',
          NULL
        ),

        -- ARPG
        ('艾尔登法环',
          (SELECT id FROM genres WHERE code = 'ARPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'FromSoftware',
          'https://www.eldenring.jp/',
          NULL,
          '黑暗幻想开放世界动作角色扮演，以高难度战斗与探索奖励著称。',
          NULL
        ),
        ('怪物猎人：荒野',
          (SELECT id FROM genres WHERE code = 'ARPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Capcom',
          'https://www.monsterhunter.com/wilds/',
          NULL,
          '大型怪物共斗动作角色扮演，强调武器熟练度与团队配合狩猎。',
          NULL
        ),

        -- MMORPG
        ('魔兽世界',
          (SELECT id FROM genres WHERE code = 'MMORPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Blizzard Entertainment',
          'https://worldofwarcraft.com/',
          NULL,
          '经典大型多人在线角色扮演游戏，拥有庞大的世界观与团队副本内容。',
          NULL
        ),
        ('最终幻想14',
          (SELECT id FROM genres WHERE code = 'MMORPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Square Enix',
          'https://jp.finalfantasyxiv.com/',
          NULL,
          '以剧情演出和副本设计见长的MMORPG，被誉为最友好的入坑之作。',
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

        -- TPS
        ('绝地求生',
          (SELECT id FROM genres WHERE code = 'TPS'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'KRAFTON',
          'https://pubg.com/',
          NULL,
          '百人战术竞技射击游戏，开创了“吃鸡”玩法的先河。',
          NULL
        ),
        ('战争机器5',
          (SELECT id FROM genres WHERE code = 'TPS'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'The Coalition',
          'https://www.gearsofwar.com/',
          NULL,
          '科幻题材第三人称掩体射击，以血腥处决与 coop 战役为特色。',
          NULL
        ),

        -- ACT
        ('鬼泣5',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Capcom',
          'https://www.devilmaycry.com/5/',
          NULL,
          '高速华丽动作游戏的代表作，强调连招评分与多种武器风格切换。',
          NULL
        ),
        ('战神：诸神黄昏',
          (SELECT id FROM genres WHERE code = 'ACT'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Santa Monica Studio',
          'https://www.playstation.com/',
          NULL,
          '一镜到底的叙事动作冒险，父子旅程与北欧神话交织的史诗之作。',
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

        -- RTS
        ('星际争霸2',
          (SELECT id FROM genres WHERE code = 'RTS'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Blizzard Entertainment',
          'https://starcraft2.com/',
          NULL,
          '科幻题材即时战略巅峰之作，以极高的操作上限与电竞生态著称。',
          NULL
        ),
        ('帝国时代4',
          (SELECT id FROM genres WHERE code = 'RTS'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Relic Entertainment',
          'https://www.ageofempires.com/',
          NULL,
          '历史题材即时战略游戏，强调文明特色、经济运营与军事对抗。',
          NULL
        ),

        -- SLG
        ('文明6',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Firaxis Games',
          'https://civilization.com/',
          NULL,
          '回合制4X策略游戏代表作，玩家从远古时代领导文明走向胜利。',
          NULL
        ),
        ('火焰纹章：结合',
          (SELECT id FROM genres WHERE code = 'SLG'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Intelligent Systems',
          'https://www.nintendo.com/',
          NULL,
          '战棋策略角色扮演，强调兵种克制、角色培养与战术走位。',
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

        -- RAC
        ('极限竞速：地平线5',
          (SELECT id FROM genres WHERE code = 'RAC'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Playground Games',
          'https://forza.net/',
          NULL,
          '开放世界赛车竞速游戏，以墨西哥风光与海量授权车辆为特色。',
          NULL
        ),
        ('马力欧赛车8 豪华版',
          (SELECT id FROM genres WHERE code = 'RAC'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '欢乐向卡丁车竞速游戏，道具互坑与赛道设计深受全年龄喜爱。',
          NULL
        ),

        -- SPG
        ('EA SPORTS FC 25',
          (SELECT id FROM genres WHERE code = 'SPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'EA Sports',
          'https://www.ea.com/',
          NULL,
          '年度足球模拟游戏，拥有海量真实授权球员与联赛数据。',
          NULL
        ),
        ('NBA 2K25',
          (SELECT id FROM genres WHERE code = 'SPG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          '2K',
          'https://nba.2k.com/',
          NULL,
          '篮球模拟游戏，以拟真操作与MyCareer生涯模式为核心卖点。',
          NULL
        ),

        -- FTG
        ('街头霸王6',
          (SELECT id FROM genres WHERE code = 'FTG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Capcom',
          'https://www.streetfighter.com/6/',
          NULL,
          '2D格斗游戏的标杆之作，以现代操作模式降低入门门槛。',
          NULL
        ),
        ('铁拳8',
          (SELECT id FROM genres WHERE code = 'FTG'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Bandai Namco',
          'https://tk8.tekken-official.eu/',
          NULL,
          '3D格斗游戏代表作，强调走位、帧数与三维空间的攻防博弈。',
          NULL
        ),

        -- ADV
        ('塞尔达传说：王国之泪',
          (SELECT id FROM genres WHERE code = 'ADV'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Nintendo',
          'https://www.nintendo.com/',
          NULL,
          '开放世界动作冒险游戏，强调探索、解谜与自由构筑玩法。',
          NULL
        ),
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

        -- PUZ
        ('纪念碑谷2',
          (SELECT id FROM genres WHERE code = 'PUZ'),
          (SELECT id FROM platforms WHERE code = 'APP'),
          'ustwo games',
          'https://www.monumentvalleygame.com/',
          NULL,
          '视错觉艺术解谜游戏，以极简美学与母女情感故事打动人心。',
          NULL
        ),
        ('俄罗斯方块效应：连接',
          (SELECT id FROM genres WHERE code = 'PUZ'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Monstars Inc.',
          'https://www.tetriseffect.connected/',
          NULL,
          '经典方块玩法与沉浸式音画演出结合，支持多人合作与对战。',
          NULL
        ),

        -- Roguelike
        ('哈迪斯',
          (SELECT id FROM genres WHERE code = 'Roguelike'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Supergiant Games',
          'https://www.supergiantgames.com/games/hades/',
          NULL,
          '高口碑动作Roguelike，以希腊神话叙事与爽快战斗著称。',
          NULL
        ),
        ('杀戮尖塔',
          (SELECT id FROM genres WHERE code = 'Roguelike'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Mega Crit',
          'https://www.megacrit.com/',
          NULL,
          '卡牌构筑Roguelike代表作，开创了“爬塔”品类的影响力。',
          NULL
        ),

        -- Horror
        ('生化危机4 重制版',
          (SELECT id FROM genres WHERE code = 'Horror'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Capcom',
          'https://www.residentevil.com/re4/',
          NULL,
          '第三人称恐怖生存射击，以资源管理与压迫感战斗重塑经典。',
          NULL
        ),
        ('寂静岭2 重制版',
          (SELECT id FROM genres WHERE code = 'Horror'),
          (SELECT id FROM platforms WHERE code = 'PS4'),
          'Bloober Team',
          'https://www.konami.com/',
          NULL,
          '心理恐怖生存游戏的巅峰之作，以氛围叙事与 symbolism 著称。',
          NULL
        ),

        -- Sandbox
        ('我的世界',
          (SELECT id FROM genres WHERE code = 'Sandbox'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Mojang',
          'https://www.minecraft.net/',
          NULL,
          '开放世界沙盒建造游戏，以方块构筑与无限创造可能性闻名全球。',
          NULL
        ),
        ('泰拉瑞亚',
          (SELECT id FROM genres WHERE code = 'Sandbox'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'Re-Logic',
          'https://terraria.org/',
          NULL,
          '2D沙盒动作冒险，融合建造、探索、战斗与RPG成长要素。',
          NULL
        ),

        -- Rhythm
        ('太鼓达人',
          (SELECT id FROM genres WHERE code = 'Rhythm'),
          (SELECT id FROM platforms WHERE code = 'NS'),
          'Bandai Namco',
          'https://taiko-ch.net/blog/',
          NULL,
          '以日本传统太鼓为题材的欢乐音乐节奏游戏，曲库丰富。',
          NULL
        ),
        ('初音未来 Project DIVA MEGA39''s+',
          (SELECT id FROM genres WHERE code = 'Rhythm'),
          (SELECT id FROM platforms WHERE code = 'Steam'),
          'SEGA',
          'https://miku.sega.com/mega39splus/',
          NULL,
          'Vocaloid 音乐节奏游戏，收录大量初音未来经典曲目。',
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
