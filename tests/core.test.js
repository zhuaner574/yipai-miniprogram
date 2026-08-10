const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const memory = new Map()

global.wx = {
  getStorageSync(key) {
    return memory.get(key)
  },
  setStorageSync(key, value) {
    memory.set(key, value)
  },
  removeStorageSync(key) {
    memory.delete(key)
  }
}

const date = require('../utils/date')
const { generateReply, formatReplyCopy } = require('../utils/replies')
const { deriveAchievementBadges, deriveMonthlyBadges, sortBadges } = require('../utils/badges')
const env = require('../config/env')
const repository = require('../services/repository')
const { deriveMatchStats, parseTournamentResult } = require('../utils/match-stats')

async function run() {
  assert.deepEqual(parseTournamentResult('3胜1负'), { wins: 3, losses: 1 })
  assert.deepEqual(deriveMatchStats([
    { type: 'match', matchLevel: '3.0', matchResult: 'win' },
    { type: 'match', matchLevel: '3.0', matchResult: 'loss' },
    { type: 'match', matchFormat: 'tournament', matchLevel: '3.0', score: '3胜1负' },
    { type: 'match', matchLevel: '2.5', matchResult: 'win' },
    { type: 'match', matchLevel: '3.5', matchResult: '' }
  ]), [
    { level: '2.5', wins: 1, losses: 0, total: 1, winRate: '100%' },
    { level: '3.0', wins: 4, losses: 2, total: 6, winRate: '67%' }
  ])

  const grid = date.getMonthCalendar(new Date(2026, 6, 1))
  assert.equal(grid.length, 42)
  assert.equal(grid.filter(cell => cell.currentMonth).length, 31)
  assert.equal(grid[0].monthRelation, 'previous')
  assert.equal(grid.find(cell => cell.date === '2026-07-01').monthRelation, 'current')
  assert.equal(grid[41].monthRelation, 'next')

  const stringGrid = date.getMonthCalendar('2026-07')
  assert.equal(stringGrid.find(cell => cell.date === '2026-07-01').day, 1)
  assert.equal(date.monthLabel('2026-07'), '2026年7月')
  assert.equal(date.shiftMonthKey('2026-01', -1), '2025-12')
  assert.equal(date.shiftMonthKey('2026-12', 1), '2027-01')

  const pressureReply = generateReply({
    date: '2026-07-26',
    type: 'match',
    mood: 'frustrated',
    issue: '关键分',
    diary: ''
  })
  assert.equal(pressureReply.categoryId, 'pressure_point')
  assert.ok(pressureReply.message.length <= 55)
  assert.doesNotMatch(`${pressureReply.title}${pressureReply.message}${pressureReply.nextStep}`, /[,.!?;:]| /)
  assert.equal(formatReplyCopy('看见进步很开心。 这一拍值得记住'), '看见进步很开心。这一拍值得记住')

  const gentleReply = generateReply({
    date: '2026-07-26',
    type: 'match',
    mood: 'frustrated',
    issue: '关键分',
    diary: '',
    tone: 'gentle'
  })
  assert.equal(gentleReply.nextStep, '')

  const directReply = generateReply({
    date: '2026-07-26',
    type: 'match',
    mood: 'frustrated',
    issue: '关键分',
    diary: '',
    tone: 'direct'
  })
  assert.equal(directReply.categoryId, 'pressure_point')
  assert.ok(directReply.message.length < gentleReply.message.length)
  assert.match(directReply.message, /选球|动作|套路/)
  assert.equal(directReply.nextStep, '')

  const safetyReply = generateReply({
    date: '2026-07-26',
    type: 'lesson',
    mood: 'tired',
    issue: '',
    diary: '手腕突然疼痛而且活动受限',
    tone: 'gentle'
  })
  assert.equal(safetyReply.categoryId, 'physical_pain')
  assert.match(safetyReply.nextStep, /立即停止/)
  assert.equal(safetyReply.nextLabel, '先照顾身体')

  const fallbackReply = generateReply({
    date: '2026-07-26',
    type: 'lesson',
    mood: 'frustrated',
    issue: '',
    diary: ''
  })
  assert.equal(fallbackReply.categoryId, 'rough_day')

  const selectedIssueReply = generateReply({
    date: '2026-07-26',
    type: 'match',
    mood: 'frustrated',
    issues: ['紧张', '手感差'],
    issue: '紧张、手感差',
    diary: '关键分没有打好'
  })
  assert.equal(selectedIssueReply.categoryId, 'nervous')

  const positiveReply = generateReply({
    date: '2026-07-26',
    type: 'rally',
    mood: 'great',
    issue: '',
    diary: '今天正手很顺'
  })
  assert.equal(positiveReply.categoryId, 'positive')

  const progressReply = generateReply({
    date: '2026-07-26',
    type: 'rally',
    mood: 'progress',
    issue: '',
    diary: '看到别人进步很快'
  })
  assert.equal(progressReply.categoryId, 'positive')
  assert.doesNotMatch(`${progressReply.title}${progressReply.message}${progressReply.nextStep}`, /失落|难受|状态差|打得不顺|没进步/)

  const gentleProgressReply = generateReply({
    date: '2026-07-27',
    type: 'lesson',
    mood: 'progress',
    issue: '',
    diary: '今天学会了新的动作',
    tone: 'gentle'
  })
  assert.equal(gentleProgressReply.nextStep, '')

  const happyWithErrors = generateReply({
    date: '2026-07-26',
    type: 'match',
    mood: 'great',
    issue: '',
    diary: '今天也有一些失误'
  })
  assert.equal(happyWithErrors.categoryId, 'positive')

  const calmWithComparison = generateReply({
    date: '2026-07-26',
    type: 'rally',
    mood: 'calm',
    issue: '',
    diary: '别人进步快'
  })
  assert.equal(calmWithComparison.categoryId, 'calm')

  const calmReply = generateReply({
    date: '2026-07-26',
    type: 'rally',
    mood: 'calm',
    issue: '',
    diary: ''
  })
  assert.equal(calmReply.categoryId, 'calm')
  assert.doesNotMatch(calmReply.message, /打得顺|手感好|发挥好/)
  assert.doesNotMatch(calmReply.message, /坚持|积累|向前|往前|进步正在发生|成长/)

  const calmVariants = []
  for (let index = 0; index < 6; index += 1) {
    const reply = generateReply({
      date: '2026-07-26',
      type: 'rally',
      mood: 'calm',
      issue: '',
      diary: '',
      recentReplyIds: calmVariants
    })
    assert.ok(!calmVariants.includes(reply.variantId))
    calmVariants.push(reply.variantId)
  }
  assert.equal(new Set(calmVariants).size, 6)

  const sessions = [
    {
      id: '1',
      date: '2026-07-02',
      type: 'rally',
      duration: 120,
      diary: '第一次认真记录今天的拉球。'
    },
    {
      id: '2',
      date: '2026-07-08',
      type: 'lesson',
      duration: 90,
      diary: '今天重新学习了发球动作。'
    },
    {
      id: '3',
      date: '2026-07-16',
      type: 'match',
      duration: 120,
      diary: '第一次上场比赛，紧张但很开心。'
    }
  ]
  const achievements = deriveAchievementBadges(sessions)
  assert.equal(achievements.find(item => item.id === 'first_session').unlocked, true)
  assert.equal(achievements.find(item => item.id === 'first_match').unlocked, true)
  assert.equal(achievements.find(item => item.id === 'first_diary').unlocked, true)
  assert.equal(achievements.find(item => item.id === 'hours_10').unlocked, false)

  const julyChallenges = deriveMonthlyBadges(sessions, '2026-07')
  assert.equal(julyChallenges.label, '2026年7月')
  assert.equal(julyChallenges.badges.find(item => item.id === 'monthly_2').unlocked, true)
  assert.equal(julyChallenges.badges.find(item => item.id === 'monthly_4').unlocked, false)
  assert.equal(julyChallenges.badges.find(item => item.id === 'monthly_5h').unlocked, true)
  assert.equal(julyChallenges.badges.find(item => item.id === 'monthly_diary_3').unlocked, true)
  assert.equal(julyChallenges.badges.find(item => item.id === 'monthly_variety').unlocked, true)

  const augustChallenges = deriveMonthlyBadges(sessions, '2026-08')
  assert.equal(augustChallenges.badges.every(item => !item.unlocked), true)

  const persistedAchievements = deriveAchievementBadges([], ['first_session'])
  assert.equal(persistedAchievements.find(item => item.id === 'first_session').unlocked, true)

  const sortedBadges = sortBadges([
    { id: 'locked_low', unlocked: false, order: 0, progress: { percent: 20, current: 2, target: 10 } },
    { id: 'unlocked_old', unlocked: true, order: 1, progress: { percent: 100, current: 1, target: 1 } },
    { id: 'locked_near', unlocked: false, order: 2, progress: { percent: 80, current: 8, target: 10 } },
    { id: 'unlocked_new', unlocked: true, order: 3, progress: { percent: 100, current: 1, target: 1 } }
  ], {
    unlocked_old: '2026-07-01T00:00:00.000Z',
    unlocked_new: '2026-07-30T00:00:00.000Z'
  })
  assert.deepEqual(sortedBadges.map(item => item.id), [
    'unlocked_new',
    'unlocked_old',
    'locked_near',
    'locked_low'
  ])

  await repository.saveProfile({
    nickname: '小拍',
    level: '1.5',
    experience: '3个月内',
    goals: ['稳定对打'],
    tone: 'balanced',
    registeredAt: '2026-07-01T00:00:00.000Z'
  })
  assert.equal((await repository.getProfile()).nickname, '小拍')

  await repository.addSession(sessions[0])
  assert.equal((await repository.listSessions()).length, 1)
  await repository.updateSession('1', { ...sessions[0], diary: '修改后的日记' })
  assert.equal((await repository.getSession('1')).diary, '修改后的日记')
  assert.equal(await repository.deleteSession('1'), true)
  assert.equal((await repository.listSessions()).length, 0)

  let calledCloudFunction = ''
  env.cloudEnvId = 'test-cloud-env'
  wx.cloud = {
    callFunction: async ({ name }) => {
      calledCloudFunction = name
      return {
        result: {
          success: true,
          deleted: { sessions: 2, feedback: 1, events: 3, profiles: 1 }
        }
      }
    }
  }
  const deleted = await repository.clearAll()
  assert.equal(calledCloudFunction, 'deleteAccountData')
  assert.equal(deleted.sessions, 2)
  env.cloudEnvId = ''
  delete wx.cloud

  const appConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8')
  )
  appConfig.pages.forEach(pagePath => {
    const base = path.join(__dirname, '..', pagePath)
    assert.equal(fs.existsSync(`${base}.js`), true, `${pagePath}.js should exist`)
    assert.equal(fs.existsSync(`${base}.wxml`), true, `${pagePath}.wxml should exist`)
    assert.equal(fs.existsSync(`${base}.wxss`), true, `${pagePath}.wxss should exist`)
    assert.equal(fs.existsSync(`${base}.json`), true, `${pagePath}.json should exist`)
  })

  console.log('All core MVP checks passed.')
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
