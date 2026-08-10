const repository = require('../../services/repository')
const { generateReply } = require('../../utils/replies')
const { formatDate } = require('../../utils/date')
const { deriveAchievementBadges, deriveMonthlyBadges } = require('../../utils/badges')

function pad(value) {
  return String(value).padStart(2, '0')
}

function defaultStartTime() {
  const now = new Date()
  const roundedMinutes = Math.round(now.getMinutes() / 5) * 5
  if (roundedMinutes === 60) {
    now.setHours(now.getHours() + 1)
    now.setMinutes(0)
  } else {
    now.setMinutes(roundedMinutes)
  }
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function formatDurationLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (!hours) return `${minutes}分钟`
  if (!minutes) return `${hours}小时`
  return `${hours}小时${minutes}分钟`
}

function calculateEndTime(startTime, duration) {
  if (!startTime) return ''
  const [hours, minutes] = startTime.split(':').map(Number)
  const total = hours * 60 + minutes + Number(duration || 0)
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
}

Page({
  data: {
    types: [
      { id: 'rally', label: '拉球', icon: '↔' },
      { id: 'lesson', label: '学球', icon: '✦' },
      { id: 'machine', label: '发球机', icon: '◉' },
      { id: 'match', label: '比赛', icon: '🏁' }
    ],
    editMode: false,
    editingId: '',
    profileTone: 'balanced',
    durationColumns: [
      ['0小时', '1小时', '2小时', '3小时', '4小时', '5小时', '6小时', '7小时', '8小时'],
      ['00分', '05分', '10分', '15分', '20分', '25分', '30分', '35分', '40分', '45分', '50分', '55分']
    ],
    durationPickerValue: [1, 0],
    durationLabel: '1小时',
    endTimeLabel: '',
    moods: [
      { id: 'great', label: '很开心', icon: '☀️' },
      { id: 'progress', label: '有进步', icon: '🌱' },
      { id: 'calm', label: '平静', icon: '🍃' },
      { id: 'tired', label: '有点累', icon: '🌙' },
      { id: 'frustrated', label: '沮丧', icon: '🌧️' }
    ],
    issueOptions: ['关键分', '输球', '紧张', '失误太多', '没进步', '教练批评', '手感差', '对手太强', '其他'].map(label => ({
      label,
      selected: false
    })),
    otherIssueSelected: false,
    form: {
      date: formatDate(new Date()),
      startTime: defaultStartTime(),
      type: 'rally',
      duration: 60,
      mood: 'calm',
      issues: [],
      diary: '',
      matchFormat: 'single',
      matchLevel: '',
      matchResult: '',
      matchCount: 0,
      placement: '',
      score: ''
    },
    saving: false,
    matchDetailsSummary: '未补充比赛结果',
    result: null,
    badgeCelebration: null
  },

  async onLoad(options = {}) {
    const profile = await repository.getProfile()
    const patch = {
      profileTone: (profile && profile.tone) || 'balanced',
      endTimeLabel: calculateEndTime(this.data.form.startTime, this.data.form.duration)
    }
    if (options.id) {
      const session = await repository.getSession(options.id)
      if (!session) {
        wx.showToast({ title: '没有找到这条记录', icon: 'none' })
        return
      }
      const duration = Number(session.duration || 60)
      const startTime = session.startTime || defaultStartTime()
      const knownIssues = Array.isArray(session.issues)
        ? session.issues
        : String(session.issue || '').split(/[、,，]/).filter(Boolean)
      patch.editMode = true
      patch.editingId = session.id
      patch.durationPickerValue = [Math.floor(duration / 60), Math.floor(duration % 60 / 5)]
      patch.durationLabel = formatDurationLabel(duration)
      patch.endTimeLabel = calculateEndTime(startTime, duration)
      patch.form = {
        date: session.date,
        startTime,
        type: session.type || 'rally',
        duration,
        mood: session.mood || 'calm',
        issues: knownIssues,
        diary: session.diary || '',
        matchFormat: session.matchFormat || 'single',
        matchLevel: session.matchLevel === '日常约球' ? '' : (session.matchLevel || ''),
        matchResult: session.matchResult || '',
        matchCount: Number(session.matchCount || 0),
        placement: session.placement || '',
        score: session.score || ''
      }
      patch.matchDetailsSummary = this.formatMatchDetails(patch.form)
      patch.issueOptions = this.data.issueOptions.map(item => ({
        ...item,
        selected: knownIssues.indexOf(item.label) >= 0
      }))
      patch.otherIssueSelected = knownIssues.indexOf('其他') >= 0
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(options.date || '')) {
      patch['form.date'] = options.date
    }
    this.setData(patch)
  },

  chooseType(event) {
    this.setData({ 'form.type': event.currentTarget.dataset.value })
  },

  chooseMood(event) {
    const mood = event.currentTarget.dataset.value
    const patch = { 'form.mood': mood }
    if (mood !== 'frustrated' && mood !== 'tired') {
      patch['form.issues'] = []
      patch.issueOptions = this.data.issueOptions.map(item => ({ ...item, selected: false }))
      patch.otherIssueSelected = false
    }
    this.setData(patch)
  },

  chooseIssue(event) {
    const value = event.currentTarget.dataset.value
    const issues = Array.isArray(this.data.form.issues) ? [...this.data.form.issues] : []
    const index = issues.indexOf(value)
    if (index >= 0) issues.splice(index, 1)
    else issues.push(value)
    this.setData({
      'form.issues': issues,
      issueOptions: this.data.issueOptions.map(item => ({
        ...item,
        selected: issues.indexOf(item.label) >= 0
      })),
      otherIssueSelected: issues.indexOf('其他') >= 0
    })
  },

  formatMatchDetails(form) {
    const details = []
    if (form.matchFormat === 'tournament') {
      if (form.matchCount) details.push(`${form.matchCount}场`)
      if (form.placement) details.push(form.placement)
    } else if (form.matchResult) {
      details.push(form.matchResult === 'win' ? '胜' : '负')
    }
    if (form.matchLevel) details.push(`${form.matchLevel}级`)
    if (form.score) details.push(form.score)
    if (!details.length) return '未补充比赛结果'
    return `${form.matchFormat === 'tournament' ? '多轮比赛' : '单轮比赛'} · ${details.join(' · ')}`
  },

  goMatchDetails() {
    const currentDetails = {
      matchFormat: this.data.form.matchFormat,
      matchLevel: this.data.form.matchLevel,
      matchResult: this.data.form.matchResult,
      matchCount: this.data.form.matchCount,
      placement: this.data.form.placement,
      score: this.data.form.score
    }
    wx.navigateTo({
      url: '/pages/match-details/index',
      success: result => {
        result.eventChannel.emit('initialData', currentDetails)
        result.eventChannel.on('detailsUpdated', details => {
          const form = { ...this.data.form, ...details }
          this.setData({
            form,
            matchDetailsSummary: this.formatMatchDetails(form)
          })
        })
      }
    })
  },

  onDateChange(event) {
    this.setData({ 'form.date': event.detail.value })
  },

  onTimeChange(event) {
    this.setData({
      'form.startTime': event.detail.value,
      endTimeLabel: calculateEndTime(event.detail.value, this.data.form.duration)
    })
  },

  onDurationChange(event) {
    const [hourIndex, minuteIndex] = event.detail.value.map(Number)
    const duration = hourIndex * 60 + minuteIndex * 5
    if (!duration) {
      wx.showToast({ title: '持续时间至少为5分钟', icon: 'none' })
      return
    }
    this.setData({
      durationPickerValue: [hourIndex, minuteIndex],
      durationLabel: formatDurationLabel(duration),
      endTimeLabel: calculateEndTime(this.data.form.startTime, duration),
      'form.duration': duration
    })
  },

  onDiaryInput(event) {
    this.setData({ 'form.diary': event.detail.value })
  },

  async submit() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
    const profile = await repository.getProfile()
    const sessionsBefore = await repository.listSessions()
    const issue = this.data.form.issues.join('、')
    const sessionPayload = {
      ...this.data.form,
      issue
    }
    const reply = generateReply({
      ...sessionPayload,
      tone: this.data.profileTone,
      recentReplyIds: sessionsBefore
        .filter(item => !this.data.editMode || item.id !== this.data.editingId)
        .slice(0, 12)
        .map(item => item.reply && item.reply.variantId)
        .filter(Boolean)
    })
    const sessionChanges = {
      ...sessionPayload,
      reply,
      replyHelpful: null
    }
    const session = this.data.editMode
      ? await repository.updateSession(this.data.editingId, sessionChanges)
      : await repository.addSession(sessionChanges)

    const sessionsAfter = this.data.editMode
      ? sessionsBefore.map(item => item.id === session.id ? session : item)
      : [...sessionsBefore, session]
    const persistedAchievementIds = (profile && profile.unlockedAchievementIds) || []
    const achievementsBefore = deriveAchievementBadges(sessionsBefore, persistedAchievementIds)
    const achievementsAfter = deriveAchievementBadges(sessionsAfter, persistedAchievementIds)
    const unlockedBefore = new Set(achievementsBefore.filter(item => item.unlocked).map(item => item.id))
    const newAchievements = achievementsAfter.filter(item => item.unlocked && !unlockedBefore.has(item.id))

    const monthlyBefore = deriveMonthlyBadges(sessionsBefore, this.data.form.date)
    const monthlyAfter = deriveMonthlyBadges(sessionsAfter, this.data.form.date)
    const monthlyUnlockedBefore = new Set(monthlyBefore.badges.filter(item => item.unlocked).map(item => item.id))
    const monthlyNotification = profile && profile.monthlyBadgeNotification
    const notifiedMonthlyIds = monthlyNotification && monthlyNotification.key === monthlyAfter.key
      ? monthlyNotification.ids || []
      : []
    const newMonthlyBadges = monthlyAfter.badges.filter(item => (
      item.unlocked
      && !monthlyUnlockedBefore.has(item.id)
      && notifiedMonthlyIds.indexOf(item.id) < 0
    ))

    const unlockedAchievementIds = achievementsAfter
      .filter(item => item.unlocked)
      .map(item => item.id)
    const achievementUnlockedAt = {
      ...((profile && profile.achievementUnlockedAt) || {})
    }
    const unlockedAtNow = new Date().toISOString()
    unlockedAchievementIds.forEach(id => {
      if (!achievementUnlockedAt[id]) achievementUnlockedAt[id] = unlockedAtNow
    })
    if (profile) {
      await repository.saveProfile({
        ...profile,
        unlockedAchievementIds,
        achievementUnlockedAt,
        monthlyBadgeNotification: {
          key: monthlyAfter.key,
          ids: [...new Set([...notifiedMonthlyIds, ...newMonthlyBadges.map(item => item.id)])]
        }
      })
    }

    const unlockedBadges = [
      ...newAchievements.map(item => ({ ...item, groupLabel: '长期成就' })),
      ...newMonthlyBadges.map(item => ({ ...item, groupLabel: '本月挑战' }))
    ]
    await repository.track(this.data.editMode ? 'session_updated' : 'session_created', {
      type: session.type,
      mood: session.mood,
      issue: session.issue,
      issues: session.issues,
      duration: session.duration
    })

    this.setData({
      saving: false,
      result: {
        sessionId: session.id,
        savedLabel: this.data.editMode ? '修改已保存' : '这一拍收好了',
        ...reply
      },
      badgeCelebration: unlockedBadges.length
        ? {
            featured: unlockedBadges[0],
            extra: unlockedBadges.slice(1)
          }
        : null
    })
    wx.vibrateShort({ type: 'light' })
    } catch (error) {
      this.setData({ saving: false })
      wx.showModal({
        title: '这一拍还没有保存',
        content: '填写的内容还在 请检查网络后再试一次',
        showCancel: false
      })
      console.warn('Session save failed', error)
    }
  },

  acceptBadge() {
    this.setData({ badgeCelebration: null })
  },

  async markHelpful(event) {
    const value = event.currentTarget.dataset.value
    await repository.track('reply_rated', {
      helpful: value === 'yes',
      categoryId: this.data.result.categoryId
    })
    wx.showToast({
      title: value === 'yes' ? '谢谢你告诉我' : '收到，我会继续学习',
      icon: 'none'
    })
  },

  backHome() {
    wx.switchTab({ url: '/pages/home/index' })
  },

  goHistory() {
    wx.switchTab({ url: '/pages/history/index' })
  }
})
