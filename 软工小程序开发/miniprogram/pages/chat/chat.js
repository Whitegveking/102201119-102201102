// pages/chat/chat.js
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    projectId: '',
    messages: [],
    inputMessage: '',
    user: {}
  },
  onLoad: function (options) {
    const projectId = options.projectId
    this.setData({ projectId })
    this.fetchUserInfo()
    this.fetchMessages()
    this.listenMessages()
  },
  fetchUserInfo: function () {
    const openid = wx.getStorageSync('openid')
    db.collection('Users').where({
      _openid: openid
    }).get().then(res => {
      if (res.data.length > 0) {
        this.setData({
          user: res.data[0]
        })
      }
    }).catch(err => {
      console.error(err)
    })
  },
  fetchMessages: function () {
    db.collection('Messages').where({
      projectId: this.data.projectId
    }).orderBy('timestamp', 'asc').get().then(res => {
      this.setData({
        messages: res.data
      })
      this.scrollToBottom()
    })
  },
  listenMessages: function () {
    const dbInstance = wx.cloud.database()
    const messageListener = dbInstance.collection('Messages').where({
      projectId: this.data.projectId
    }).watch({
      onChange: snapshot => {
        if (snapshot.docChanges.length > 0) {
          const newMessages = snapshot.docChanges.map(change => change.doc)
          this.setData({
            messages: this.data.messages.concat(newMessages)
          })
          this.scrollToBottom()
        }
      },
      onError: function (err) {
        console.error(err)
      }
    })
    this.setData({
      messageListener
    })
  },
  sendMessage: function (e) {
    const content = e.detail.value.message.trim()
    if (!content) return
    const openid = wx.getStorageSync('openid')
    const senderName = this.data.user.nickName || '匿名'

    db.collection('Messages').add({
      data: {
        projectId: this.data.projectId,
        sender: openid,
        senderName,
        content,
        timestamp: new Date()
      }
    }).then(() => {
      this.setData({
        inputMessage: ''
      })
    }).catch(err => {
      console.error(err)
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      })
    })
  },
  onInputChange: function (e) {
    this.setData({
      inputMessage: e.detail.value
    })
  },
  scrollToBottom: function () {
    wx.pageScrollTo({
      scrollTop: 99999,
      duration: 300
    })
  },
  onUnload: function () {
    if (this.data.messageListener) {
      this.data.messageListener.close()
    }
  }
})
