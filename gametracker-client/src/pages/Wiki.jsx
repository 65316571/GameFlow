import { useState } from 'react'

const GENRES = [
  {
    code: 'RPG',
    name: '角色扮演',
    full: 'Role-Playing Game',
    bg: '#eeedfe', color: '#534ab7',
    icon: '⚔️',
    desc: '玩家扮演一个或多个角色，在虚构世界中完成故事任务，通过战斗和成长提升角色能力。强调叙事、世界观构建与角色养成，通常拥有庞大的剧情和丰富的支线任务。',
    examples: ['最终幻想系列', '原神', '艾尔登法环', '女神异闻录5', '勇者斗恶龙', '破晓传说'],
    wikiUrl: 'https://zh.wikipedia.org/wiki/角色扮演游戏',
    wikiLabel: '维基百科 · 角色扮演游戏',
  },
  {
    code: 'FPS',
    name: '第一人称射击',
    full: 'First-Person Shooter',
    bg: '#faece7', color: '#993c1d',
    icon: '🔫',
    desc: '以第一人称视角操控角色进行射击对抗，玩家直接看到角色的武器和手部。强调反应速度、瞄准精度和团队配合，竞技性强，是电竞赛场的主流品类之一。',
    examples: ['Valorant', 'CS2', '使命召唤', '光环', '彩虹六号：围攻', '战地系列'],
    wikiUrl: 'https://zh.wikipedia.org/wiki/第一人称射击游戏',
    wikiLabel: '维基百科 · 第一人称射击游戏',
  },
  {
    code: 'MOBA',
    name: '多人在线战术',
    full: 'Multiplayer Online Battle Arena',
    bg: '#e1f5ee', color: '#0f6e56',
    icon: '⚡',
    desc: '两队玩家各自操控英雄角色，目标是摧毁对方基地。强调团队协作、英雄搭配与实时策略决策，每局游戏通常持续 30~60 分钟，拥有极高的竞技深度。',
    examples: ['英雄联盟', '王者荣耀', 'Dota 2', '风暴英雄', 'Smite'],
    wikiUrl: 'https://zh.wikipedia.org/wiki/多人在线战术竞技游戏',
    wikiLabel: '维基百科 · MOBA',
  },
  {
    code: 'SIM',
    name: '模拟经营',
    full: 'Simulation Game',
    bg: '#e6f1fb', color: '#185fa5',
    icon: '🏗️',
    desc: '模拟现实或虚构场景中的经营、建设、管理活动，节奏较慢，强调规划与资源调配，通常无明确胜负压力。涵盖城市建设、农场经营、交通模拟等多个子类型。',
    examples: ['城市：天际线', '星露谷物语', '模拟人生', '过山车之星', '动物森友会', '戴森球计划'],
    wikiUrl: 'https://zh.wikipedia.org/wiki/模拟游戏',
    wikiLabel: '维基百科 · 模拟游戏',
  },
  {
    code: 'ADV',
    name: '冒险解谜',
    full: 'Adventure Game',
    bg: '#faeeda', color: '#854f0b',
    icon: '🗺️',
    desc: '玩家在广阔世界中探索、收集线索、解开谜题，并推进剧情发展。注重世界探索的自由度与叙事沉浸感，部分作品融合了动作元素形成动作冒险子类型。',
    examples: ['塞尔达传说：王国之泪', '荒野大镖客2', '底特律：变人', '极乐迪斯科', '奥日系列'],
    wikiUrl: 'https://zh.wikipedia.org/wiki/冒险游戏',
    wikiLabel: '维基百科 · 冒险游戏',
  },
  {
    code: 'OTHER',
    name: '其他类型',
    full: 'Other / Miscellaneous',
    bg: '#f1efe8', color: '#5f5e5a',
    icon: '🎯',
    desc: '不属于以上类型的游戏，涵盖音乐节奏、体育竞技、格斗、益智、卡牌、恐怖生存等多元品类。每个子类型都有自己独特的玩法逻辑和受众群体。',
    examples: ['太鼓达人（音乐）', 'FIFA（体育）', '街头霸王6（格斗）', '炉石传说（卡牌）', '只狼（魂类）'],
    wikiUrl: 'https://zh.wikipedia.org/wiki/电子游戏类型',
    wikiLabel: '维基百科 · 电子游戏类型总览',
  },
]

export default function Wiki() {
  const [expanded, setExpanded] = useState(new Set(['RPG']))

  const toggle = (code) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <span style={{ fontSize: 32, marginRight: 10 }}>📚</span>
          游戏类型百科
        </div>
        <div className="page-subtitle">了解各类型特征与代表作，点击卡片展开详情 🔍</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
        {GENRES.map(g => {
          const open = expanded.has(g.code)
          return (
            <div key={g.code} className="card"
              style={{ 
                cursor: 'pointer', 
                border: `2px solid ${open ? '#afa9ec' : '#e8e6df'}`,
                transition: 'all 0.2s ease',
                transform: open ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: open ? '0 8px 24px rgba(127,119,221,0.12)' : 'none'
              }}
              onClick={() => toggle(g.code)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 14, flexShrink: 0,
                  background: g.bg, color: g.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}>
                  {g.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{g.name}</div>
                  <div style={{ fontSize: 13, color: '#b4b2a9', marginTop: 3 }}>{g.full}</div>
                </div>
                <div style={{ fontSize: 16, color: '#b4b2a9' }}>{open ? '🔼' : '🔽'}</div>
              </div>

              <div style={{ fontSize: 15, color: '#666', lineHeight: 1.8 }}>{g.desc}</div>

              {open && (
                <div onClick={e => e.stopPropagation()}>
                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: '0.5px solid #e8e6df' }}>
                    <div className="section-label" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18 }}>🎮</span> 代表游戏
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                      {g.examples.map(ex => (
                        <span key={ex} style={{
                          fontSize: 13, padding: '5px 14px', borderRadius: 6,
                          background: '#f1efe8', color: '#5f5e5a',
                          fontWeight: 500
                        }}>{ex}</span>
                      ))}
                    </div>
                    <a href={g.wikiUrl} target="_blank" rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        fontSize: 14, color: '#534ab7',
                        padding: '10px 16px', borderRadius: 10,
                        background: '#eeedfe', textDecoration: 'none',
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e0ddf9'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#eeedfe'
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🔗</span> {g.wikiLabel}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
