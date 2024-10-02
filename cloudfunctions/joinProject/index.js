// 云函数入口文件
const cloud = require("wx-server-sdk");
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4",
});
const db = cloud.database();

exports.main = async (event, context) => {
  const { projectId } = event;
  const openid = cloud.getWXContext().OPENID;

  try {
    const project = await db.collection("Projects").doc(projectId).get();
    if (project.data.status !== "招募中") {
      return { success: false, message: "项目不在招募中" };
    }
    if (project.data.members.includes(openid)) {
      return { success: false, message: "已加入该项目" };
    }
    await db
      .collection("Projects")
      .doc(projectId)
      .update({
        data: {
          members: db.command.push(openid),
        },
      });
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
};
