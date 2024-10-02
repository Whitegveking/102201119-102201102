// pages/profile/profile.js
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    user: {},
    createdProjects: [],
    joinedProjects: []
  },
  onLoad: function () {
    this.fetchUserInfo()
  },
  fetchUserInfo: function () {
    // 获取 openid
    wx.cloud.callFunction({
      name: 'getOpenId',
      data: {}
    }).then(res => {
      const openid = res.result.openid
      wx.setStorageSync('openid', openid)
      // 获取用户信息
      db.collection('Users').where({
        _openid: openid
      }).get().then(result => {
        if (result.data.length === 0) {
          // 新用户，添加到数据库
          wx.getUserProfile({
            desc: '用于展示用户信息',
            success: res => {
              db.collection('Users').add({
                data: {
                  nickName: res.userInfo.nickName,
                  avatarUrl: res.userInfo.avatarUrl,
                  projects: []
                }
              }).then(() => {
                this.setData({
                  user: res.userInfo
                })
                this.fetchProjects(openid)
              })
            },
            fail: err => {
              console.error(err)
              wx.showToast({
                title: '获取用户信息失败',
                icon: 'none'
              })
            }
          })
        } else {
          // 已存在用户
          this.setData({
            user: result.data[0]
          })
          this.fetchProjects(openid)
        }
      }).catch(err => {
        console.error(err)
      })
    }).catch(err => {
      console.error(err)
    })
  },
  fetchProjects: function (openid) {
    // Fetch created projects
    db.collection('Projects').where({
      creator: openid
    }).get().then(res => {
      this.setData({
        createdProjects: res.data
      })
    })
    // Fetch joined projects
    db.collection('Projects').where({
      members: openid
    }).get().then(res => {
      this.setData({
        joinedProjects: res.data
      })
    })
  },
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/projectDetail/projectDetail?id=${id}`
    })
  }
})
