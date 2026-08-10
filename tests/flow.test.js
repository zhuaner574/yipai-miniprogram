const assert = require('node:assert/strict')
const path = require('node:path')

const memory = new Map()
const navigation = []
let capturedPage = null

global.wx = {
  getStorageSync(key) {
    return memory.get(key)
  },
  setStorageSync(key, value) {
    memory.set(key, value)
  },
  removeStorageSync(key) {
    memory.delete(key)
  },
  navigateTo(options) {
    navigation.push({ type: 'navigateTo', ...options })
  },
  navigateBack() {
    navigation.push({ type: 'navigateBack' })
  },
  switchTab(options) {
    navigation.push({ type: 'switchTab', ...options })
  },
  reLaunch(options) {
    navigation.push({ type: 'reLaunch', ...options })
  },
  showToast() {},
  showModal() {},
  vibrateShort() {}
}

global.Page = definition => {
  capturedPage = definition
}

const repository = require('../services/repository')
const { generateReply } = require('../utils/replies')

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function setPath(target, dottedPath, value) {
  const parts = dottedPath.split('.')
  let cursor = target
  parts.slice(0, -1).forEach(part => {
    if (!cursor[part]) cursor[part] = {}
    cursor = cursor[part]
  })
  cursor[parts[parts.length - 1]] = value
}

function loadPage(relativePath) {
  const absolutePath = path.join(__dirname, '..', relativePath)
  delete require.cache[require.resolve(absolutePath)]
  capturedPage = null
  require(absolutePath)
  assert.ok(capturedPage, `${relativePath} should register a page`)

  const instance = {
    ...capturedPage,
    data: clone(capturedPage.data),
    setData(patch) {
      Object.entries(patch).forEach(([key, value]) => setPath(this.data, key, value))
    }
  }
  Object.keys(capturedPage).forEach(key => {
    if (typeof capturedPage[key] === 'function') {
      instance[key] = capturedPage[key].bind(instance)
    }
  })
  return instance
}

function event(dataset = {}, detail = {}) {
  return {
    currentTarget: { dataset },
    detail
  }
}

async function verifyPortraitFlow() {
  await repository.clearAll()
  await repository.saveProfile({
    nickname: '小拍',
    level: '1.5',
    experience: '3个月内',
    goals: ['稳定对打'],
    tone: 'balanced',
    handedness: '右手',
    primaryMotivation: '其他：晒太阳',
    challenges: ['发球', '其他：容易着急'],
    registeredAt: '2026-07-01T00:00:00.000Z'
  })

  const onboarding = loadPage('pages/onboarding/index.js')
  await onboarding.onLoad({ edit: '1', section: 'portrait' })
  assert.equal(onboarding.data.portraitOnly, true)
  assert.equal(onboarding.data.step, 4)
  assert.equal(onboarding.data.form.nickname, '小拍')
  assert.equal(onboarding.data.portraitAnswered, 3)

  const motivation = onboarding.data.portraitQuestions.find(
    question => question.id === 'primaryMotivation'
  )
  assert.equal(motivation.otherSelected, true)
  assert.equal(motivation.otherValue, '晒太阳')

  const frequencyIndex = onboarding.data.portraitQuestions.findIndex(
    question => question.id === 'weeklyFrequency'
  )
  const weeklyIndex = onboarding.data.portraitQuestions[frequencyIndex].options.findIndex(
    option => option.label === '每周2—3次'
  )
  onboarding.choosePortraitOption(event({
    questionIndex: frequencyIndex,
    optionIndex: weeklyIndex
  }))
  await onboarding.complete()

  const saved = await repository.getProfile()
  assert.equal(saved.nickname, '小拍')
  assert.deepEqual(saved.goals, ['稳定对打'])
  assert.equal(saved.weeklyFrequency, '每周2—3次')
  assert.deepEqual(saved.primaryMotivation, ['其他：晒太阳'])
  assert.deepEqual(saved.challenges, ['发球', '其他：容易着急'])
  assert.equal(navigation.at(-1).type, 'navigateBack')

  const profile = loadPage('pages/profile/index.js')
  await profile.onShow()
  assert.equal(profile.data.portraitProgress.answered, 4)
  assert.equal(profile.data.achievementBadges.length, 6)
  assert.equal(profile.data.monthlyBadges.length, 4)
  profile.editPortrait()
  assert.equal(
    navigation.at(-1).url,
    '/pages/onboarding/index?edit=1&section=portrait'
  )
  profile.editGoals()
  assert.equal(
    navigation.at(-1).url,
    '/pages/onboarding/index?edit=1&section=goals'
  )

  const goalsEditor = loadPage('pages/onboarding/index.js')
  await goalsEditor.onLoad({ edit: '1', section: 'goals' })
  assert.equal(goalsEditor.data.goalsOnly, true)
  assert.equal(goalsEditor.data.step, 3)
  assert.deepEqual(goalsEditor.data.form.goals, ['其他'])
  assert.equal(goalsEditor.data.form.goalOther, '稳定对打')
  profile.goBadges(event({ section: 'achievement' }))
  assert.equal(navigation.at(-1).url, '/pages/badges/index?section=achievement')
}

async function verifyEmptyPortraitEntry() {
  await repository.clearAll()
  await repository.saveProfile({
    nickname: '新球友',
    level: '1.0',
    experience: '3个月内',
    goals: ['享受运动'],
    tone: 'gentle',
    registeredAt: '2026-07-30T00:00:00.000Z'
  })

  const profile = loadPage('pages/profile/index.js')
  await profile.onShow()
  assert.equal(profile.data.portraitProgress.answered, 0)
  assert.deepEqual(profile.data.profileDetails, [])
  profile.editPortrait()
  assert.equal(
    navigation.at(-1).url,
    '/pages/onboarding/index?edit=1&section=portrait'
  )
}

async function verifyRecordToHistoryFlow() {
  const record = loadPage('pages/record/index.js')
  await record.onLoad({ date: '2026-07-30' })
  assert.equal(record.data.form.date, '2026-07-30')
  record.chooseMood(event({ value: 'frustrated' }))
  record.chooseIssue(event({ value: '紧张' }))
  record.chooseIssue(event({ value: '其他' }))
  assert.deepEqual(record.data.form.issues, ['紧张', '其他'])
  record.chooseIssue(event({ value: '紧张' }))
  assert.deepEqual(record.data.form.issues, ['其他'])
  record.chooseMood(event({ value: 'great' }))
  assert.deepEqual(record.data.form.issues, [])

  const trainingReply = generateReply({
    date: '2026-07-30',
    type: 'lesson',
    mood: 'progress',
    issue: '',
    diary: '今天正手更稳了',
    tone: 'balanced'
  })
  const matchReply = generateReply({
    date: '2026-07-31',
    type: 'match',
    mood: 'frustrated',
    issue: '关键分',
    diary: '最后有点紧张',
    tone: 'gentle'
  })

  await repository.addSession({
    id: 'training',
    date: '2026-07-30',
    startTime: '18:30',
    type: 'lesson',
    duration: 60,
    mood: 'progress',
    issue: '',
    diary: '今天正手更稳了',
    reply: trainingReply
  })
  await repository.addSession({
    id: 'match',
    date: '2026-07-31',
    startTime: '20:00',
    type: 'match',
    duration: 90,
    mood: 'frustrated',
    issue: '关键分',
    diary: '最后有点紧张',
    matchLevel: '日常约球',
    matchResult: 'loss',
    score: '4:6',
    reply: matchReply
  })

  const sessions = await repository.listSessions()
  assert.equal(sessions.length, 2)
  assert.equal(sessions[0].id, 'match')
  assert.equal(sessions[0].reply.categoryId, 'pressure_point')
  assert.equal(sessions[1].reply.categoryId, 'positive')

  const history = loadPage('pages/history/index.js')
  await history.onShow()
  assert.equal(history.data.sessions.length, 2)
  assert.equal(history.data.sessions[0].typeLabel, '比赛')
  assert.equal(history.data.sessions[0].durationLabel, '1小时30分钟')
  assert.equal(history.data.sessions[0].moodImage, '/assets/moods/paipai-frustrated.png')
  history.editSession(event({ id: 'match' }))
  assert.equal(navigation.at(-1).url, '/pages/record/index?id=match')

  const editRecord = loadPage('pages/record/index.js')
  await editRecord.onLoad({ id: 'match' })
  assert.equal(editRecord.data.editMode, true)
  assert.equal(editRecord.data.form.date, '2026-07-31')
  assert.equal(editRecord.data.form.matchResult, 'loss')
  assert.equal(editRecord.data.form.diary, '最后有点紧张')
  assert.equal(
    editRecord.data.issueOptions.find(item => item.label === '关键分').selected,
    true
  )

  const calendar = loadPage('pages/calendar/index.js')
  calendar.data.cursor = '2026-07'
  await calendar.onShow()
  assert.equal(calendar.data.stats.count, 2)
  assert.equal(calendar.data.stats.hours, '2.5')
  calendar.selectDate(event({ date: '2026-07-31' }))
  assert.equal(calendar.data.selectedSessions.length, 1)
  assert.equal(calendar.data.selectedSessions[0].typeLabel, '比赛')
  assert.equal(calendar.data.selectedSessions[0].moodImage, '/assets/moods/paipai-frustrated.png')
  calendar.selectDate(event({ date: '2026-07-29' }))
  calendar.goRecordForDate()
  assert.equal(navigation.at(-1).url, '/pages/record/index?date=2026-07-29')

  await repository.saveFeedback({
    useful: '有一点用',
    missing: '回应更贴心',
    comment: '希望更像球友'
  })
  await repository.track('feedback_submitted', {
    useful: '有一点用',
    missing: '回应更贴心'
  })
  assert.equal(memory.get('yipai_feedback').length, 1)
  assert.equal(memory.get('yipai_events')[0].name, 'feedback_submitted')
}

async function verifyClearFlow() {
  await repository.clearAll()
  assert.equal(await repository.getProfile(), null)
  assert.deepEqual(await repository.listSessions(), [])
  assert.equal(memory.has('yipai_feedback'), false)
  assert.equal(memory.has('yipai_events'), false)
}

async function verifyBadgeCelebrationFlow() {
  await repository.clearAll()
  await repository.saveProfile({
    nickname: '小拍',
    level: '1.5',
    experience: '3个月内',
    goals: ['稳定对拉'],
    tone: 'balanced',
    registeredAt: '2026-08-01T00:00:00.000Z'
  })

  const record = loadPage('pages/record/index.js')
  await record.onLoad()
  record.setData({
    'form.date': '2026-08-01',
    'form.diary': '今天第一次认真记下打球'
  })
  await record.submit()
  assert.equal(record.data.badgeCelebration.featured.id, 'first_session')
  assert.equal(record.data.badgeCelebration.extra.some(item => item.id === 'first_diary'), true)
  const profile = await repository.getProfile()
  assert.equal(profile.unlockedAchievementIds.includes('first_session'), true)
  record.acceptBadge()
  assert.equal(record.data.badgeCelebration, null)
}

async function run() {
  await verifyPortraitFlow()
  await verifyEmptyPortraitEntry()
  await verifyRecordToHistoryFlow()
  await verifyBadgeCelebrationFlow()
  await verifyClearFlow()
  console.log('All end-to-end MVP flow checks passed.')
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
