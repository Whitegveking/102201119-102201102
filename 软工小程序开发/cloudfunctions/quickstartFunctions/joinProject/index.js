// cloudfunctions/joinProject/index.js
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { projectId } = event
  const openid = cloud.getWXContext().OPENID

  try {
    const project = await db.collection('Projects').doc(projectId).get()
    if (project.data.status !== '招募中') {
      return { success: false, message: '项目不在招募中' }
    }
    if (project.data.members.includes(openid)) {
      return { success: false, message: '已加入该项目' }
    }
    await db.collection('Projects').doc(projectId).update({
      data: {
        members: db.command.push(openid)
      }
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err }
  }
}
