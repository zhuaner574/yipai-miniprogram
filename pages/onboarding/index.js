const repository = require('../../services/repository')

const PORTRAIT_DEFINITIONS = [
  {
    id: 'handedness',
    title: '你的持拍手',
    type: 'single',
    options: ['右手', '左手']
  },
  {
    id: 'primaryMotivation',
    title: '你打网球最主要是为了什么？',
    hint: '可多选',
    type: 'multi',
    limit: 6,
    options: ['兴趣爱好', '锻炼身体', '释放压力', '认识球友', '提升技术或比赛', '其他']
  },
  {
    id: 'practiceMode',
    title: '你平时主要怎么打球？',
    hint: '可多选',
    type: 'multi',
    limit: 6,
    options: ['私教或团课', '和球友拉球', '发球机或独练', '参加比赛', '约陪练', '其他']
  },
  {
    id: 'weeklyFrequency',
    title: '你现在通常多久打一次球？',
    type: 'single',
    options: ['暂时不固定', '每月1—3次', '每周1次', '每周2—3次', '每周4次以上', '最近暂停', '其他']
  },
  {
    id: 'playPartner',
    title: '你通常和谁一起打球？',
    hint: '可多选',
    type: 'multi',
    limit: 6,
    options: ['教练', '固定球友', '朋友或家人', '临时球友或俱乐部', '大多独自练', '其他']
  },
  {
    id: 'matchExperience',
    title: '你现在有多少比赛经验？',
    type: 'single',
    options: ['还没完整比赛', '只和朋友计过分', '打过练习赛', '偶尔参加业余比赛', '经常参加比赛', '其他']
  },
  {
    id: 'challenges',
    title: '目前最困扰你的是什么？',
    hint: '可多选，最多3个',
    type: 'multi',
    limit: 3,
    options: ['技术不稳定', '发球', '脚步或体能', '不知道练什么', '比赛紧张', '看不到进步', '约球困难', '其他']
  }
]

function profileValue(profile, question) {
  if (question.id === 'practiceMode') {
    return profile.practiceMode || profile.learningMode || ''
  }
  return profile[question.id] || (question.type === 'multi' ? [] : '')
}

function stripOtherPrefix(value) {
  return String(value || '').replace(/^其他[：:]\s*/, '')
}

function createPortraitQuestions(profile = {}) {
  return PORTRAIT_DEFINITIONS.map(definition => {
    const stored = profileValue(profile, definition)
    const storedValues = Array.isArray(stored) ? stored : stored ? [stored] : []
    const exactValues = storedValues.filter(value => definition.options.indexOf(value) >= 0)
    const customValues = storedValues.filter(value => definition.options.indexOf(value) < 0)
    const hasExplicitOther = exactValues.indexOf('其他') >= 0
    const otherSelected = hasExplicitOther || customValues.length > 0

    return {
      ...definition,
      otherValue: customValues.map(stripOtherPrefix).join('、'),
      otherSelected,
      options: definition.options.map(label => ({
        label,
        selected: label === '其他' ? otherSelected : exactValues.indexOf(label) >= 0
      }))
    }
  })
}

function questionAnswered(question) {
  return question.options.some(option => option.selected)
}

function portraitAnsweredCount(questions) {
  return questions.filter(questionAnswered).length
}

function portraitProfile(questions) {
  return questions.reduce((result, question) => {
    const selected = question.options
      .filter(option => option.selected)
      .map(option => {
        if (option.label !== '其他') return option.label
        const custom = question.otherValue.trim()
        return custom ? `其他：${custom}` : '其他'
      })
    result[question.id] = question.type === 'multi' ? selected : (selected[0] || '')
    return result
  }, {})
}

Page({
  data: {
    editMode: false,
    portraitOnly: false,
    goalsOnly: false,
    step: 0,
    levels: ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5+'],
    experiences: ['3个月内', '3-6个月', '6-12个月', '1-2年', '2-3年', '3年以上'],
    goalOptions: [
      { name: '练好正手', selected: false },
      { name: '练好反手', selected: false },
      { name: '学会发球', selected: false },
      { name: '稳定对拉', selected: false },
      { name: '改善脚步', selected: false },
      { name: '提升体能', selected: false },
      { name: '提高胜率', selected: false },
      { name: '参加比赛', selected: false },
      { name: '突破等级', selected: false },
      { name: '其他', selected: false }
    ],
    tones: [
      { id: 'gentle', title: '温柔陪伴', desc: '先接住情绪，再慢慢往前' },
      { id: 'balanced', title: '刚刚好', desc: '鼓励和行动建议各一点' },
      { id: 'direct', title: '直接一点', desc: '少安慰，多给一个下一步' }
    ],
    portraitQuestions: createPortraitQuestions(),
    portraitAnswered: 0,
    portraitTotal: PORTRAIT_DEFINITIONS.length,
    form: {
      nickname: '',
      level: '',
      experience: '',
      goals: [],
      goalOther: '',
      tone: 'balanced'
    }
  },

  async onLoad(options) {
    const profile = await repository.getProfile()
    const editMode = options.edit === '1'
    const portraitOnly = editMode && options.section === 'portrait'
    const goalsOnly = editMode && options.section === 'goals'

    if (profile && !editMode) {
      wx.switchTab({ url: '/pages/home/index' })
      return
    }

    const portraitQuestions = createPortraitQuestions(profile || {})
    if (profile) {
      const goalNames = this.data.goalOptions.map(item => item.name)
      const storedGoals = profile.goals || []
      const customGoals = storedGoals.filter(goal => goalNames.indexOf(goal) < 0)
      const selectedGoals = storedGoals.filter(goal => goalNames.indexOf(goal) >= 0)
      if (customGoals.length) selectedGoals.push('其他')
      this.setData({
        editMode,
        portraitOnly,
        goalsOnly,
        step: portraitOnly ? 4 : (goalsOnly ? 3 : 1),
        goalOptions: this.data.goalOptions.map(item => ({
          ...item,
          selected: selectedGoals.indexOf(item.name) >= 0
        })),
        portraitQuestions,
        portraitAnswered: portraitAnsweredCount(portraitQuestions),
        form: {
          nickname: profile.nickname || '',
          level: profile.level || '',
          experience: profile.experience || '',
          goals: selectedGoals,
          goalOther: customGoals.map(stripOtherPrefix).join('、'),
          tone: profile.tone || 'balanced'
        }
      })
    } else {
      this.setData({
        editMode,
        portraitOnly,
        goalsOnly,
        portraitQuestions,
        portraitAnswered: 0
      })
    }
  },

  onNameInput(event) {
    this.setData({ 'form.nickname': event.detail.value })
  },

  chooseLevel(event) {
    this.setData({ 'form.level': event.currentTarget.dataset.value })
  },

  chooseExperience(event) {
    this.setData({ 'form.experience': event.currentTarget.dataset.value })
  },

  toggleGoal(event) {
    const value = event.currentTarget.dataset.value
    const goals = [...this.data.form.goals]
    const index = goals.indexOf(value)
    if (index >= 0) goals.splice(index, 1)
    else goals.push(value)
    this.setData({
      'form.goals': goals,
      goalOptions: this.data.goalOptions.map(item => ({
        ...item,
        selected: goals.indexOf(item.name) >= 0
      }))
    })
  },

  onGoalOtherInput(event) {
    this.setData({ 'form.goalOther': event.detail.value })
  },

  chooseTone(event) {
    this.setData({ 'form.tone': event.currentTarget.dataset.value })
  },

  choosePortraitOption(event) {
    const questionIndex = Number(event.currentTarget.dataset.questionIndex)
    const optionIndex = Number(event.currentTarget.dataset.optionIndex)
    const questions = this.data.portraitQuestions.map((question, index) => ({
      ...question,
      options: question.options.map(option => ({ ...option }))
    }))
    const question = questions[questionIndex]
    const option = question.options[optionIndex]

    if (question.type === 'single') {
      const nextSelected = !option.selected
      question.options.forEach(item => {
        item.selected = false
      })
      option.selected = nextSelected
    } else {
      const selectedCount = question.options.filter(item => item.selected).length
      if (!option.selected && selectedCount >= question.limit) {
        wx.showToast({ title: `最多选择${question.limit}个`, icon: 'none' })
        return
      }
      option.selected = !option.selected
    }

    question.otherSelected = question.options.some(
      item => item.label === '其他' && item.selected
    )
    this.setData({
      portraitQuestions: questions,
      portraitAnswered: portraitAnsweredCount(questions)
    })
  },

  onPortraitOtherInput(event) {
    const questionIndex = Number(event.currentTarget.dataset.questionIndex)
    const questions = this.data.portraitQuestions.map((question, index) => (
      index === questionIndex
        ? { ...question, otherValue: event.detail.value }
        : question
    ))
    this.setData({ portraitQuestions: questions })
  },

  nextStep() {
    const { step, form } = this.data
    if (step === 1 && !form.nickname.trim()) {
      wx.showToast({ title: '先告诉我怎么称呼你', icon: 'none' })
      return
    }
    if (step === 2 && (!form.level || !form.experience)) {
      wx.showToast({ title: '再选一下水平和球龄', icon: 'none' })
      return
    }
    if (step === 3 && !form.goals.length) {
      wx.showToast({ title: '至少选一个小目标吧', icon: 'none' })
      return
    }
    if (step === 3 && form.goals.indexOf('其他') >= 0 && !form.goalOther.trim()) {
      wx.showToast({ title: '写下你的其他目标', icon: 'none' })
      return
    }
    this.setData({ step: Math.min(4, step + 1) })
  },

  previousStep() {
    if (this.data.portraitOnly || this.data.goalsOnly) {
      wx.navigateBack()
      return
    }
    this.setData({ step: Math.max(0, this.data.step - 1) })
  },

  async complete() {
    if (!this.data.portraitOnly && !this.data.form.goals.length) {
      wx.showToast({ title: '至少选一个小目标吧', icon: 'none' })
      return
    }
    if (!this.data.portraitOnly && this.data.form.goals.indexOf('其他') >= 0 && !this.data.form.goalOther.trim()) {
      wx.showToast({ title: '写下你的其他目标', icon: 'none' })
      return
    }

    const existing = await repository.getProfile()
    const portrait = portraitProfile(this.data.portraitQuestions)
    const goals = this.data.form.goals.map(goal => (
      goal === '其他' ? `其他：${this.data.form.goalOther.trim()}` : goal
    ))
    const nextProfile = this.data.portraitOnly
      ? {
          ...existing,
          ...portrait
        }
      : {
          ...existing,
          ...this.data.form,
          goals,
          ...portrait,
          nickname: this.data.form.nickname.trim(),
          registeredAt: (existing && existing.registeredAt) || new Date().toISOString()
        }
    await repository.saveProfile(nextProfile)
    await repository.track(existing ? 'profile_updated' : 'onboarding_completed', {
      level: this.data.form.level,
      goals,
      portraitAnswered: this.data.portraitAnswered
    })

    if (this.data.portraitOnly || this.data.goalsOnly) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/home/index' })
  },

  skipOptional() {
    this.complete()
  }
})
