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
    openid: "", // 当前用户的 openid
    username: "", // 当前用户的用户名
    availableStatuses: ["进行中", "已完成", "已取消"], // 可选的项目状态
    selectedStatusIndex: 0, // 当前选中的项目状态索引
    selectedStatus: "进行中", // 当前选中的项目状态
    showStatusPicker: false, // 控制状态选择器的显示
  },

  onLoad: function (options) {
    const projectId = options.id;
    if (!projectId) {
      wx.showToast({
        title: "项目ID缺失",
        icon: "none",
      });
      return;
    }

    this.setData({ projectId });

    // 获取当前用户的 openid 和 username
    this.fetchUserInfo()
      .then(() => {
        // 获取项目详情
        this.fetchProjectDetail(projectId);
        // 获取聊天室信息并设置实时监听
        this.fetchChatroom(projectId);
      })
      .catch((err) => {
        console.error("获取用户信息失败:", err);
        wx.showToast({
          title: "获取用户信息失败",
          icon: "none",
        });
      });
  },

  onUnload: function () {
    // 取消实时监听
    if (this.data.messageWatcher) {
      this.data.messageWatcher.close();
    }
  },

  /**
   * 获取当前用户的 openid 和 username
   */
  fetchUserInfo: function () {
    return new Promise((resolve, reject) => {
      const openid = wx.getStorageSync("openid");
      const username = wx.getStorageSync("username");

      if (openid && username) {
        this.setData({ openid, username });
        resolve();
      } else {
        // 调用云函数获取 openid
        wx.cloud
          .callFunction({
            name: "getOpenId",
            data: {},
          })
          .then((res) => {
            const fetchedOpenid = res.result.openid;
            if (fetchedOpenid) {
              wx.setStorageSync("openid", fetchedOpenid);
              this.setData({ openid: fetchedOpenid });

              // 假设用户名已经在登录时获取并存储
              const fetchedUsername = wx.getStorageSync("username");
              if (fetchedUsername) {
                this.setData({ username: fetchedUsername });
                resolve();
              } else {
                wx.showToast({
                  title: "用户名未设置",
                  icon: "none",
                });
                reject("用户名未设置");
              }
            } else {
              wx.showToast({
                title: "获取 OpenID 失败",
                icon: "none",
              });
              reject("获取 OpenID 失败");
            }
          })
          .catch((err) => {
            console.error("调用 getOpenId 云函数失败:", err);
            wx.showToast({
              title: "获取用户信息失败",
              icon: "none",
            });
            reject(err);
          });
      }
    });
  },

  /**
   * 格式化时间戳为可读格式
   */
  formatTimestamp: function (timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  },

  /**
   * 调用云函数获取项目详情和创建者用户名
   */
  fetchProjectDetail: function (projectId) {
    wx.cloud
      .callFunction({
        name: "getProjects", // 确保云函数名称正确
        data: { projectId: projectId },
      })
      .then((res) => {
        if (res.result.success) {
          const project = res.result.project;
          const creatorUsername = res.result.creatorUsername;

          const openid = this.data.openid;
          const isCreator = project.creator === openid;
          const isMember = project.members && project.members.includes(openid);

          // 找到当前状态的索引
          const statusIndex = this.data.availableStatuses.indexOf(
            project.status
          );
          const selectedStatusIndex = statusIndex !== -1 ? statusIndex : 0;
          const selectedStatus =
            this.data.availableStatuses[selectedStatusIndex];

          this.setData({
            project: project,
            creatorUsername: creatorUsername,
            isCreator: isCreator,
            isMember: isMember,
            selectedStatusIndex: selectedStatusIndex,
            selectedStatus: selectedStatus,
          });
        } else {
          wx.showToast({
            title: res.result.error || "获取项目详情失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error("调用 getProjects 云函数失败:", err);
        wx.showToast({
          title: "获取项目详情失败",
          icon: "none",
        });
      });
  },

  /**
   * 获取聊天室数据并设置实时监听
   */
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
              console.error("创建聊天室失败:", err);
              wx.showToast({
                title: "创建聊天室失败",
                icon: "none",
              });
            });
        }
      })
      .catch((err) => {
        console.error("获取聊天室失败:", err);
        wx.showToast({
          title: "获取聊天室失败",
          icon: "none",
        });
      });
  },

  /**
   * 处理新消息输入
   */
  handleMessageInput: function (e) {
    this.setData({
      newMessage: e.detail.value,
    });
  },

  /**
   * 发送新消息
   */
  sendMessage: function () {
    const { newMessage, projectId, openid, username } = this.data;

    if (!newMessage.trim()) {
      wx.showToast({
        title: "消息不能为空",
        icon: "none",
      });
      return;
    }

    if (!username) {
      wx.showToast({
        title: "用户名未设置",
        icon: "none",
      });
      return;
    }

    const db = wx.cloud.database();
    const _ = db.command;

    const message = {
      senderOpenid: openid,
      senderUsername: username,
      content: newMessage.trim(),
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
        if (res.stats.updated > 0) {
          this.setData({
            newMessage: "",
          });
          wx.showToast({
            title: "发送成功",
            icon: "success",
          });
        } else {
          wx.showToast({
            title: "发送失败，请重试",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error("发送消息失败:", err);
        wx.showToast({
          title: "发送失败",
          icon: "none",
        });
      });
  },

  /**
   * 退出项目
   */
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
              console.error("退出项目失败:", err);
              wx.showToast({
                title: "退出项目失败",
                icon: "none",
              });
            });
        }
      },
    });
  },

  /**
   * 删除项目
   */
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
              console.error("删除项目失败:", err);
              wx.showToast({
                title: "删除项目失败",
                icon: "none",
              });
            });
        }
      },
    });
  },

  /**
   * 加入项目
   */
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
        console.error("加入项目失败:", err);
        wx.showToast({
          title: "加入失败",
          icon: "none",
        });
      });
  },

  /**
   * 打开状态选择器
   */
  openStatusPicker: function () {
    this.setData({
      showStatusPicker: true,
    });
  },

  /**
   * 关闭状态选择器
   */
  closeStatusPicker: function () {
    this.setData({
      showStatusPicker: false,
    });
  },

  /**
   * 阻止点击选择器内部关闭选择器
   */
  preventClose: function (e) {
    // 不做任何操作，阻止事件冒泡
  },

  /**
   * 处理状态选择
   */
  handleStatusChange: function (e) {
    const newStatusIndex = e.detail.value;
    const newStatus = this.data.availableStatuses[newStatusIndex];
    const selectedStatus = this.data.selectedStatus;

    if (newStatus === selectedStatus) {
      wx.showToast({
        title: "状态未变化",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "确认更改状态",
      content: `将项目状态从 "${selectedStatus}" 更改为 "${newStatus}"？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: "更新中...",
            mask: true,
          });

          wx.cloud
            .callFunction({
              name: "updateProjectStatus",
              data: {
                projectId: this.data.projectId,
                newStatus: newStatus,
              },
            })
            .then((res) => {
              wx.hideLoading();
              if (res.result.success) {
                wx.showToast({
                  title: "状态更新成功",
                  icon: "success",
                });
                // 更新本地项目状态
                this.setData({
                  selectedStatusIndex: newStatusIndex,
                  selectedStatus: newStatus,
                  "project.status": newStatus,
                  showStatusPicker: false,
                });
              } else {
                wx.showToast({
                  title: res.result.error || "状态更新失败",
                  icon: "none",
                });
              }
            })
            .catch((err) => {
              wx.hideLoading();
              console.error("状态更新失败:", err);
              wx.showToast({
                title: "状态更新失败",
                icon: "none",
              });
            });
        }
      },
    });
  },
});
