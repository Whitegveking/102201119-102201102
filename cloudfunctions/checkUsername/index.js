// cloudfunctions/checkUsername/index.js
const cloud = require("wx-server-sdk");

cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 替换为您的云环境ID
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { username } = event;

  if (!username) {
    return { success: false, error: "用户名不能为空" };
  }

  try {
    // 查询是否有相同的用户名
    const res = await db
      .collection("Users")
      .where({
        username: username,
      })
      .get();

    if (res.data.length > 0) {
      return { success: true, exists: true };
    } else {
      return { success: true, exists: false };
    }
  } catch (err) {
    console.error("Error checking username:", err);
    return { success: false, error: err.message };
  }
};
