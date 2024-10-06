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
      this.setData({ openid }, () => {
        this.fetchProjects();
      });
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
            this.setData({ openid }, () => {
              this.fetchProjects();
            });
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

          // 日志输出，帮助调试
          console.log(`Project ID: ${project._id}`);
          console.log(`Type of createdAt: ${typeof project.createdAt}`);
          console.log(`CreatedAt content:`, project.createdAt);

          // 提取并格式化 createdAt
          const createdAtFormatted = this.formatCreatedAt(project.createdAt);

          console.log(`Formatted createdAt: ${createdAtFormatted}`);
          console.log(
            `Type of createdAtFormatted: ${typeof createdAtFormatted}`
          );

          // 构建新的项目对象
          return {
            _id: project._id,
            name: project.name,
            description: project.description,
            creator: project.creator,
            members: project.members,
            isCreator: isCreator,
            isMember: isMember,
            createdAtFormatted: createdAtFormatted, // 添加格式化后的时间
            participantCount: project.participantCount || 0, // 确保有参与人数
            // 其他需要的字段...
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

  // 提取并格式化 createdAt 字段
  formatCreatedAt: function (createdAt) {
    if (!createdAt) return "未知时间";

    // 直接解析字符串日期
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return "未知时间";

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleString("zh-CN", options);
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
