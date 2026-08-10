const repository = require('../../services/repository')
const {
  formatMonthKey,
  monthLabel,
  getMonthCalendar,
  displayDate,
  weekdayLabel,
  formatDate,
  formatDuration,
  shiftMonthKey
} = require('../../utils/date')
const { moodImage } = require('../../utils/moods')

const typeLabels = {
  rally: '拉球',
  lesson: '学球',
  machine: '发球机',
  match: '比赛'
}

Page({
  data: {
    weekLabels: ['日', '一', '二', '三', '四', '五', '六'],
    cursor: formatMonthKey(new Date()),
    monthLabel: '',
    cells: [],
    stats: { count: 0, hours: '0' },
    selectedDate: '',
    isSelectedToday: false,
    selectedLabel: '',
    selectedSessions: [],
    allSessions: []
  },

  async onShow() {
    const sessions = await repository.listSessions()
    this.setData({ allSessions: sessions })
    this.renderMonth(this.data.cursor, sessions)
    this.resetSelectionForMonth(this.data.cursor)
  },

  renderMonth(cursor, sessions) {
    const monthKey = formatMonthKey(cursor)
    const monthSessions = sessions.filter(session => session.date.startsWith(monthKey))
    const grouped = {}
    sessions.forEach(session => {
      if (!grouped[session.date]) grouped[session.date] = []
      grouped[session.date].push(session)
    })

    const cells = getMonthCalendar(cursor).map(cell => ({
      ...cell,
      count: (grouped[cell.date] || []).length,
      active: cell.currentMonth && Boolean(grouped[cell.date])
    }))
    const minutes = monthSessions.reduce((sum, session) => sum + Number(session.duration || 0), 0)

    this.setData({
      cursor,
      monthLabel: monthLabel(cursor),
      cells,
      stats: {
        count: monthSessions.length,
        hours: (minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1)
      }
    })
  },

  previousMonth() {
    const cursor = shiftMonthKey(this.data.cursor, -1)
    this.renderMonth(cursor, this.data.allSessions)
    this.resetSelectionForMonth(cursor)
  },

  nextMonth() {
    const cursor = shiftMonthKey(this.data.cursor, 1)
    this.renderMonth(cursor, this.data.allSessions)
    this.resetSelectionForMonth(cursor)
  },

  resetSelectionForMonth(cursor) {
    const today = formatDate(new Date())
    if (today.startsWith(formatMonthKey(cursor))) {
      this.selectDateValue(today)
      return
    }
    this.setData({
      selectedDate: '',
      isSelectedToday: false,
      selectedLabel: '',
      selectedSessions: []
    })
  },

  selectDate(event) {
    this.selectDateValue(event.currentTarget.dataset.date)
  },

  selectDateValue(date) {
    const sessions = this.data.allSessions
      .filter(session => session.date === date)
      .map(session => ({
        ...session,
        moodImage: moodImage(session.mood),
        typeLabel: typeLabels[session.type] || '打球',
        durationLabel: formatDuration(session.duration)
      }))

    this.setData({
      selectedDate: date,
      isSelectedToday: date === formatDate(new Date()),
      selectedLabel: `${displayDate(date)} · ${weekdayLabel(date)}`,
      selectedSessions: sessions
    })
  },

  goRecord() {
    wx.navigateTo({ url: '/pages/record/index' })
  },

  goRecordForDate() {
    if (!this.data.selectedDate) return
    wx.navigateTo({
      url: `/pages/record/index?date=${this.data.selectedDate}`
    })
  }
})
