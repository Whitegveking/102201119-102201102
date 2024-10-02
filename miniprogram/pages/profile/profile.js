// pages/profile/profile.js
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    user: {},
    createdProjects: [],
    joinedProjects: [],
    openid: ''  // 增加 openid 字段用于保存当前用户的 openid
  },
  onLoad: function () {
    this.fetchUserInfo(); // 页面首次加载时获取用户信息
  },
  onShow: function () {
    const openid = this.data.openid || wx.getStorageSync('openid');
    if (openid) {
      console.log('Stored openid in onShow:', openid); // 调试输出
      this.fetchProjects(openid); // 每次页面显示时更新用户发布和加入的项目
    } else {
      console.warn('Failed to find openid in storage, fetching user info again');
      this.fetchUserInfo(); // 如果未找到 openid，重新获取用户信息
    }
  },
  fetchUserInfo: function () {
    // 获取 openid
    wx.cloud.callFunction({
      name: 'getOpenId',
      data: {}
    }).then(res => {
      const openid = res.result.openid;
      if (openid) {
        console.log('Fetched openid:', openid); // 调试输出
        wx.setStorageSync('openid', openid);
        this.setData({ openid });  // 存储 openid 到页面的数据中
        this.fetchProjects(openid); // 获取项目
      } else {
        console.error('Failed to fetch openid from cloud function result');
      }
    }).catch(err => {
      console.error('Failed to get OpenID:', err);
    });
  },
  fetchProjects: function (openid) {
    console.log('Using openid to fetch projects:', openid); // 调试输出

    db.collection('Projects').where({
      creator: openid
    }).get().then(res => {
      console.log('Fetched created projects:', res.data); // 打印获取到的数据
      this.setData({
        createdProjects: res.data
      });
    }).catch(err => {
      console.error('Failed to fetch created projects:', err);
    });

    db.collection('Projects').where({
      members: openid
    }).get().then(res => {
      console.log('Fetched joined projects:', res.data); // 打印获取到的数据
      this.setData({
        joinedProjects: res.data
      });
    }).catch(err => {
      console.error('Failed to fetch joined projects:', err);
    });
  },
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/projectDetail/projectDetail?id=${id}`
    });
  }
});
