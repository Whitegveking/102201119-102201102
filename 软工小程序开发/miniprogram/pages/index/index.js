// pages/index/index.js
Page({
    data: {
      projects: [],
      searchQuery: ''
    },
    onLoad: function () {
      this.fetchProjects()
    },
    fetchProjects: function () {
      wx.cloud.callFunction({
        name: 'getProjects',
        data: {}
      }).then(res => {
        this.setData({
          projects: res.result.data
        })
      }).catch(err => {
        console.error(err)
      })
    },
    onSearchInput: function (e) {
      this.setData({
        searchQuery: e.detail.value
      })
    },
    onSearch: function () {
      const query = this.data.searchQuery
      wx.cloud.callFunction({
        name: 'getProjects',
        data: {
          name: query
        }
      }).then(res => {
        this.setData({
          projects: res.result.data
        })
      }).catch(err => {
        console.error(err)
      })
    },
    goToDetail: function (e) {
      const id = e.currentTarget.dataset.id
      wx.navigateTo({
        url: `/pages/projectDetail/projectDetail?id=${id}`
      })
    }
  })
  