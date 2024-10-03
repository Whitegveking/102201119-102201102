// cloudfunctions/getProjectDetail/index.js

const cloud = require("wx-server-sdk");

// 初始化云开发环境
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 请替换为您的实际云环境ID
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { projectId } = event;

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

    // 获取创建者的用户名
    const creatorRes = await db
      .collection("Users")
      .where({
        _openid: project.creator,
      })
      .get();

    const creatorUsername =
      creatorRes.data.length > 0 ? creatorRes.data[0].username : "未知用户";

    return {
      success: true,
      project: project,
      creatorUsername: creatorUsername,
    };
  } catch (err) {
    console.error("Failed to get project detail:", err);
    return { success: false, error: "服务器错误，请稍后再试" };
  }
};
