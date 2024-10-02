// pages/projectDetail/projectDetail.js
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    project: {},
    members: [],
    isMember: false,
    projectId: ''
  },
  onLoad: function (options) {
    const id = options.id
    this.setData({ projectId: id })
    this.fetchProject(id)
  },
  fetchProject: function (id) {
    db.collection('Projects').doc(id).get().then(res => {
      this.setData({
        project: res.data
      })
      this.checkMembership(res.data.members)
      this.fetchMembers(res.data.members)
    }).catch(err => {
      console.error(err)
    })
  },
  checkMembership: function (members) {
    const openid = wx.getStorageSync('openid')
    if (members.includes(openid)) {
      this.setData({
        isMember: true
      })
    }
  },
  fetchMembers: function (members) {
    if (members.length === 0) {
      this.setData({ members: [] })
      return
    }
    db.collection('Users').where({
      _openid: _.in(members)
    }).get().then(res => {
      this.setData({
        members: res.data
      })
    }).catch(err => {
      console.error(err)
    })
  },
  joinProject: function () {
    const project = this.data.project
    wx.cloud.callFunction({
      name: 'joinProject',
      data: {
        projectId: project._id
      }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({
          title: '加入成功',
          icon: 'success'
        })
        this.setData({
          isMember: true
        })
        this.fetchProject(project._id)
      } else {
        wx.showToast({
          title: res.result.message || '加入失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error(err)
      wx.showToast({
        title: '加入失败',
        icon: 'none'
      })
    })
  },
  goToChat: function () {
    wx.navigateTo({
      url: `/pages/chat/chat?projectId=${this.data.project._id}`
    })
  }
})
