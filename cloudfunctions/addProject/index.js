// cloudfunctions/addProject/index.js
const cloud = require("wx-server-sdk");

cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 替换为你的云环境ID
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { name, description, skills, status } = event;
  const openid = cloud.getWXContext().OPENID;

  // 输入验证
  if (!name || !description || !Array.isArray(skills) || !status) {
    return { success: false, error: "所有字段都是必需的" };
  }

  try {
    // 获取创建者的用户名
    const userRes = await db
      .collection("Users")
      .where({
        _openid: openid,
      })
      .get();

    if (userRes.data.length === 0) {
      return { success: false, error: "用户未注册" };
    }

    const username = userRes.data[0].username;

    // 添加项目
    const projectRes = await db.collection("Projects").add({
      data: {
        name,
        description,
        skills,
        status,
        creator: openid,
        creatorUsername: username,
        members: [openid], // 初始成员为创建者自己
        participantCount: 1, // 初始参与人数为1
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 将项目ID添加到用户的 projects 数组
    await db
      .collection("Users")
      .where({
        _openid: openid,
      })
      .update({
        data: {
          projects: _.push(projectRes._id),
        },
      });

    return { success: true, _id: projectRes._id };
  } catch (err) {
    console.error("Error adding project:", err);
    return { success: false, error: err.message };
  }
};
