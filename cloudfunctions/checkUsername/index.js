// cloudfunctions/checkUsername/index.js

const cloud = require("wx-server-sdk");

// 初始化云开发环境
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 请替换为您的实际云环境ID
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { username } = event;

  if (!username) {
    return { success: false, error: "用户名不能为空" };
  }

  try {
    // 检查用户名是否存在
    const res = await db
      .collection("Users")
      .where({
        username: username,
      })
      .count();

    return {
      success: true,
      exists: res.total > 0,
    };
  } catch (err) {
    console.error("Failed to check username:", err);
    return { success: false, error: "服务器错误，请稍后再试" };
  }
};
