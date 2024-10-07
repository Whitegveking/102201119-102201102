// Description: 二维码弹窗组件
Component({
  data: {
    modalVisible: false,
  },
  // 组件属性
  properties: {
    visible: Boolean,
    imageSrc: String,
  },
  // 监听属性
  observers: {
    visible: function (visible) {
      this.setData({
        modalVisible: visible
      });
    },
  },
  // 组件生命周期
  methods: {
    onClose() {
      this.setData({ modalVisible: false });
    }
  }
});
