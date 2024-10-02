// cloudfunctions/addProject/index.js
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { name, description, skills, status } = event
  const openid = cloud.getWXContext().OPENID
  try {
    const res = await db.collection('Projects').add({
      data: {
        name,
        description,
        skills,
        status,
        creator: openid,
        members: [openid],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    return { success: true, _id: res._id }
  } catch (err) {
    return { success: false, error: err }
  }
}
