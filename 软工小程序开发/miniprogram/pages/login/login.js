Page({
  data: {
    username: '',
    password: ''
  },
  // 登录按钮的逻辑
  login() {
    // 跳转到带有 tabBar 的首页
    wx.switchTab({
      url: '/pages/home/home'  // 确保路径正确
    });
  },
  // 注册按钮的逻辑
  register() {
    wx.navigateTo({
      url: '../register/register'
    });
  },
  // 忘记密码的逻辑
  forgotPassword() {
    wx.navigateTo({
      url: '../forgot-password/forgot-password'
    });
  }
})
