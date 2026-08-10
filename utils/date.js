function pad(value) {
  return String(value).padStart(2, '0')
}

function toLocalDate(value) {
  if (value instanceof Date) return new Date(value.getTime())

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/)
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3] || 1))
    }
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function formatDate(date) {
  const target = toLocalDate(date)
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`
}

function formatMonthKey(date) {
  const target = toLocalDate(date)
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}`
}

function monthLabel(date) {
  const target = toLocalDate(date)
  return `${target.getFullYear()}年${target.getMonth() + 1}月`
}

function displayDate(dateString) {
  const date = toLocalDate(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function weekdayLabel(dateString) {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return labels[toLocalDate(dateString).getDay()]
}

function getMonthCalendar(date) {
  const source = toLocalDate(date)
  const target = new Date(source.getFullYear(), source.getMonth(), 1)
  const firstDay = target.getDay()
  const gridStart = new Date(target)
  gridStart.setDate(1 - firstDay)
  const today = formatDate(new Date())
  const cells = []

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(gridStart)
    current.setDate(gridStart.getDate() + index)
    cells.push({
      date: formatDate(current),
      day: current.getDate(),
      currentMonth: current.getMonth() === target.getMonth(),
      monthRelation:
        current < target
          ? 'previous'
          : current.getMonth() === target.getMonth()
            ? 'current'
            : 'next',
      isToday: formatDate(current) === today
    })
  }

  return cells
}

function daysSince(dateString) {
  if (!dateString) return 0
  const from = toLocalDate(dateString)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((now - from) / 86400000))
}

function shiftMonthKey(date, offset) {
  const target = toLocalDate(date)
  target.setDate(1)
  target.setMonth(target.getMonth() + offset)
  return formatMonthKey(target)
}

function formatDuration(minutes) {
  const numeric = Number(minutes || 0)
  if (numeric < 60) return `${numeric}分钟`
  const hours = Math.floor(numeric / 60)
  const remain = numeric % 60
  return remain ? `${hours}小时${remain}分钟` : `${hours}小时`
}

module.exports = {
  formatDate,
  formatMonthKey,
  monthLabel,
  displayDate,
  weekdayLabel,
  getMonthCalendar,
  shiftMonthKey,
  daysSince,
  formatDuration
}
