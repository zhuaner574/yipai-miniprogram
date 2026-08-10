const repository = require('../../services/repository')
const { displayDate, weekdayLabel, formatDuration } = require('../../utils/date')
const { moodLabel, moodImage } = require('../../utils/moods')
const { formatReplyCopy } = require('../../utils/replies')

const typeLabels = {
  rally: '拉球',
  lesson: '学球',
  machine: '发球机',
  match: '比赛'
}

Page({
  data: {
    sessions: [],
    expandedId: ''
  },

  async onShow() {
    const sessions = await repository.listSessions()
    this.setData({
      sessions: sessions.map(session => ({
        ...session,
        typeLabel: typeLabels[session.type] || '打球',
        moodLabel: moodLabel(session.mood),
        moodImage: moodImage(session.mood),
        displayDate: displayDate(session.date),
        weekday: weekdayLabel(session.date),
        durationLabel: formatDuration(session.duration),
        reply: session.reply ? {
          ...session.reply,
          title: formatReplyCopy(session.reply.title),
          message: formatReplyCopy(session.reply.message),
          nextStep: formatReplyCopy(session.reply.nextStep)
        } : null,
        matchSummary: session.matchFormat === 'tournament'
          ? `${session.matchCount ? `${session.matchCount}场 · ` : ''}${session.placement || '未填写结果'}`
          : `${session.matchResult ? (session.matchResult === 'win' ? '胜' : '负') : '未填写结果'}${session.score ? ` · ${session.score}` : ''}`
      }))
    })
  },

  toggleSession(event) {
    const id = event.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? '' : id })
  },

  editSession(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/record/index?id=${id}` })
  },

  deleteSession(event) {
    const id = event.currentTarget.dataset.id
    const session = this.data.sessions.find(item => item.id === id)
    if (!session) return

    wx.showModal({
      title: '删除这条记录',
      content: `${session.displayDate} 的记录删除后无法恢复`,
      confirmText: '删除',
      confirmColor: '#B45D55',
      success: async result => {
        if (!result.confirm) return
        await repository.deleteSession(id)
        this.setData({ expandedId: '' })
        await this.onShow()
        wx.showToast({ title: '记录已删除', icon: 'none' })
      }
    })
  },

  goRecord() {
    wx.navigateTo({ url: '/pages/record/index' })
  }
})
