// cloudfunctions/updateProject/index.js
const cloud = require("wx-server-sdk");

cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 替换为你的云环境ID
});
// 初始化云开发环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event, context) => {
  const { projectId, name, description, skills, status } = event;
  const openid = cloud.getWXContext().OPENID;
  // 项目状态列表
  if (!projectId) {
    return {
      success: false,
      error: "Project ID is required",
    };
  }

  try {
    // 获取项目详情
    const projectRes = await db.collection("Projects").doc(projectId).get();
    const project = projectRes.data;

    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    // 检查当前用户是否是项目的创建者
    if (project.creator !== openid) {
      return {
        success: false,
        error: "Only the project creator can update the project",
      };
    }

    // 更新项目信息
    await db
      .collection("Projects")
      .doc(projectId)
      .update({
        data: {
          name: name || project.name,
          description: description || project.description,
          skills: skills || project.skills,
          status: status || project.status,
          updatedAt: new Date(),
        },
      });

    return {
      success: true,
    };
  } catch (err) {
    console.error("Failed to update project:", err);
    return {
      success: false,
      error: "Failed to update project",
    };
  }
};
