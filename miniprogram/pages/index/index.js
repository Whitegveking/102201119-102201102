// pages/index/index.js

const db = wx.cloud.database();

Page({
  data: {
    projects: [],
    openid: "",
    sortOption: "latest", // 默认排序方式，可选 'latest' 或 'participants'
    sortOptions: ["最新发布", "参与人数"], // 显示给用户的排序选项
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

  fetchProjects: function () {
    let query = db.collection("Projects");

    if (this.data.sortOption === "latest") {
      query = query.orderBy("createdAt", "desc");
    } else if (this.data.sortOption === "participants") {
      query = query.orderBy("participantCount", "desc");
    }

    query
      .get()
      .then((res) => {
        const projects = res.data.map((project) => {
          const isCreator = project.creator === this.data.openid;
          const isMember =
            project.members && project.members.includes(this.data.openid);

          // 提取并格式化 createdAt
          const createdAtFormatted = this.formatCreatedAt(project.createdAt);

          return {
            _id: project._id,
            name: project.name,
            description: project.description,
            creator: project.creator,
            members: project.members,
            isCreator: isCreator,
            isMember: isMember,
            status: project.status, // 添加 status 字段
            createdAtFormatted: createdAtFormatted, // 添加格式化后的时间
            participantCount: project.participantCount || 0, // 确保有参与人数
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

  // 根据状态返回图标类型
  getStatusIcon: function (status) {
    switch (status) {
      case "招募中":
        return "success";
      case "已完成":
        return "checkmark";
      case "暂停":
        return "warn";
      default:
        return "info";
    }
  },

  // 根据状态返回颜色
  getStatusColor: function (status) {
    switch (status) {
      case "招募中":
        return "#1aad19"; // 绿色
      case "已完成":
        return "#4caf50"; // 深绿色
      case "暂停":
        return "#ff9800"; // 橙色
      default:
        return "#3498db"; // 蓝色
    }
  },

  // 处理排序选项改变
  handleSortChange: function (e) {
    const selectedIndex = e.detail.value;
    const selectedSort = this.data.sortOptions[selectedIndex];
    const sortOption = selectedSort === "最新发布" ? "latest" : "participants";
    this.setData(
      {
        sortOption: sortOption,
      },
      () => {
        this.fetchProjects();
      }
    );
  },

  // 处理“加入项目”按钮点击
  joinProject: function (e) {
    // 添加日志以调试
    console.log("joinProject event object:", e);

    // 确保 e 是事件对象
    if (!e || !e.currentTarget) {
      console.error("事件对象不存在或格式不正确");
      wx.showToast({
        title: "操作失败，请稍后再试",
        icon: "none",
      });
      return;
    }

    const projectId = e.currentTarget.dataset.id;
    if (!projectId) {
      wx.showToast({
        title: "项目ID缺失",
        icon: "none",
      });
      return;
    }

    // 防止事件冒泡
    if (e.stopPropagation && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    } else {
      console.warn("e.stopPropagation 不是一个函数");
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
