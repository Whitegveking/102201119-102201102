const cloud = require("wx-server-sdk");

// 初始化云开发环境
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 请替换为您的实际云环境ID，例如 'my-env-id'
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { projectId, newStatus } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 可选的项目状态列表
  const validStatuses = ["进行中", "已完成", "已取消"];

  // 验证新状态是否有效
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: "无效的项目状态" };
  }

  try {
    // 查找项目
    const projectRes = await db.collection("Projects").doc(projectId).get();
    const project = projectRes.data;

    if (!project) {
      return { success: false, error: "项目不存在" };
    }

    // 检查当前用户是否为项目创建者
    if (project.creator !== openid) {
      return { success: false, error: "您没有权限更改此项目的状态" };
    }

    // 更新项目状态
    await db
      .collection("Projects")
      .doc(projectId)
      .update({
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  } catch (err) {
    console.error("更新项目状态失败:", err);
    return { success: false, error: "更新项目状态失败" };
  }
};
