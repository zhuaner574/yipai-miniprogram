const repository = require('../../services/repository')
const { deriveAchievementBadges, deriveMonthlyBadges, sortBadges } = require('../../utils/badges')

Page({
  data: {
    scrollTarget: 'achievement-section',
    achievementBadges: [],
    monthlyBadges: [],
    achievementUnlockedCount: 0,
    monthlyUnlockedCount: 0,
    monthlyBadgeLabel: ''
  },

  async onLoad(options = {}) {
    this.setData({
      scrollTarget: options.section === 'monthly' ? 'monthly-section' : 'achievement-section'
    })
  },

  async onShow() {
    const profile = await repository.getProfile()
    const sessions = await repository.listSessions()
    if (!profile) return

    const achievements = deriveAchievementBadges(
      sessions,
      profile.unlockedAchievementIds || []
    )
    const unlockedAchievementIds = achievements
      .filter(badge => badge.unlocked)
      .map(badge => badge.id)
    const achievementUnlockedAt = { ...(profile.achievementUnlockedAt || {}) }
    const unlockedAtNow = new Date().toISOString()
    unlockedAchievementIds.forEach(id => {
      if (!achievementUnlockedAt[id]) achievementUnlockedAt[id] = unlockedAtNow
    })

    if (
      unlockedAchievementIds.join('|') !== (profile.unlockedAchievementIds || []).join('|')
      || JSON.stringify(achievementUnlockedAt) !== JSON.stringify(profile.achievementUnlockedAt || {})
    ) {
      await repository.saveProfile({
        ...profile,
        unlockedAchievementIds,
        achievementUnlockedAt
      })
    }

    const monthly = deriveMonthlyBadges(sessions)
    this.setData({
      achievementBadges: sortBadges(achievements, achievementUnlockedAt),
      monthlyBadges: sortBadges(monthly.badges),
      achievementUnlockedCount: unlockedAchievementIds.length,
      monthlyUnlockedCount: monthly.badges.filter(badge => badge.unlocked).length,
      monthlyBadgeLabel: monthly.label
    })
  }
})
