// pages/projectDetail/projectDetail.js
Page({
  data: {
    project: {},
    creatorUsername: "",
    isCreator: false,
    isMember: false,
    chatroom: {},
    messages: [],
    newMessage: "",
    projectId: "",
  },

  onLoad: function (options) {
    const projectId = options.id;
    this.setData({ projectId });

    if (projectId) {
      this.fetchProjectDetail(projectId);
      this.fetchChatroom(projectId);
    } else {
      wx.showToast({
        title: "项目ID缺失",
        icon: "none",
      });
    }
  },

  // 格式化时间戳为可读格式
  formatTimestamp: function (timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  },

  // 调用云函数获取项目详情和创建者用户名
  fetchProjectDetail: function (projectId) {
    wx.cloud
      .callFunction({
        name: "getProjects",
        data: { projectId: projectId },
      })
      .then((res) => {
        if (res.result.success) {
          const project = res.result.project;
          const creatorUsername = res.result.creatorUsername;

          // 判断当前用户是否为创建者或已加入项目
          const openid = wx.getStorageSync("openid");
          const isCreator = project.creator === openid;
          const isMember = project.members && project.members.includes(openid);

          this.setData({
            project: project,
            creatorUsername: creatorUsername,
            isCreator: isCreator,
            isMember: isMember,
          });
        } else {
          wx.showToast({
            title: res.result.error || "获取项目详情失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to call getProjectDetail:", err);
        wx.showToast({
          title: "获取项目详情失败",
          icon: "none",
        });
      });
  },

  // 获取聊天室数据
  fetchChatroom: function (projectId) {
    const db = wx.cloud.database();
    db.collection("Chatrooms")
      .where({
        projectId: projectId,
      })
      .get()
      .then((res) => {
        if (res.data.length > 0) {
          this.setData({
            chatroom: res.data[0],
            messages: res.data[0].messages || [],
          });
        } else {
          // 如果没有聊天室，创建一个新的聊天室
          db.collection("Chatrooms")
            .add({
              data: {
                projectId: projectId,
                messages: [],
              },
            })
            .then((addRes) => {
              this.setData({
                chatroom: { projectId: projectId, messages: [] },
                messages: [],
              });
            })
            .catch((err) => {
              console.error("Failed to create chatroom:", err);
              wx.showToast({
                title: "创建聊天室失败",
                icon: "none",
              });
            });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch chatroom:", err);
        wx.showToast({
          title: "获取聊天室失败",
          icon: "none",
        });
      });
  },

  // 处理新消息输入
  handleMessageInput: function (e) {
    this.setData({
      newMessage: e.detail.value,
    });
  },

  // 发送新消息
  sendMessage: function () {
    const { newMessage, chatroom, projectId } = this.data;
    if (!newMessage.trim()) {
      wx.showToast({
        title: "消息不能为空",
        icon: "none",
      });
      return;
    }

    const db = wx.cloud.database();
    const _ = db.command;
    const openid = wx.getStorageSync("openid"); // 确保已存储 openid
    const username = wx.getStorageSync("username"); // 确保已存储 username

    const message = {
      senderOpenid: openid,
      senderUsername: username,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    db.collection("Chatrooms")
      .where({
        projectId: projectId,
      })
      .update({
        data: {
          messages: _.push([message]),
        },
      })
      .then((res) => {
        this.setData({
          newMessage: "",
          messages: [...this.data.messages, message],
        });
        wx.showToast({
          title: "发送成功",
          icon: "success",
        });
      })
      .catch((err) => {
        console.error("Failed to send message:", err);
        wx.showToast({
          title: "发送失败",
          icon: "none",
        });
      });
  },

  // 处理“加入项目”按钮点击
  joinProject: function () {
    const projectId = this.data.projectId;
    if (!projectId) {
      wx.showToast({
        title: "项目ID缺失",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "正在加入...",
      mask: true,
    });

    wx.cloud
      .callFunction({
        name: "joinProject",
        data: { projectId: projectId },
      })
      .then((res) => {
        wx.hideLoading();
        if (res.result.success) {
          wx.showToast({
            title: "加入成功",
            icon: "success",
          });
          // 更新本地数据
          this.setData({
            isMember: true,
            "project.members": [
              ...(this.data.project.members || []),
              wx.getStorageSync("openid"),
            ],
          });
        } else {
          wx.showToast({
            title: res.result.error || "加入失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error("Failed to call joinProject:", err);
        wx.showToast({
          title: "加入失败",
          icon: "none",
        });
      });
  },
});
