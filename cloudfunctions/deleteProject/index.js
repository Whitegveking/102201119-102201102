// cloudfunctions/deleteProject/index.js
const cloud = require("wx-server-sdk");

cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 替换为您的云环境ID
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { projectId } = event;
  const openid = cloud.getWXContext().OPENID;

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
        error: "Only the project creator can delete the project",
      };
    }

    // 删除项目
    await db.collection("Projects").doc(projectId).remove();

    // 从创建者的 `projects` 数组中移除该项目
    await db
      .collection("Users")
      .where({
        _openid: openid,
      })
      .update({
        data: {
          projects: _.pull(projectId),
        },
      });

    return {
      success: true,
    };
  } catch (err) {
    console.error("Failed to delete project:", err);
    return {
      success: false,
      error: "Failed to delete project",
    };
  }
};
