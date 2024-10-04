// pages/home/home.js
Page({
  data: {
    projects: [],
    openid: "",
  },

  onLoad: function () {
    this.fetchOpenId();
  },

  onShow: function () {
    this.fetchProjects();
  },

  // 获取当前用户的 openid
  fetchOpenId: function () {
    const openid = wx.getStorageSync("openid");
    if (openid) {
      this.setData({ openid });
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
            this.fetchProjects();
          }
        })
        .catch((err) => {
          console.error("Failed to fetch openid:", err);
          wx.showToast({
            title: "获取用户信息失败",
            icon: "none",
          });
        });
    }
  },

  // 获取所有项目
  fetchProjects: function () {
    const db = wx.cloud.database();
    db.collection("Projects")
      .get()
      .then((res) => {
        const projects = res.data.map((project) => {
          const isCreator = project.creator === this.data.openid;
          const isMember =
            project.members && project.members.includes(this.data.openid);
          return {
            ...project,
            isCreator,
            isMember,
          };
        });
        this.setData({ projects });
      })
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
        wx.showToast({
          title: "获取项目失败",
          icon: "none",
        });
      });
  },

  // 处理“加入项目”按钮点击
  joinProject: function (e) {
    const projectId = e.currentTarget.dataset.id;
    if (!projectId) {
      wx.showToast({
        title: "项目ID缺失",
        icon: "none",
      });
      return;
    }

    // Prevent event bubbling to project item click
    e.stopPropagation();

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
          // 重新获取项目列表以更新参与人数和按钮状态
          this.fetchProjects();
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

  // 跳转到项目详情页
  goToDetail: function (e) {
    const projectId = e.currentTarget.dataset.id;
    if (!projectId) {
      wx.showToast({
        title: "项目ID缺失",
        icon: "none",
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/projectDetail/projectDetail?id=${projectId}`,
    });
  },
});
