// cloudfunctions/deleteProject/index.js

const cloud = require("wx-server-sdk");

// 初始化云开发环境
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 请替换为您的实际云环境ID
});

const db = cloud.database();

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

    // 检查用户是否为项目创建者
    if (project.creator !== openid) {
      return { success: false, error: "只有项目创建者可以删除项目" };
    }

    // 删除项目文档
    const deleteProjectRes = await db
      .collection("Projects")
      .doc(projectId)
      .remove();
    if (deleteProjectRes.stats.removed === 0) {
      return { success: false, error: "删除项目失败，请稍后再试" };
    }

    // 删除关联的聊天室文档
    await db
      .collection("Chatrooms")
      .where({
        projectId: projectId,
      })
      .remove();

    return { success: true };
  } catch (err) {
    console.error("Failed to delete project:", err);
    return { success: false, error: "服务器错误，请稍后再试" };
  }
};
