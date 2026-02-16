// 自适应学习路径页面
Page({
  data: {
    progress: 35,
    completedNodes: 2,
    totalNodes: 6,
    suggestion: '建议先完成"JavaScript基础"节点，再进行"DOM操作"学习',

    // 路径节点
    pathNodes: [
      {
        id: 1,
        title: 'HTML/CSS 基础',
        description: '掌握HTML标签、CSS选择器、盒模型等基础知识',
        duration: '预计 5 小时',
        resourceCount: 12,
        status: 'completed',
        prerequisites: []
      },
      {
        id: 2,
        title: 'JavaScript 基础',
        description: '学习变量、函数、条件语句、循环等JS核心概念',
        duration: '预计 10 小时',
        resourceCount: 20,
        status: 'completed',
        prerequisites: ['HTML/CSS 基础']
      },
      {
        id: 3,
        title: 'DOM 操作',
        description: '掌握DOM查询、修改、事件处理等操作',
        duration: '预计 6 小时',
        resourceCount: 15,
        status: 'current',
        prerequisites: ['JavaScript 基础']
      },
      {
        id: 4,
        title: 'Vue.js 基础',
        description: '学习Vue框架的核心概念：组件、指令、生命周期等',
        duration: '预计 12 小时',
        resourceCount: 25,
        status: 'pending',
        prerequisites: ['DOM 操作']
      },
      {
        id: 5,
        title: '前端工程化',
        description: '掌握Webpack、Git、npm等工程化工具',
        duration: '预计 8 小时',
        resourceCount: 18,
        status: 'pending',
        prerequisites: ['Vue.js 基础']
      },
      {
        id: 6,
        title: '项目实战',
        description: '综合运用所学知识完成一个完整项目',
        duration: '预计 20 小时',
        resourceCount: 8,
        status: 'pending',
        prerequisites: ['前端工程化']
      }
    ]
  },

  onLoad() {
    this.calculateProgress();
  },

  // 计算进度
  calculateProgress() {
    const { pathNodes } = this.data;
    const completedCount = pathNodes.filter(n => n.status === 'completed').length;
    const currentCount = pathNodes.filter(n => n.status === 'current').length;
    const total = pathNodes.length;

    // 已完成算100%，当前进行中的算50%
    const progress = Math.round(((completedCount + currentCount * 0.5) / total) * 100);

    this.setData({
      progress,
      completedNodes: completedCount,
      totalNodes: total
    });
  },

  // 查看节点详情
  viewNodeDetail(e) {
    const { id } = e.currentTarget.dataset;
    const node = this.data.pathNodes.find(n => n.id === id);

    wx.showModal({
      title: node.title,
      content: `${node.description}\n\n学习时长：${node.duration}\n学习资源：${node.resourceCount}个`,
      showCancel: false
    });
  },

  // 开始学习
  startLearning(e) {
    const { id } = e.currentTarget.dataset;
    const node = this.data.pathNodes.find(n => n.id === id);

    wx.showToast({
      title: `开始学习：${node.title}`,
      icon: 'none'
    });

    // TODO: 跳转到学习资源页面
    // wx.navigateTo({ url: `/pages/learning/resources?id=${id}` });
  },

  // 复习节点
  reviewNode(e) {
    const { id } = e.currentTarget.dataset;
    const node = this.data.pathNodes.find(n => n.id === id);

    wx.showToast({
      title: `复习：${node.title}`,
      icon: 'none'
    });
  },

  // 跳过节点
  skipNode(e) {
    wx.showModal({
      title: '提示',
      content: '确定要跳过这个节点吗？建议按顺序学习以获得最佳效果。',
      success: (res) => {
        if (res.confirm) {
          // 跳过逻辑
          wx.showToast({
            title: '已跳过',
            icon: 'success'
          });
        }
      }
    });
  },

  // 生成补救路径
  generateRemedialPath() {
    // 检测前置知识掌握情况
    const currentNode = this.data.pathNodes.find(n => n.status === 'current');
    if (!currentNode || !currentNode.prerequisites) return;

    const unmasteredPrereqs = currentNode.prerequisites.filter(prereq => {
      const prereqNode = this.data.pathNodes.find(n => n.title === prereq);
      return prereqNode && prereqNode.status !== 'completed';
    });

    if (unmasteredPrereqs.length > 0) {
      this.setData({
        suggestion: `建议先复习：${unmasteredPrereqs.join('、')}，再进行"${currentNode.title}"学习`
      });
    }
  }
});
