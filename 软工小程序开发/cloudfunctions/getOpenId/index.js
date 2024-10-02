// 云函数入口文件
const path = require("path");
const cloud = require(path.join(
  "D:/学习/软件工程/软工小程序开发",
  "node_modules/wx-server-sdk"
));
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4",
});

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
  };
};
