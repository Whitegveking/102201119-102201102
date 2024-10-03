// cloudfunctions/joinProject/index.js

const cloud = require("wx-server-sdk");

cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 请替换为您的实际云环境ID
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { projectId } = event;
  const openid = cloud.getWXContext().OPENID;

  if (!projectId) {
    return { success: false, error: "项目ID不能为空" };
  }

  try {
    // 获取项目详情
    const projectRes = await db.collection("Projects").doc(projectId).get();
    const project = projectRes.data;

    if (!project) {
      return { success: false, error: "项目不存在" };
    }

    // 检查用户是否已加入项目
    const isMember = project.members && project.members.includes(openid);
    if (isMember) {
      return { success: false, error: "您已加入该项目" };
    }

    // 更新项目的 members 列表，添加用户的 openid
    const updateRes = await db
      .collection("Projects")
      .doc(projectId)
      .update({
        data: {
          members: _.push([openid]),
        },
      });

    if (updateRes.stats.updated === 0) {
      return { success: false, error: "加入失败，未找到项目" };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to join project:", err);
    return { success: false, error: "服务器错误，请稍后再试" };
  }
};
