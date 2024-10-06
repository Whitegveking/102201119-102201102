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
    messageWatcher: null,
    openid: "", // 添加 openid
  },

  onLoad: function (options) {
    const projectId = options.id;
    this.setData({ projectId });

    if (projectId) {
      this.fetchOpenId().then(() => {
        this.fetchProjectDetail(projectId);
        this.fetchChatroom(projectId);
      });
    } else {
      wx.showToast({
        title: "项目ID缺失",
        icon: "none",
      });
    }
  },

  onUnload: function () {
    // 取消监听
    if (this.data.messageWatcher) {
      this.data.messageWatcher.close();
    }
  },

  // 获取当前用户的 openid
  fetchOpenId: function () {
    return new Promise((resolve, reject) => {
      const openid = wx.getStorageSync("openid");
      if (openid) {
        this.setData({ openid });
        resolve(openid);
      } else {
        wx.cloud
          .callFunction({
            name: "getOpenId",
            data: {},
          })
          .then((res) => {
            const openid = res.result.openid;
            if (openid) {
              wx.setStorageSync("openid", openid);
              this.setData({ openid });
              resolve(openid);
            } else {
              console.error(
                "Failed to fetch openid from cloud function result"
              );
              reject("Failed to fetch openid");
            }
          })
          .catch((err) => {
            console.error("Failed to get OpenID:", err);
            reject(err);
          });
      }
    });
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

          // 获取当前用户的 openid
          const openid = this.data.openid;

          // 判断当前用户是否为创建者或已加入项目
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
        console.error("Failed to call getProjects:", err);
        wx.showToast({
          title: "获取项目详情失败",
          icon: "none",
        });
      });
  },

  // 获取聊天室数据并设置实时监听
  fetchChatroom: function (projectId) {
    const db = wx.cloud.database();
    const _ = db.command;

    db.collection("Chatrooms")
      .where({
        projectId: projectId,
      })
      .get()
      .then((res) => {
        if (res.data.length > 0) {
          const chatroom = res.data[0];
          this.setData({
            chatroom: chatroom,
            messages: chatroom.messages || [],
          });

          // 设置实时监听
          const watcher = db
            .collection("Chatrooms")
            .where({
              projectId: projectId,
            })
            .watch({
              onChange: (snapshot) => {
                if (snapshot.docs.length > 0) {
                  const updatedChatroom = snapshot.docs[0];
                  this.setData({
                    chatroom: updatedChatroom,
                    messages: updatedChatroom.messages || [],
                  });
                }
              },
              onError: (err) => {
                console.error("实时监听失败:", err);
              },
            });

          this.setData({ messageWatcher: watcher });
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
    const { newMessage, projectId } = this.data;
    if (!newMessage.trim()) {
      wx.showToast({
        title: "消息不能为空",
        icon: "none",
      });
      return;
    }

    const db = wx.cloud.database();
    const _ = db.command;
    const openid = this.data.openid; // 已获取的 openid
    const username = wx.getStorageSync("username"); // 确保已存储 username

    console.log("发送消息的用户名:", username); // 添加日志

    if (!username) {
      wx.showToast({
        title: "用户名未设置",
        icon: "none",
      });
      return;
    }

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

  // 退出项目
  exitProject: function (e) {
    const projectId = e.currentTarget.dataset.id;
    if (!projectId) {
      wx.showToast({
        title: "项目ID缺失",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "退出项目",
      content: "您确定要退出这个项目吗？",
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: "正在退出...",
            mask: true,
          });

          wx.cloud
            .callFunction({
              name: "exitProject",
              data: { projectId: projectId },
            })
            .then((res) => {
              wx.hideLoading();
              if (res.result.success) {
                wx.showToast({
                  title: "已退出项目",
                  icon: "success",
                });
                // 重新获取项目详情以更新参与人数和按钮状态
                this.fetchProjectDetail(projectId);
              } else {
                wx.showToast({
                  title: res.result.error || "退出项目失败",
                  icon: "none",
                });
              }
            })
            .catch((err) => {
              wx.hideLoading();
              console.error("Failed to call exitProject:", err);
              wx.showToast({
                title: "退出项目失败",
                icon: "none",
              });
            });
        }
      },
    });
  },

  // 删除项目
  deleteProject: function (e) {
    const projectId = e.currentTarget.dataset.id;
    if (!projectId) {
      wx.showToast({
        title: "项目ID缺失",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "删除项目",
      content: "您确定要删除这个项目吗？此操作不可撤销。",
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: "正在删除...",
            mask: true,
          });

          wx.cloud
            .callFunction({
              name: "deleteProject",
              data: { projectId: projectId },
            })
            .then((res) => {
              wx.hideLoading();
              if (res.result.success) {
                wx.showToast({
                  title: "项目已删除",
                  icon: "success",
                });
                // 关闭当前页面并返回上一页
                wx.navigateBack();
              } else {
                wx.showToast({
                  title: res.result.error || "删除项目失败",
                  icon: "none",
                });
              }
            })
            .catch((err) => {
              wx.hideLoading();
              console.error("Failed to call deleteProject:", err);
              wx.showToast({
                title: "删除项目失败",
                icon: "none",
              });
            });
        }
      },
    });
  },

  // 添加 joinProject 方法
  joinProject: function (e) {
    const projectId = e.currentTarget.dataset.id;
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
          // 重新获取项目详情以更新参与人数和按钮状态
          this.fetchProjectDetail(projectId);
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
