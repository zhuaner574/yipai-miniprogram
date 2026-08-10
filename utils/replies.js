const NEGATIVE_MOODS = ['frustrated', 'tired']

const replyLibrary = [
  {
    id: 'physical_pain',
    title: '身体不对劲先别硬撑',
    keywords: ['受伤', '剧痛', '疼痛', '扭伤', '拉伤', '膝盖疼', '手腕疼', '肩膀疼'],
    messages: [
      '打到一半不得不停下来确实扫兴\n突然疼痛或活动受限时先别硬撑',
      '打球时身体突然不舒服确实扫兴\n先分清普通疲劳还是疼痛加重'
    ],
    directMessage: '先判断是普通疲劳还是突然疼痛和活动受限',
    nextLabel: '先照顾身体',
    nextStep: '突然疼痛、活动受限或疼痛加重时立即停止\n症状持续或较重时及时就医'
  },
  {
    id: 'pressure_point',
    title: '关键分丢了确实可惜',
    keywords: ['关键分', '局点', '盘点', '赛点', '抢七', '破发点'],
    messages: [
      '关键分最磨人\n越想拿下动作越容易紧',
      '关键分没收下来确实堵得慌\n这种分往往会在脑子里多停一会儿',
      '关键分越想打出特别的一拍\n越容易离开原来的套路'
    ],
    directMessage: '先看这分是选球变急 动作变紧 还是临时改变了套路',
    nextStep: '下次关键分只留一个固定提示\n接发先过网 或发球走固定落点'
  },
  {
    id: 'lost_match',
    title: '输了就是会不爽',
    keywords: ['输了', '输球', '被淘汰', '一轮游', '输掉'],
    messages: [
      '认真准备后还是输了\n在意比分很正常',
      '比分已经定了\n先不用反复想整场 只找一两个转折点',
      '连续输球时经验两个字确实没什么安慰\n这场先只看最明显的问题'
    ],
    directMessage: '先看比分从哪一局开始变化\n再看是发球、接发还是相持出了问题',
    nextStep: '记下一个转折点和一个重复出现的问题 再决定接下来怎么练'
  },
  {
    id: 'comeback_loss',
    title: '被翻盘最让人憋屈',
    keywords: ['被翻盘', '领先没守住', '浪费领先', '逆转'],
    messages: [
      '你已经开始觉得这场能赢\n最后却没收下来 确实很难受',
      '领先后节奏一变\n比输得干脆更让人反复想',
      '最容易反复想的是最后几分\n但真正的变化可能更早就开始了'
    ],
    directMessage: '找出领先后的第一个变化\n只看选球、体力、发球局或对手策略',
    nextStep: '记下节奏第一次发生变化的那一分'
  },
  {
    id: 'nervous',
    title: '紧张确实会让动作变形',
    keywords: ['紧张', '手抖', '僵硬', '不敢打', '怂了', '保守'],
    messages: [
      '脑子知道怎么打 身体却发紧\n这种脱节很折磨',
      '紧张时击球点可能变晚\n脚步也可能突然停下来',
      '比赛经验多也可能紧张\n重点是学会带着紧张执行简单套路'
    ],
    directMessage: '紧张时先减少临场判断 只执行一个固定套路',
    nextStep: '发球或接发前做一次慢呼吸\n只保留一个动作提示'
  },
  {
    id: 'serve',
    title: '发球一乱会越发越急',
    keywords: ['双误', '发球不进', '二发', '发球送分', '发球崩', '一发'],
    messages: [
      '是连续双误、抛球不稳\n还是越发越不敢放动作？',
      '连续发球失误后\n一发和二发都会一起承受压力',
      '这次先不用给发球下结论\n先回想抛球、节奏和落点哪一项最先失控'
    ],
    directMessage: '先检查抛球位置和挥拍节奏 一次只改一项',
    nextStep: '下次发球先不追求速度 只把节奏做完整'
  },
  {
    id: 'errors',
    title: '失误多不一定是同一个问题',
    keywords: ['失误', '下网', '出界', '失误太多'],
    messages: [
      '下网、出界和击球点晚\n背后的问题往往不一样',
      '连续强行变线和正常相持失误也要分开看\n先找到重复最多的一类',
      '今天失误多确实影响体验\n先不用把所有球归成手感差'
    ],
    directMessage: '先区分下网、出界、击球点晚\n还是某一侧连续失误',
    nextStep: '下次只记录重复最多的一类失误'
  },
  {
    id: 'bad_form',
    title: '今天手感确实不在线',
    keywords: ['没手感', '手感差', '打不准', '找不到球', '状态差'],
    messages: [
      '平时熟悉的球今天总对不上点\n这种感觉很烦',
      '手感差时越想马上找回来越容易加力\n先把球速和目标放低一点',
      '有时和脚步慢半拍、击球点偏了有关\n可以先从最熟悉的球路确认'
    ],
    directMessage: '先看脚步有没有到位\n击球点是不是比平时更晚',
    nextStep: '下次热身先打最熟悉的球路 把球速放低一点'
  },
  {
    id: 'plateau',
    title: '看不见变化确实会怀疑练法',
    keywords: ['没进步', '瓶颈', '白练了', '还是不会', '学得慢'],
    messages: [
      '练了一段时间还停在原地\n这种挫败很真实',
      '发现的问题变多可能是观察更细了\n也可能是训练内容需要调整',
      '现在看不见变化\n先不用急着证明自己还在进步'
    ],
    directMessage: '先选一个可量化指标 再判断是时间不够还是练法需要调整',
    nextStep: '这周只选一个小指标 用同一种方式记录三次'
  },
  {
    id: 'technique_change',
    title: '改动作后更别扭很常见',
    keywords: ['改动作', '越练越差', '不会打了', '动作乱'],
    messages: [
      '原来的球也打不出来 新动作又不稳定\n这段过渡确实最烦',
      '持续别扭也值得重新确认方向\n不必把所有问题都当成正常过渡',
      '改动作靠反馈和拆解\n不是靠硬熬'
    ],
    directMessage: '先确认动作方向\n一次只练一个提示',
    nextStep: '下次只带一个动作提示 如果持续别扭就重新和教练确认'
  },
  {
    id: 'coach_feedback',
    title: '反馈有用 语气也重要',
    keywords: ['被骂', '被批评', '教练说', '教练批评'],
    messages: [
      '一次被指出太多问题\n很容易只剩下挫败感',
      '建议可以留下 难受也是真的\n表达方式同样重要',
      '如果反馈不具体\n你可以请教练说清楚先改哪一点'
    ],
    directMessage: '先判断反馈是否具体可执行\n不清楚就请教练说明先改哪一点',
    nextStep: '从反馈里先选一条能执行的\n如果语气持续让你不舒服 也可以直接沟通'
  },
  {
    id: 'strong_opponent',
    title: '快一档的节奏确实很压迫',
    keywords: ['被打爆', '差距太大', '接不到', '零封', '对手太强'],
    messages: [
      '对方可能强在球速、旋转或落点变化\n自己的节奏被压住时很容易怀疑水平',
      '被连续压制时\n总觉得自己哪边都来不及',
      '差距大时先别急着得出全面结论\n分清是球速 旋转 落点还是衔接'
    ],
    directMessage: '先分清最难处理的是球速 旋转 深度还是下一拍衔接',
    nextStep: '记下对手最让你难处理的一种球 把它作为下一次练习方向'
  },
  {
    id: 'comparison',
    title: '比较带来的压力很真实',
    keywords: ['别人进步快', '我太菜', '比别人慢', '比较'],
    messages: [
      '看到同水平球友突然进步很多\n心里有落差很正常',
      '比较本身也能提供信息\n关键是看清对方具体做得更好的地方',
      '别把进步快慢直接变成对自己的评价\n把差距拆成一个可观察的问题'
    ],
    directMessage: '把比较改成观察 具体看对方哪一项比以前更稳定',
    nextStep: '既看一个月前的自己 也记下同水平球友一个具体优点'
  },
  {
    id: 'rough_day',
    title: '今天确实不太顺',
    keywords: [],
    messages: [
      '今天是哪一段开始不顺\n现在不想细想也可以',
      '今天可能就是打得差\n先如实记下来就够了',
      '现在不用急着总结意义\n等情绪过去再看要不要复盘'
    ],
    directMessage: '今天更接近哪一种\n身体累、技术不顺还是结果让你不爽',
    nextStep: '先选最接近的一种感受 不用一次处理所有问题'
  }
]

const happyReplies = [
  {
    id: 'happy_01',
    title: '今天打得挺开心',
    message: '这种打完以后还会回味的球局\n确实很舒服',
    directMessage: '记下今天最爽的一球',
    nextStep: '今天是哪一球让你觉得最爽'
  },
  {
    id: 'happy_02',
    title: '手感和心情都不错',
    message: '能打出自己想要的球\n开心很直接',
    directMessage: '记下今天最顺的一种球',
    nextStep: '是发球 正手 反手还是一段相持最顺'
  },
  {
    id: 'happy_03',
    title: '今天很享受',
    message: '不管是和球友拉球还是打比赛\n享受过程就很好',
    directMessage: '记下今天最想重复的一段',
    nextStep: '下次还想重复今天的哪一段'
  },
  {
    id: 'happy_04',
    title: '这场有意思',
    message: '开心可能来自一个好球、一段相持\n也可能只是和球友见了一面',
    directMessage: '记下一个印象最深的回合',
    nextStep: '选一个想和球友再聊的回合'
  },
  {
    id: 'happy_05',
    title: '今天心情不错',
    message: '这次记录留到这里也可以\n开心本身已经很清楚',
    directMessage: '想多记一句就写下开心来自哪里',
    nextStep: '想多记一句就写下开心来自哪里'
  }
]

const progressReplies = [
  {
    id: 'progress_01',
    title: '今天有个地方打通了',
    message: '能明确感觉到某一项比以前好\n这种反馈很提气',
    directMessage: '把具体变化写下来',
    nextStep: '记下变化来自动作 落点 稳定性还是比赛处理'
  },
  {
    id: 'progress_02',
    title: '这次变化很具体',
    message: '这次变化很清楚\n把它发生时的条件记下来 更容易找回同样的感觉',
    directMessage: '记录这次成功时的条件',
    nextStep: '记下当时的球速 落点和身体节奏'
  },
  {
    id: 'progress_03',
    title: '今天多了一次成功体验',
    message: '这次确实做到了\n记清它发生在哪种场景就好',
    directMessage: '标记这次成功发生在哪种场景',
    nextStep: '标记是无压力练习 计分对抗还是正式比赛'
  },
  {
    id: 'progress_04',
    title: '这个变化可以继续观察',
    message: '今天确实做到了\n下次再看看它能不能稳定出现',
    directMessage: '下次用同一个指标再看一次',
    nextStep: '下次继续观察同一个小指标'
  },
  {
    id: 'progress_05',
    title: '先把这次进步记清楚',
    message: '是动作更顺 数据更好 还是比赛里第一次做到\n具体一点更容易回看',
    directMessage: '用一句话写下最明显的变化',
    nextStep: '用一句话写下今天最明显的变化'
  }
]

const calmReplies = [
  {
    id: 'calm_01',
    title: '就是普通的一次上场',
    message: '没有特别好也没有特别差\n普通地记下来就好',
    directMessage: '今天不想总结也可以',
    nextStep: '今天不想总结也可以'
  },
  {
    id: 'calm_02',
    title: '一次轻松的上场',
    message: '拉拉球 出出汗\n这样的一次也很舒服',
    directMessage: '记下时长就够了',
    nextStep: '记下时长就够了'
  },
  {
    id: 'calm_03',
    title: '今天打得很平稳',
    message: '没有明显波动\n这次记录就留到这里',
    directMessage: '这次记录就留到这里',
    nextStep: '下次照常打'
  },
  {
    id: 'calm_04',
    title: '普通的一次练习',
    message: '有些训练就是完成计划\n不需要额外解释',
    directMessage: '想复盘就只记一个细节',
    nextStep: '如果想复盘 只记一个细节'
  },
  {
    id: 'calm_05',
    title: '今天只是来打球',
    message: '和球友打几拍 或者自己练一会儿\n简单一点也很好',
    directMessage: '留下一条记录就够了',
    nextStep: '留下一条记录就够了'
  },
  {
    id: 'calm_06',
    title: '平静收场',
    message: '今天没有特别想夸或想批评的地方\n照实记下就好',
    directMessage: '如实记下就好',
    nextStep: '下一次再看'
  }
]

const ISSUE_CATEGORY_MAP = {
  '关键分': 'pressure_point',
  '输球': 'lost_match',
  '紧张': 'nervous',
  '失误太多': 'errors',
  '没进步': 'plateau',
  '教练批评': 'coach_feedback',
  '手感差': 'bad_form',
  '对手太强': 'strong_opponent'
}

function chooseBySeed(items, seed) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(index)
    hash |= 0
  }
  return items[Math.abs(hash) % items.length]
}

function chooseWithoutRecent(items, seed, recentReplyIds = []) {
  const recent = new Set(recentReplyIds.filter(Boolean))
  const available = items.filter((item, index) => !recent.has(item.id || `${index}`))
  const candidates = available.length ? available : items
  return chooseBySeed(candidates, seed)
}

function formatReplyCopy(value) {
  return String(value || '')
    .split(/\n+/)
    .map(part => part
      .trim()
      .replace(/\s+/g, '，')
      .replace(/([，。！？；：、])，/g, '$1'))
    .filter(Boolean)
    .join('\n')
}

function applyTone(reply, tone) {
  const { directMessage, ...publicReply } = reply
  let message = publicReply.message
  let nextStep = publicReply.nextStep

  if (tone === 'gentle') {
    nextStep = publicReply.categoryId === 'physical_pain' ? nextStep : ''
  } else if (tone === 'direct') {
    message = directMessage || String(message || '').split('\n')[0]
    nextStep = publicReply.categoryId === 'physical_pain' ? nextStep : ''
  }

  return {
    ...publicReply,
    title: formatReplyCopy(publicReply.title),
    message: formatReplyCopy(message),
    nextLabel: publicReply.nextLabel || '留给下一次',
    nextStep: formatReplyCopy(nextStep)
  }
}

function categoryReply(category, session, source) {
  const messages = category.messages.map((message, index) => ({
    id: `${category.id}_${String(index + 1).padStart(2, '0')}`,
    message
  }))
  const selected = chooseWithoutRecent(messages, `${session.date}-${source}`, session.recentReplyIds)
  return applyTone({
    categoryId: category.id,
    variantId: selected.id,
    title: category.title,
    message: selected.message,
    directMessage: category.directMessage,
    nextLabel: category.nextLabel,
    nextStep: category.nextStep
  }, session.tone)
}

function positiveReply(replies, categoryId, session) {
  const selected = chooseWithoutRecent(replies, `${session.date}-${session.type}`, session.recentReplyIds)
  return applyTone({
    categoryId,
    variantId: selected.id,
    ...selected
  }, session.tone)
}

function generateReply(session) {
  const source = `${session.issue || ''} ${session.diary || ''}`
  const selectedIssues = Array.isArray(session.issues)
    ? session.issues
    : String(session.issue || '').split(/[、,，]/).filter(Boolean)
  const selectedCategoryId = selectedIssues
    .map(issue => ISSUE_CATEGORY_MAP[issue])
    .find(Boolean)
  const matchedCategory = selectedCategoryId
    ? replyLibrary.find(item => item.id === selectedCategoryId)
    : replyLibrary.find(item => item.keywords.some(keyword => source.includes(keyword)))
  const physicalPain = replyLibrary.find(item => item.id === 'physical_pain')

  if (physicalPain.keywords.some(keyword => source.includes(keyword))) {
    return categoryReply(physicalPain, session, source)
  }

  if (session.mood === 'great') {
    return positiveReply(happyReplies, 'positive', session)
  }

  if (session.mood === 'progress') {
    return positiveReply(progressReplies, 'positive', session)
  }

  if (session.mood === 'calm') {
    return positiveReply(calmReplies, 'calm', session)
  }

  if (matchedCategory) {
    return categoryReply(matchedCategory, session, source)
  }

  if (NEGATIVE_MOODS.includes(session.mood)) {
    const fallback = replyLibrary.find(item => item.id === 'rough_day')
    return categoryReply(fallback, session, `${session.mood}-${source}`)
  }

  return positiveReply(happyReplies, 'positive', session)
}

module.exports = {
  generateReply,
  replyLibrary,
  formatReplyCopy
}
