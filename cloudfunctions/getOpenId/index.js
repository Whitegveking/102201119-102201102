// cloudfunctions/getOpenId/index.js

const cloud = require("wx-server-sdk");

// 初始化云开发环境
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4", // 请替换为您的实际云环境ID
});

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,//返回用户的openid
    appid: wxContext.APPID,//返回用户的appid
    unionid: wxContext.UNIONID,//返回用户的unionid
  };
};
