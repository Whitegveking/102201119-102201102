// pages/publish/publish.js
Page({
    data: {
      statusList: ['招募中', '进行中', '已完结'],
      status: '招募中'
    },
    onStatusChange: function (e) {
      this.setData({
        status: this.data.statusList[e.detail.value]
      })
    },
    onSubmit: function (e) {
      const { name, description, skills } = e.detail.value
      const skillArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill)
      wx.cloud.callFunction({
        name: 'addProject',
        data: {
          name,
          description,
          skills: skillArray,
          status: this.data.status
        }
      }).then(res => {
        if (res.result.success) {
          wx.showToast({
            title: '发布成功',
            icon: 'success'
          })
          wx.navigateBack()
        } else {
          wx.showToast({
            title: res.result.message || '发布失败',
            icon: 'none'
          })
        }
      }).catch(err => {
        console.error(err)
        wx.showToast({
          title: '发布失败',
          icon: 'none'
        })
      })
    }
  })
  