Page({
    data: {
      project: {}
    },
    onLoad(options) {
      const projectId = options.id;
      // 这里可以根据 projectId 获取具体的项目数据
      const projects = [
        {id: 1, name: '项目A', description: '这是项目A的详细描述'},
        {id: 2, name: '项目B', description: '这是项目B的详细描述'}
      ];
      this.setData({
        project: projects.find(p => p.id == projectId)
      });
    }
  })
  