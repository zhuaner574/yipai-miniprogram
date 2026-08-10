const LEVEL_ORDER = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5及以上']

function parseTournamentResult(score) {
  const value = String(score || '')
  const winMatch = value.match(/(\d+)\s*胜/)
  const lossMatch = value.match(/(\d+)\s*负/)
  return {
    wins: winMatch ? Number(winMatch[1]) : 0,
    losses: lossMatch ? Number(lossMatch[1]) : 0
  }
}

function deriveMatchStats(sessions = []) {
  const groups = new Map()

  sessions.filter(session => session.type === 'match').forEach(session => {
    let wins = 0
    let losses = 0

    if (session.matchFormat === 'tournament') {
      const result = parseTournamentResult(session.score)
      wins = result.wins
      losses = result.losses
    } else if (session.matchResult === 'win') {
      wins = 1
    } else if (session.matchResult === 'loss') {
      losses = 1
    }

    if (!wins && !losses) return

    const level = session.matchLevel || '未填写级别'
    const current = groups.get(level) || { level, wins: 0, losses: 0 }
    current.wins += wins
    current.losses += losses
    groups.set(level, current)
  })

  return [...groups.values()]
    .map(item => {
      const total = item.wins + item.losses
      return {
        ...item,
        total,
        winRate: `${Math.round(item.wins / total * 100)}%`
      }
    })
    .sort((a, b) => {
      const aIndex = LEVEL_ORDER.indexOf(a.level)
      const bIndex = LEVEL_ORDER.indexOf(b.level)
      const aOrder = aIndex < 0 ? LEVEL_ORDER.length : aIndex
      const bOrder = bIndex < 0 ? LEVEL_ORDER.length : bIndex
      return aOrder - bOrder || a.level.localeCompare(b.level, 'zh-CN')
    })
}

module.exports = {
  deriveMatchStats,
  parseTournamentResult
}
