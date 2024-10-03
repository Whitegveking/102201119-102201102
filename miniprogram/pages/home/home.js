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
        });
    }
  },

  fetchProjects: function () {
    const db = wx.cloud.database();
    db.collection("Projects")
      .get()
      .then((res) => {
        const projects = res.data;
        // Fetch creator usernames for each project
        const promises = projects.map((project) => {
          return db
            .collection("Users")
            .where({
              _openid: project.creator,
            })
            .get()
            .then((userRes) => {
              project.creatorUsername =
                userRes.data.length > 0 ? userRes.data[0].username : "未知用户";
              return project;
            })
            .catch((err) => {
              console.error("Failed to fetch creator username:", err);
              project.creatorUsername = "未知用户";
              return project;
            });
        });

        Promise.all(promises).then((updatedProjects) => {
          this.setData({ projects: updatedProjects });
        });
      })
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
        wx.showToast({
          title: "获取项目失败",
          icon: "none",
        });
      });
  },

  joinProject: function (e) {
    const projectId = e.currentTarget.dataset.id;
    const db = wx.cloud.database();

    wx.showLoading({
      title: "正在加入...",
      mask: true,
    });

    wx.cloud
      .callFunction({
        name: "joinProject",
        data: {
          projectId: projectId,
        },
      })
      .then((res) => {
        wx.hideLoading();
        if (res.result.success) {
          wx.showToast({
            title: "加入成功",
            icon: "success",
          });
          // 更新本地数据
          const updatedProjects = this.data.projects.map((p) => {
            if (p._id === projectId) {
              p.members = p.members
                ? [...p.members, this.data.openid]
                : [this.data.openid];
            }
            return p;
          });
          this.setData({ projects: updatedProjects });
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

  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/projectDetail/projectDetail?id=${id}`,
    });
  },
});
