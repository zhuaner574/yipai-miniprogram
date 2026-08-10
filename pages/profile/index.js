const repository = require('../../services/repository')
const { deriveAchievementBadges, deriveMonthlyBadges, sortBadges } = require('../../utils/badges')
const { displayDate, formatDuration } = require('../../utils/date')
const { deriveMatchStats } = require('../../utils/match-stats')

function hasProfileAnswer(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value)
}

function displayProfileAnswer(value) {
  return Array.isArray(value) ? value.join(' · ') : value
}

Page({
  data: {
    profile: {},
    stats: {
      count: 0,
      duration: '0分钟',
      matches: 0,
      since: ''
    },
    achievementBadges: [],
    monthlyBadges: [],
    achievementUnlockedCount: 0,
    monthlyUnlockedCount: 0,
    monthlyBadgeLabel: '',
    achievementTotal: 0,
    monthlyTotal: 0,
    unlockedCount: 0,
    cloudEnabled: false,
    profileDetails: [],
    matchStats: [],
    portraitProgress: {
      answered: 0,
      total: 7
    }
  },

  async onShow() {
    const profile = await repository.getProfile()
    const sessions = await repository.listSessions()
    if (!profile) {
      wx.reLaunch({ url: '/pages/onboarding/index' })
      return
    }

    const minutes = sessions.reduce((sum, session) => sum + Number(session.duration || 0), 0)
    const achievementBadges = deriveAchievementBadges(
      sessions,
      profile.unlockedAchievementIds || []
    )
    const unlockedAchievementIds = achievementBadges
      .filter(badge => badge.unlocked)
      .map(badge => badge.id)
    const storedAchievementIds = profile.unlockedAchievementIds || []
    const achievementUnlockedAt = { ...(profile.achievementUnlockedAt || {}) }
    const unlockedAtNow = new Date().toISOString()
    unlockedAchievementIds.forEach(id => {
      if (!achievementUnlockedAt[id]) achievementUnlockedAt[id] = unlockedAtNow
    })
    const achievementsChanged = unlockedAchievementIds.join('|') !== storedAchievementIds.join('|')
      || JSON.stringify(achievementUnlockedAt) !== JSON.stringify(profile.achievementUnlockedAt || {})
    if (achievementsChanged) {
      await repository.saveProfile({
        ...profile,
        unlockedAchievementIds,
        achievementUnlockedAt
      })
    }
    const monthly = deriveMonthlyBadges(sessions)
    const sortedAchievements = sortBadges(achievementBadges, achievementUnlockedAt)
    const sortedMonthlyBadges = sortBadges(monthly.badges)
    const achievementUnlockedCount = unlockedAchievementIds.length
    const monthlyUnlockedCount = monthly.badges.filter(badge => badge.unlocked).length
    const registeredAt = profile.registeredAt || new Date().toISOString()
    const portraitValues = [
      profile.handedness,
      profile.primaryMotivation,
      profile.practiceMode || profile.learningMode,
      profile.weeklyFrequency,
      profile.playPartner,
      profile.matchExperience,
      profile.challenges && profile.challenges.length ? profile.challenges : ''
    ]
    this.setData({
      profile: {
        ...profile,
        goals: profile.goals || [],
        challenges: profile.challenges || []
      },
      stats: {
        count: sessions.length,
        duration: formatDuration(minutes),
        matches: sessions.filter(session => session.type === 'match').length,
        since: displayDate(registeredAt.slice(0, 10))
      },
      achievementBadges: sortedAchievements.slice(0, 6),
      monthlyBadges: sortedMonthlyBadges.slice(0, 4),
      achievementTotal: sortedAchievements.length,
      monthlyTotal: sortedMonthlyBadges.length,
      achievementUnlockedCount,
      monthlyUnlockedCount,
      monthlyBadgeLabel: monthly.label,
      unlockedCount: achievementUnlockedCount,
      cloudEnabled: repository.cloudEnabled(),
      profileDetails: [
        { label: '持拍手', value: profile.handedness },
        { label: '打球原因', value: displayProfileAnswer(profile.primaryMotivation) },
        { label: '练习方式', value: displayProfileAnswer(profile.practiceMode || profile.learningMode) },
        { label: '练球频率', value: profile.weeklyFrequency },
        { label: '常约球对象', value: displayProfileAnswer(profile.playPartner) },
        { label: '比赛经历', value: profile.matchExperience }
      ].filter(item => item.value),
      matchStats: deriveMatchStats(sessions),
      portraitProgress: {
        answered: portraitValues.filter(hasProfileAnswer).length,
        total: portraitValues.length
      }
    })
  },

  editProfile() {
    wx.navigateTo({ url: '/pages/onboarding/index?edit=1' })
  },

  editGoals() {
    wx.navigateTo({ url: '/pages/onboarding/index?edit=1&section=goals' })
  },

  editPortrait() {
    wx.navigateTo({ url: '/pages/onboarding/index?edit=1&section=portrait' })
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/index' })
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/index' })
  },

  goBadges(event) {
    const section = event.currentTarget.dataset.section || 'achievement'
    wx.navigateTo({ url: `/pages/badges/index?section=${section}` })
  },

  clearData() {
    wx.showModal({
      title: '删除我的全部数据',
      content: '个人资料 打球记录 日记和反馈都会被删除',
      confirmText: '继续',
      confirmColor: '#C64D42',
      success: result => {
        if (!result.confirm) return
        wx.showModal({
          title: '再次确认',
          content: '删除后无法恢复',
          confirmText: '确认删除',
          confirmColor: '#C64D42',
          success: async confirmation => {
            if (!confirmation.confirm) return
            wx.showLoading({ title: '正在删除', mask: true })
            try {
              await repository.clearAll()
              wx.hideLoading()
              wx.reLaunch({ url: '/pages/onboarding/index' })
            } catch (error) {
              wx.hideLoading()
              wx.showModal({
                title: '暂时没有删除成功',
                content: error.message || '请检查网络后再试一次',
                showCancel: false
              })
            }
          }
        })
      }
    })
  }
})
