const env = require('../config/env')

const KEYS = {
  profile: 'yipai_profile',
  sessions: 'yipai_sessions',
  feedback: 'yipai_feedback',
  events: 'yipai_events'
}

function cloudEnabled() {
  return Boolean(env.cloudEnvId && wx.cloud)
}

function database() {
  return wx.cloud.database()
}

async function getProfile() {
  if (cloudEnabled()) {
    const result = await database().collection('profiles').limit(1).get()
    return result.data[0] || null
  }
  return wx.getStorageSync(KEYS.profile) || null
}

async function saveProfile(profile) {
  const {
    _id,
    _openid,
    ...editableProfile
  } = profile || {}
  const payload = {
    ...editableProfile,
    updatedAt: new Date().toISOString()
  }

  if (cloudEnabled()) {
    const existing = await database().collection('profiles').limit(1).get()
    if (existing.data[0]) {
      await database().collection('profiles').doc(existing.data[0]._id).update({
        data: payload
      })
    } else {
      await database().collection('profiles').add({ data: payload })
    }
    return payload
  }

  wx.setStorageSync(KEYS.profile, payload)
  return payload
}

async function listSessions() {
  if (cloudEnabled()) {
    const result = await database()
      .collection('sessions')
      .orderBy('date', 'desc')
      .limit(100)
      .get()
    return result.data
  }

  return (wx.getStorageSync(KEYS.sessions) || [])
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`))
}

async function addSession(session) {
  const payload = {
    ...session,
    id: session.id || `session_${Date.now()}`,
    createdAt: new Date().toISOString()
  }

  if (cloudEnabled()) {
    const result = await database().collection('sessions').add({ data: payload })
    return { ...payload, _id: result._id }
  }

  const sessions = wx.getStorageSync(KEYS.sessions) || []
  sessions.unshift(payload)
  wx.setStorageSync(KEYS.sessions, sessions)
  return payload
}

async function getSession(id) {
  if (!id) return null
  if (cloudEnabled()) {
    const result = await database().collection('sessions').where({ id }).limit(1).get()
    return result.data[0] || null
  }
  return (wx.getStorageSync(KEYS.sessions) || []).find(session => session.id === id) || null
}

async function updateSession(id, changes) {
  const existing = await getSession(id)
  if (!existing) throw new Error('没有找到这条记录')

  const {
    _id,
    _openid,
    ...editableChanges
  } = changes || {}
  const payload = {
    ...editableChanges,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  }

  if (cloudEnabled()) {
    await database().collection('sessions').doc(existing._id).update({ data: payload })
    return { ...existing, ...payload }
  }

  const sessions = wx.getStorageSync(KEYS.sessions) || []
  const nextSessions = sessions.map(session => (
    session.id === id ? { ...session, ...payload } : session
  ))
  wx.setStorageSync(KEYS.sessions, nextSessions)
  return { ...existing, ...payload }
}

async function deleteSession(id) {
  const existing = await getSession(id)
  if (!existing) return false

  if (cloudEnabled()) {
    await database().collection('sessions').doc(existing._id).remove()
    return true
  }

  const sessions = wx.getStorageSync(KEYS.sessions) || []
  wx.setStorageSync(KEYS.sessions, sessions.filter(session => session.id !== id))
  return true
}

async function saveFeedback(feedback) {
  const payload = {
    ...feedback,
    id: `feedback_${Date.now()}`,
    createdAt: new Date().toISOString()
  }

  if (cloudEnabled()) {
    await database().collection('feedback').add({ data: payload })
    return payload
  }

  const list = wx.getStorageSync(KEYS.feedback) || []
  list.unshift(payload)
  wx.setStorageSync(KEYS.feedback, list)
  return payload
}

async function track(name, properties = {}) {
  const payload = {
    name,
    properties,
    createdAt: new Date().toISOString()
  }

  if (cloudEnabled()) {
    try {
      await database().collection('events').add({ data: payload })
    } catch (error) {
      console.warn('Event tracking failed', error)
    }
    return
  }

  const events = wx.getStorageSync(KEYS.events) || []
  events.unshift(payload)
  wx.setStorageSync(KEYS.events, events.slice(0, 300))
}

async function clearAll() {
  if (cloudEnabled()) {
    const response = await wx.cloud.callFunction({ name: 'deleteAccountData' })
    const result = response && response.result
    if (!result || !result.success) {
      throw new Error((result && result.message) || '云端数据删除失败')
    }
    Object.values(KEYS).forEach(key => wx.removeStorageSync(key))
    return result.deleted || {}
  }

  Object.values(KEYS).forEach(key => wx.removeStorageSync(key))
  return {}
}

module.exports = {
  cloudEnabled,
  getProfile,
  saveProfile,
  listSessions,
  addSession,
  getSession,
  updateSession,
  deleteSession,
  saveFeedback,
  track,
  clearAll
}
