const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTIONS = ['sessions', 'feedback', 'events', 'profiles']
const BATCH_SIZE = 100

async function removeUserDocuments(collectionName, openid) {
  let deleted = 0

  while (true) {
    const result = await db.collection(collectionName)
      .where({ _openid: openid })
      .field({ _id: true })
      .limit(BATCH_SIZE)
      .get()

    if (!result.data.length) break

    await Promise.all(result.data.map(item => (
      db.collection(collectionName).doc(item._id).remove()
    )))
    deleted += result.data.length
  }

  return deleted
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { success: false, message: '无法识别当前用户' }
  }

  const deleted = {}
  for (const collectionName of COLLECTIONS) {
    deleted[collectionName] = await removeUserDocuments(collectionName, OPENID)
  }

  return { success: true, deleted }
}
