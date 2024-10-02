// 云函数入口文件
const cloud = require("wx-server-sdk");
cloud.init({
  env: "projectpartner-1g4uenov4ed43ae4",
});
const db = cloud.database();

exports.main = async (event, context) => {
  const { name } = event;
  let _ = db.command;
  let query = {};
  if (name) {
    query = {
      name: db.RegExp({
        regexp: name,
        options: "i",
      }),
    };
  }
  try {
    const res = await db.collection("Projects").where(query).get();
    return res;
  } catch (err) {
    return err;
  }
};
