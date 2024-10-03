// cloudfunctions/updateUsername/index.js

const cloud = require("wx-server-sdk");

// 初始化云开发环境
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 请替换为您的实际云环境ID，例如 'my-env-id'
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { newUsername } = event; // 从前端传递的参数中获取新的用户名
  const openid = cloud.getWXContext().OPENID; // 获取调用者的 OpenID

  // 日志记录
  console.log(
    `Received request to update username to: ${newUsername} for openid: ${openid}`
  );

  // 输入验证：新用户名不能为空
  if (!newUsername) {
    console.error("新用户名不能为空");
    return { success: false, error: "新用户名不能为空" };
  }

  // 输入验证：用户名格式
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(newUsername)) {
    console.error("新用户名格式不正确");
    return {
      success: false,
      error: "用户名必须为3-20个字符，且只能包含字母、数字和下划线",
    };
  }

  try {
    // 检查新用户名是否已存在，排除当前用户
    const userWithNewUsername = await db
      .collection("Users")
      .where({
        username: newUsername,
        _openid: _.neq(openid), // 排除当前用户
      })
      .get();

    console.log(
      `Found ${userWithNewUsername.data.length} user(s) with username ${newUsername}`
    );

    if (userWithNewUsername.data.length > 0) {
      // 新用户名已存在
      return { success: true, exists: true };
    }

    // 更新当前用户的用户名
    const updateResult = await db
      .collection("Users")
      .where({
        _openid: openid,
      })
      .update({
        data: {
          username: newUsername,
        },
      });

    console.log(`Update result: ${JSON.stringify(updateResult)}`);

    if (updateResult.stats.updated === 0) {
      // 没有文档被更新，可能是用户信息不存在
      console.error("更新失败，未找到用户信息");
      return { success: false, error: "更新失败，未找到用户信息" };
    }

    // 更新成功
    return { success: true, exists: false };
  } catch (err) {
    // 捕获并记录错误
    console.error("更新用户名时发生错误:", err);
    return { success: false, error: "服务器错误，请稍后再试" };
  }
};
