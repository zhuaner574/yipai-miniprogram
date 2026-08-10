const { formatMonthKey, monthLabel } = require('./date')

const ACHIEVEMENT_BADGES = [
  { id: 'first_session', icon: '🎾', name: '第一拍', description: '留下第一次打球记录', metric: 'sessions', target: 1 },
  { id: 'first_match', icon: '🏁', name: '第一场', description: '记录第一场比赛', metric: 'matches', target: 1 },
  { id: 'first_win', icon: '🏆', name: '赢下一场', description: '记录第一场胜利', metric: 'wins', target: 1 },
  { id: 'first_diary', icon: '✍️', name: '写下这一拍', description: '留下第一篇打球日记', metric: 'diaries', target: 1 },
  { id: 'sessions_10', icon: '🌱', name: '十次相见', description: '累计记录10次打球', metric: 'sessions', target: 10 },
  { id: 'sessions_30', icon: '🌿', name: '球场常客', description: '累计记录30次打球', metric: 'sessions', target: 30 },
  { id: 'sessions_100', icon: '🌳', name: '百拍成林', description: '累计记录100次打球', metric: 'sessions', target: 100 },
  { id: 'hours_10', icon: '⏱️', name: '十小时朋友', description: '累计打球达到10小时', metric: 'minutes', target: 600, unit: '小时', divisor: 60 },
  { id: 'hours_50', icon: '⌛', name: '五十小时', description: '累计打球达到50小时', metric: 'minutes', target: 3000, unit: '小时', divisor: 60 },
  { id: 'matches_10', icon: '🏟️', name: '赛场熟面孔', description: '累计记录10场比赛', metric: 'matches', target: 10 },
  { id: 'diaries_10', icon: '📖', name: '球场写作者', description: '留下10篇认真的打球日记', metric: 'diaries', target: 10 },
  { id: 'all_rounder', icon: '🧩', name: '打法收集家', description: '记录过4种不同打球方式', metric: 'types', target: 4 },
  { id: 'early_bird', icon: '🌤️', name: '清晨第一拍', description: '在早上9点前开始打球', metric: 'earlyBird', target: 1, hidden: true },
  { id: 'return', icon: '🫶', name: '再次出发', description: '停歇两周后重新回到球场', metric: 'longReturn', target: 1, hidden: true }
]

const MONTHLY_BADGES = [
  { id: 'monthly_2', icon: '🌱', name: '本月开拍', description: '本月上场2次', metric: 'sessions', target: 2, unit: '次' },
  { id: 'monthly_4', icon: '🎯', name: '稳定在场', description: '本月上场4次', metric: 'sessions', target: 4, unit: '次' },
  { id: 'monthly_8', icon: '🔥', name: '本月全勤', description: '本月上场8次', metric: 'sessions', target: 8, unit: '次' },
  { id: 'monthly_5h', icon: '⏱️', name: '五小时朋友', description: '本月累计5小时', metric: 'minutes', target: 300, unit: '小时', divisor: 60 },
  { id: 'monthly_diary_3', icon: '📝', name: '三次记得', description: '本月写下3篇打球日记', metric: 'diaries', target: 3, unit: '篇' },
  { id: 'monthly_variety', icon: '🎨', name: '换种打法', description: '本月记录3种打球方式', metric: 'types', target: 3, unit: '种' },
  { id: 'monthly_match', icon: '🏁', name: '本月上场赛', description: '本月记录1场比赛', metric: 'matches', target: 1, unit: '场' },
  { id: 'monthly_dates_3', icon: '📅', name: '三天有球', description: '本月在3个不同日子上场', metric: 'dates', target: 3, unit: '天' }
]

function dayNumber(dateString) {
  const parts = String(dateString || '').split('-').map(Number)
  return Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000
}

function metricsFor(sessions) {
  const sorted = [...sessions].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  let longReturn = 0

  sorted.forEach((session, index) => {
    if (index > 0 && dayNumber(session.date) - dayNumber(sorted[index - 1].date) >= 14) {
      longReturn = 1
    }
  })

  return {
    sessions: sessions.length,
    minutes: sessions.reduce((sum, session) => sum + Number(session.duration || 0), 0),
    matches: sessions.filter(session => session.type === 'match').length,
    wins: sessions.filter(session => session.type === 'match' && session.matchResult === 'win').length,
    diaries: sessions.filter(session => (session.diary || '').trim().length >= 8).length,
    types: new Set(sessions.map(session => session.type).filter(Boolean)).size,
    dates: new Set(sessions.map(session => session.date).filter(Boolean)).size,
    earlyBird: sessions.some(session => session.startTime && session.startTime < '09:00') ? 1 : 0,
    longReturn
  }
}

function progressValue(badge, rawValue) {
  const divisor = badge.divisor || 1
  const current = Math.min(rawValue, badge.target) / divisor
  const target = badge.target / divisor
  return {
    current,
    target,
    percent: Math.min(100, Math.round(rawValue / badge.target * 100)),
    text: `${current} / ${target}${badge.unit || ''}`
  }
}

function deriveAchievementBadges(sessions, persistedIds = []) {
  const metrics = metricsFor(sessions)
  const persisted = new Set(persistedIds)

  return ACHIEVEMENT_BADGES.map((badge, order) => {
    const rawValue = metrics[badge.metric] || 0
    const unlocked = persisted.has(badge.id) || rawValue >= badge.target
    return {
      ...badge,
      order,
      unlocked,
      progress: progressValue(badge, rawValue)
    }
  })
}

function deriveMonthlyBadges(sessions, date = new Date()) {
  const key = formatMonthKey(date)
  const monthSessions = sessions.filter(session => String(session.date || '').startsWith(key))
  const metrics = metricsFor(monthSessions)

  return {
    key,
    label: monthLabel(date),
    badges: MONTHLY_BADGES.map((badge, order) => {
      const rawValue = metrics[badge.metric] || 0
      return {
        ...badge,
        order,
        unlocked: rawValue >= badge.target,
        progress: progressValue(badge, rawValue)
      }
    })
  }
}

function sortBadges(badges, unlockedAt = {}) {
  return [...badges].sort((left, right) => {
    if (left.unlocked !== right.unlocked) return left.unlocked ? -1 : 1

    if (left.unlocked) {
      const rightTime = Date.parse(unlockedAt[right.id] || '') || 0
      const leftTime = Date.parse(unlockedAt[left.id] || '') || 0
      if (rightTime !== leftTime) return rightTime - leftTime
      return left.order - right.order
    }

    if (right.progress.percent !== left.progress.percent) {
      return right.progress.percent - left.progress.percent
    }
    const leftRemaining = left.progress.target - left.progress.current
    const rightRemaining = right.progress.target - right.progress.current
    if (leftRemaining !== rightRemaining) return leftRemaining - rightRemaining
    return left.order - right.order
  })
}

function deriveBadges(sessions) {
  return deriveAchievementBadges(sessions)
}

module.exports = {
  ACHIEVEMENT_BADGES,
  MONTHLY_BADGES,
  deriveAchievementBadges,
  deriveMonthlyBadges,
  sortBadges,
  deriveBadges
}
