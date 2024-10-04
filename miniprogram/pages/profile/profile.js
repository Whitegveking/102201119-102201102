// pages/profile/profile.js

const db = wx.cloud.database();

Page({
  data: {
    user: {},
    createdProjects: [],
    joinedProjects: [],
    openid: "",
    showUsernameModal: false, // 控制设置用户名的弹窗
    showEditUsernameModal: false, // 控制修改用户名的弹窗
    usernameInput: "", // 用户输入的用户名（设置）
    newUsername: "", // 用户输入的新用户名（修改）
  },

  onLoad: function () {
    this.fetchUserInfo(); // 页面首次加载时获取用户信息
  },

  onShow: function () {
    let openid = this.data.openid || wx.getStorageSync("openid");
    if (openid) {
      console.log("Stored openid in onShow:", openid); // 调试输出
      this.fetchProjects(openid); // 每次页面显示时更新用户发布和加入的项目
    } else {
      console.warn(
        "Failed to find openid in storage, fetching user info again"
      );
      this.fetchUserInfo(); // 如果未找到 openid，重新获取用户信息
    }
  },

  // 获取用户信息和 openid
  fetchUserInfo: function () {
    // 获取 openid
    wx.cloud
      .callFunction({
        name: "getOpenId",
        data: {},
      })
      .then((res) => {
        const openid = res.result.openid;
        if (openid) {
          console.log("Fetched openid:", openid); // 调试输出
          wx.setStorageSync("openid", openid);
          this.setData({ openid });
          this.fetchProjects(openid); // 获取项目
          this.getUserInfo(openid);
        } else {
          console.error("Failed to fetch openid from cloud function result");
        }
      })
      .catch((err) => {
        console.error("Failed to get OpenID:", err);
      });
  },

  // 获取用户在 Users 集合中的信息
  getUserInfo: function (openid) {
    db.collection("Users")
      .where({
        _openid: openid,
      })
      .get()
      .then((result) => {
        if (result.data.length === 0) {
          // 新用户，显示设置用户名的弹窗
          this.setData({
            showUsernameModal: true,
          });
        } else {
          // 已存在用户
          this.setData({
            user: result.data[0],
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user info:", err);
      });
  },

  // 获取昵称的首字母
  getInitial: function (nickName) {
    if (!nickName) return "";
    return nickName.charAt(0).toUpperCase();
  },

  // 处理设置用户名输入
  handleUsernameInput: function (e) {
    this.setData({
      usernameInput: e.detail.value,
    });
  },

  // 打开修改用户名的弹窗
  openEditUsernameModal: function () {
    console.log("openEditUsernameModal called"); // 添加日志
    this.setData({
      showEditUsernameModal: true,
      newUsername: this.data.user.username || "", // 预填充当前用户名
    });
  },

  // 处理修改用户名输入
  handleEditUsernameInput: function (e) {
    this.setData({
      newUsername: e.detail.value,
    });
  },

  // 提交设置用户名（新用户）
  submitUsername: async function () {
    const username = this.data.usernameInput.trim();
    if (!username) {
      wx.showToast({
        title: "用户名不能为空",
        icon: "none",
      });
      return;
    }

    // 前端添加用户名格式验证（与云函数一致）
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      wx.showToast({
        title: "用户名必须为3-20个字符，且只能包含字母、数字和下划线",
        icon: "none",
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: "正在设置...",
      mask: true,
    });

    try {
      // 获取用户的微信个人信息（仅限用户主动触发）
      const resProfile = await wx.getUserProfile({
        desc: "用于展示用户信息",
      });

      // 调用云函数检查用户名是否存在
      const resCheck = await wx.cloud.callFunction({
        name: "checkUsername",
        data: {
          username: username,
        },
      });

      if (resCheck.result.success) {
        if (resCheck.result.exists) {
          wx.hideLoading();
          wx.showToast({
            title: "用户名已存在",
            icon: "none",
          });
        } else {
          // 添加新用户信息
          await db.collection("Users").add({
            data: {
              nickName: resProfile.userInfo.nickName,
              avatarUrl: resProfile.userInfo.avatarUrl,
              username: username,
              projects: [],
            },
          });

          // 更新本地缓存中的用户名
          wx.setStorageSync("username", username);

          this.setData({
            user: {
              nickName: resProfile.userInfo.nickName,
              avatarUrl: resProfile.userInfo.avatarUrl,
              username: username,
            },
            showUsernameModal: false,
          });

          wx.hideLoading();
          wx.showToast({
            title: "用户名设置成功",
            icon: "success",
          });
        }
      } else {
        wx.hideLoading();
        wx.showToast({
          title: resCheck.result.error || "检查用户名失败",
          icon: "none",
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error("Error during submitUsername:", err);
      wx.showToast({
        title: "设置失败",
        icon: "none",
      });
    }
  },

  // 提交修改用户名（已存在用户）
  submitEditUsername: async function () {
    console.log("submitEditUsername called with:", this.data.newUsername); // 添加日志
    const newUsername = this.data.newUsername.trim();
    if (!newUsername) {
      wx.showToast({
        title: "新用户名不能为空",
        icon: "none",
      });
      return;
    }

    // 前端添加用户名格式验证（与云函数一致）
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
      wx.showToast({
        title: "用户名必须为3-20个字符，且只能包含字母、数字和下划线",
        icon: "none",
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: "正在更新...",
      mask: true,
    });

    try {
      // 调用云函数更新用户名
      const res = await wx.cloud.callFunction({
        name: "updateUsername",
        data: {
          newUsername: newUsername,
        },
      });

      if (res.result.success) {
        if (res.result.exists) {
          wx.hideLoading();
          wx.showToast({
            title: "用户名已存在",
            icon: "none",
          });
        } else {
          // 更新本地缓存中的用户名
          wx.setStorageSync("username", newUsername);

          // 更新用户数据
          this.setData({
            "user.username": newUsername,
            showEditUsernameModal: false,
          });
          wx.hideLoading();
          wx.showToast({
            title: "用户名更新成功",
            icon: "success",
          });
        }
      } else {
        wx.hideLoading();
        wx.showToast({
          title: res.result.error || "更新失败",
          icon: "none",
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error("Failed to call updateUsername:", err);
      wx.showToast({
        title: "更新失败",
        icon: "none",
      });
    }
  },

  // 取消设置用户名
  cancelUsername: function () {
    this.setData({
      showUsernameModal: false,
    });
  },

  // 取消修改用户名
  closeEditUsernameModal: function () {
    this.setData({
      showEditUsernameModal: false,
    });
  },

  // 获取用户发布和加入的项目
  fetchProjects: function (openid) {
    console.log("Using openid to fetch projects:", openid); // 调试输出

    // 查询用户发布的项目
    db.collection("Projects")
      .where({
        creator: openid,
      })
      .get()
      .then((res) => {
        console.log("Fetched created projects:", res.data); // 打印获取到的数据
        this.setData({
          createdProjects: res.data,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch created projects:", err);
      });

    // 查询用户参与的项目
    db.collection("Projects")
      .where({
        members: openid,
      })
      .get()
      .then((res) => {
        console.log("Fetched joined projects:", res.data); // 打印获取到的数据
        this.setData({
          joinedProjects: res.data,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch joined projects:", err);
      });
  },

  // 跳转到项目详情页
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/projectDetail/projectDetail?id=${id}`,
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
                // 重新获取项目列表
                this.fetchProjects(this.data.openid);
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
                // 重新获取项目列表
                this.fetchProjects(this.data.openid);
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
});
