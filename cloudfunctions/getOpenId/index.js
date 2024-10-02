// 云函数入口文件
const cloud = require("wx-server-sdk");
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4",
});

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
  };
};
