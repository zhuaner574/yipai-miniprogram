const repository = require('../../services/repository')
const {
  formatDate,
  formatMonthKey,
  monthLabel,
  getMonthCalendar,
  displayDate,
  formatDuration
} = require('../../utils/date')

const typeLabels = {
  rally: '拉球',
  lesson: '学球',
  machine: '发球机',
  match: '比赛'
}

Page({
  data: {
    loading: true,
    weekLabels: ['日', '一', '二', '三', '四', '五', '六'],
    profile: null,
    monthLabel: '',
    stats: {
      count: 0,
      hours: '0',
      activeDays: 0
    },
    calendar: [],
    recent: null
  },

  async onShow() {
    const profile = await repository.getProfile()
    if (!profile) {
      wx.reLaunch({ url: '/pages/onboarding/index' })
      return
    }

    const sessions = await repository.listSessions()
    const now = new Date()
    const monthKey = formatMonthKey(now)
    const monthSessions = sessions.filter(session => session.date.startsWith(monthKey))
    const totalMinutes = monthSessions.reduce((sum, session) => sum + Number(session.duration || 0), 0)
    const activeDates = new Set(monthSessions.map(session => session.date))
    const sessionDates = new Set(sessions.map(session => session.date))
    const calendar = getMonthCalendar(now).map(cell => ({
      ...cell,
      active: cell.currentMonth && sessionDates.has(cell.date)
    }))
    const recent = sessions[0] ? this.formatSession(sessions[0]) : null

    this.setData({
      loading: false,
      profile,
      monthLabel: monthLabel(now),
      stats: {
        count: monthSessions.length,
        hours: (totalMinutes / 60).toFixed(totalMinutes % 60 === 0 ? 0 : 1),
        activeDays: activeDates.size
      },
      calendar,
      recent
    })
  },

  formatSession(session) {
    return {
      ...session,
      typeLabel: typeLabels[session.type] || '打球',
      displayDate: displayDate(session.date),
      durationLabel: formatDuration(session.duration)
    }
  },

  goRecord() {
    wx.navigateTo({ url: '/pages/record/index' })
  },

  goCalendar() {
    wx.switchTab({ url: '/pages/calendar/index' })
  },

  goHistory() {
    wx.switchTab({ url: '/pages/history/index' })
  }
})
