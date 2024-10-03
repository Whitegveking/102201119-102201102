// pages/index/index.js
const db = wx.cloud.database();

Page({
  data: {
    projects: [],
    sortOption: "latest", // 默认排序方式，可选 'latest' 或 'participants'
    sortOptions: ["最新发布", "参与人数"], // 显示给用户的排序选项
  },

  onLoad: function () {
    this.fetchProjects();
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
        this.setData({
          projects: res.data,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
      });
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

  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/projectDetail/projectDetail?id=${id}`,
    });
  },
});
