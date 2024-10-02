// 云函数入口文件
const cloud = require("wx-server-sdk");
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4",
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { name, description, skills, status } = event;
  const openid = cloud.getWXContext().OPENID;

  try {
    console.log("Adding project with data:", {
      name,
      description,
      skills,
      status,
      creator: openid,
    });
    const res = await db.collection("Projects").add({
      data: {
        name,
        description,
        skills,
        status,
        creator: openid, // 存储发布者的 openid
        members: [openid], // 初始成员为发布者自己
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return { success: true, _id: res._id };
  } catch (err) {
    console.error("Error adding project:", err);
    return { success: false, error: err };
  }
};
