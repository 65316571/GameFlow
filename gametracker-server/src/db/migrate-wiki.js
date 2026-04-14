import { query } from './index.js'

const DEFAULTS = {
  RPG: { full: 'Role-Playing Game', icon: '⚔️', theme: 'RPG', wikiLabel: '维基百科 · 角色扮演游戏' },
  FPS: { full: 'First-Person Shooter', icon: '🔫', theme: 'FPS', wikiLabel: '维基百科 · 第一人称射击游戏' },
  MOBA: { full: 'Multiplayer Online Battle Arena', icon: '⚡', theme: 'MOBA', wikiLabel: '维基百科 · MOBA' },
  SIM: { full: 'Simulation Game', icon: '🏗️', theme: 'SIM', wikiLabel: '维基百科 · 模拟游戏' },
  ADV: { full: 'Adventure Game', icon: '🗺️', theme: 'ADV', wikiLabel: '维基百科 · 冒险游戏' },
  OTHER: { full: 'Other / Miscellaneous', icon: '🎯', theme: 'OTHER', wikiLabel: '维基百科 · 电子游戏类型总览' },
}

const SAMPLE_GAMES_WIKI = [
  { name: '塞尔达传说：王国之泪', publisher: 'Nintendo', official_url: 'https://www.nintendo.com/', wiki_intro: '开放世界动作冒险游戏，强调探索、解谜与自由构筑玩法。' },
  { name: '巫师3：狂猎', publisher: 'CD PROJEKT RED', official_url: 'https://thewitcher.com/', wiki_intro: '剧情驱动的开放世界角色扮演游戏，以支线叙事与世界沉浸感著称。' },
  { name: '原神', publisher: '米哈游', official_url: 'https://ys.mihoyo.com/', wiki_intro: '开放世界动作角色扮演游戏，围绕元素反应与角色养成展开。' },
  { name: 'CS2', publisher: 'Valve', official_url: 'https://www.counter-strike.net/cs2', wiki_intro: '经典竞技射击游戏的延续，强调团队协作、地图控制与枪法对抗。' },
  { name: 'Valorant', publisher: 'Riot Games', official_url: 'https://playvalorant.com/', wiki_intro: '战术射击与英雄技能结合的竞技 FPS，强调团队配合与战术执行。' },
  { name: '英雄联盟', publisher: 'Riot Games', official_url: 'https://www.leagueoflegends.com/', wiki_intro: '多人在线战术竞技游戏，围绕英雄对线、团战与地图目标展开。' },
  { name: 'Dota 2', publisher: 'Valve', official_url: 'https://www.dota2.com/', wiki_intro: '高策略深度的 MOBA，强调资源管理、团战与阵容协同。' },
  { name: '星露谷物语', publisher: 'ConcernedApe', official_url: 'https://www.stardewvalley.net/', wiki_intro: '像素风农场模拟经营，包含种植、社交、探索等多种玩法循环。' },
  { name: '城市：天际线', publisher: 'Paradox Interactive', official_url: 'https://www.paradoxinteractive.com/', wiki_intro: '城市建设与交通规划模拟，侧重系统联动与城市运行效率。' },
  { name: '双人成行', publisher: 'Hazelight Studios', official_url: 'https://www.ea.com/games/it-takes-two', wiki_intro: '双人合作冒险游戏，关卡机制持续变化，强调协作与沟通。' },
  { name: '神秘海域4', publisher: 'Naughty Dog', official_url: 'https://www.playstation.com/', wiki_intro: '电影化叙事动作冒险，融合探索、解谜与战斗演出。' },
  { name: '吸血鬼幸存者', publisher: 'poncle', official_url: 'https://vampire-survivors.com/', wiki_intro: '轻量 Roguelite 弹幕生存玩法，强调构筑与数值成长带来的爽感。' },
]

function splitExamples(s) {
  if (!s) return []
  return s
    .split(/、|，|,|；|;|\||\n/g)
    .map(x => x.trim())
    .filter(Boolean)
}

async function migrateWiki() {
  try {
    await query(`ALTER TABLE genres ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`)
    await query(`ALTER TABLE genres ADD COLUMN IF NOT EXISTS icon VARCHAR(20)`)
    await query(`ALTER TABLE genres ADD COLUMN IF NOT EXISTS theme_key VARCHAR(50)`)
    await query(`ALTER TABLE genres ADD COLUMN IF NOT EXISTS wiki_label VARCHAR(200)`)

    await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)`)
    await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS official_url VARCHAR(500)`)
    await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS publisher VARCHAR(255)`)
    await query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS wiki_intro TEXT`)

    await query(`CREATE INDEX IF NOT EXISTS idx_games_genre_id ON games(genre_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_games_platform_id ON games(platform_id)`)

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

    const genresRes = await query(`SELECT id, code, full_name, icon, theme_key, wiki_label, example_games FROM genres`)

    for (const g of genresRes.rows) {
      const d = DEFAULTS[g.code] || DEFAULTS.OTHER
      await query(
        `UPDATE genres
         SET full_name = COALESCE(full_name, $2),
             icon = COALESCE(icon, $3),
             theme_key = COALESCE(theme_key, $4),
             wiki_label = COALESCE(wiki_label, $5)
         WHERE id = $1`,
        [g.id, d.full, d.icon, d.theme, d.wikiLabel]
      )
    }

    const countRes = await query(`SELECT COUNT(*) FROM wiki_games`)
    const wikiGamesCount = parseInt(countRes.rows[0].count)
    if (wikiGamesCount === 0) {
      for (const g of genresRes.rows) {
        const items = splitExamples(g.example_games)
        let idx = 1
        for (const name of items) {
          await query(
            `INSERT INTO wiki_games (genre_id, name, sort_order)
             VALUES ($1, $2, $3)`,
            [g.id, name, idx++]
          )
        }
      }
      console.log('✓ wiki_games seeded from genres.example_games')
    } else {
      console.log('✓ wiki_games already has data, skip seeding')
    }

    const legacyRes = await query(`SELECT id, genre_id, name, publisher, intro, image_url FROM wiki_games ORDER BY id`)
    for (const w of legacyRes.rows) {
      const gRes = await query(
        `SELECT id, publisher, wiki_intro, cover_url
         FROM games
         WHERE genre_id = $1 AND name = $2
         ORDER BY id
         LIMIT 1`,
        [w.genre_id, w.name]
      )
      if (gRes.rows.length === 0) continue
      const g = gRes.rows[0]
      const nextPublisher = g.publisher || w.publisher || null
      const nextIntro = g.wiki_intro || w.intro || null
      const nextCover = g.cover_url || w.image_url || null
      if (!nextPublisher && !nextIntro && !nextCover) continue
      await query(
        `UPDATE games
         SET publisher = $2,
             wiki_intro = $3,
             cover_url = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [g.id, nextPublisher, nextIntro, nextCover]
      )
    }
    console.log('✓ games wiki fields backfilled from wiki_games (matched by genre_id + name)')

    for (const s of SAMPLE_GAMES_WIKI) {
      await query(
        `UPDATE games
         SET publisher = COALESCE(publisher, $2),
             official_url = COALESCE(official_url, $3),
             wiki_intro = COALESCE(wiki_intro, $4),
             updated_at = NOW()
         WHERE name = $1`,
        [s.name, s.publisher, s.official_url, s.wiki_intro]
      )
    }
    console.log('✓ games wiki fields seeded for sample game names (COALESCE)')

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

    console.log('✅ Wiki migration completed!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Wiki migration failed:', err.message)
    process.exit(1)
  }
}

migrateWiki()
