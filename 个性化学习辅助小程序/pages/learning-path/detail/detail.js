// 知识图谱详情页逻辑

const knowledgeData = require('../../../../utils/knowledge-data.js');
const learningStorage = require('../../../../utils/learning-storage.js');
const app = getApp();

Page({
  data: {
    // 当前知识节点信息
    knowledgeNode: null,
    
    // 知识点数据（用于气泡图）
    knowledgePoints: [],
    
    // 布局配置
    layoutConfig: {
      a: 80,          // 螺旋线起始半径
      b: 30,          // 螺旋线增长系数
      angleStep: 0.8, // 角度步长（弧度）
      centerX: 375,   // 画布中心X坐标（750rpx基准）
      centerY: 300    // 画布中心Y坐标
    },
    
    // 弹窗控制
    showSummaryPopup: false,
    selectedBubble: null,
    
    // 加载状态
    loading: true
  },

  onLoad(options) {
    const { nodeId, module } = options;
    
    console.log('加载知识节点:', { nodeId, module });
    
    if (!nodeId || !module) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    
    this.setData({ loading: true });
    
    // 设置节点信息
    this.loadKnowledgeNode(nodeId, module);
    
    // 加载知识点数据
    this.loadKnowledgePoints(module, nodeId);
    
    // 监听系统信息（响应式适配）
    wx.getSystemInfo({
      success: (res) => {
        this.adaptLayout(res.windowWidth);
      }
    });
  },

  onShow() {
    // 页面显示时更新进度
    if (this.data.knowledgeNode) {
      this.updateNodeProgress();
    }
  },

  /**
   * 加载知识节点信息
   */
  async loadKnowledgeNode(nodeId, module) {
    // 这里应该从数据库或全局数据中获取节点详情
    // 目前先用模拟数据
    const nodeInfo = {
      id: nodeId,
      name: this.getNodeName(nodeId, module),
      module: module,
      level: this.getNodeLevel(nodeId),
      description: '这是关于' + this.getNodeName(nodeId, module) + '的详细学习内容，包含核心概念、实践案例和常见问题解答。',
      progress: 0,
      studyTime: '0分钟'
    };
    
    // 从本地存储获取学习进度
    const progress = learningStorage.getNodeProgress(nodeId);
    if (progress) {
      nodeInfo.progress = progress.percent || 0;
      nodeInfo.studyTime = progress.studyTime || '0分钟';
    }
    
    this.setData({ knowledgeNode: nodeInfo });
  },

  /**
   * 加载知识点数据
   */
  async loadKnowledgePoints(module, nodeId) {
    try {
      const points = await knowledgeData.getKnowledgePoints(module, nodeId);
      
      // 为每个知识点计算掌握程度
      const pointsWithAccuracy = await Promise.all(
        points.map(async (point) => {
          const accuracy = await knowledgeData.calculateAccuracy(point.name);
          return { ...point, accuracy };
        })
      );
      
      this.setData({
        knowledgePoints: pointsWithAccuracy,
        loading: false
      });
      
    } catch (error) {
      console.error('加载知识点失败:', error);
      
      // 使用默认数据
      const defaultPoints = knowledgeData.getDefaultKnowledgePoints(module);
      this.setData({
        knowledgePoints: defaultPoints,
        loading: false
      });
      
      wx.showToast({
        title: '使用本地数据',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 根据屏幕宽度自适应布局
   */
  adaptLayout(screenWidth) {
    const scale = screenWidth / 750;
    const config = { ...this.data.layoutConfig };
    
    config.a = Math.floor(config.a * scale);
    config.b = Math.floor(config.b * scale);
    config.centerX = Math.floor(config.centerX * scale);
    config.centerY = Math.floor(config.centerY * scale);
    
    this.setData({ layoutConfig: config });
  },

  /**
   * 气泡点击事件
   */
  onBubbleTap(e) {
    const { bubble } = e.detail;
    
    this.setData({
      selectedBubble: bubble,
      showSummaryPopup: true
    });
    
    // 记录查看历史
    learningStorage.recordView(bubble.id, bubble.name);
  },

  /**
   * 气泡长按事件
   */
  onBubbleLongPress(e) {
    const { bubble } = e.detail;
    
    wx.showModal({
      title: '召唤Anna',
      content: `是否要召唤Anna助手，详细讲解"${bubble.name}"这个知识点？`,
      confirmText: '召唤',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.goToAnnaChat(bubble);
        }
      }
    });
  },

  /**
   * 跳转到Anna对话页面
   */
  goToAnnaChat(bubble) {
    const question = encodeURIComponent(bubble.name);
    const module = encodeURIComponent(this.data.knowledgeNode.module);
    
    wx.navigateTo({
      url: `/pages/anna-chat/index?question=${question}&module=${module}`
    });
  },

  /**
   * 弹窗关闭事件
   */
  onSummaryPopupChange(e) {
    if (!e.detail.visible) {
      this.setData({ showSummaryPopup: false });
    }
  },

  /**
   * 关闭摘要弹窗
   */
  closeSummary() {
    this.setData({ showSummaryPopup: false });
  },

  /**
   * 向Anna询问这个知识点
   */
  askAnnaAboutThis() {
    if (!this.data.selectedBubble) return;
    
    this.setData({ showSummaryPopup: false });
    
    setTimeout(() => {
      this.goToAnnaChat(this.data.selectedBubble);
    }, 300);
  },

  /**
   * 开始学习这个知识点
   */
  startLearningThis() {
    if (!this.data.selectedBubble) return;
    
    wx.showToast({
      title: '开始学习: ' + this.data.selectedBubble.name,
      icon: 'none'
    });
    
    // 记录学习开始
    learningStorage.startLearning(this.data.selectedBubble.id);
    
    this.setData({ showSummaryPopup: false });
    
    // 跳转到具体学习内容页面（暂时用提示）
    setTimeout(() => {
      wx.showModal({
        title: '学习模式',
        content: '具体学习内容页面正在开发中，暂时请使用Anna助手问答模式。',
        showCancel: false
      });
    }, 500);
  },

  /**
   * 开始学习（整个节点）
   */
  startLearning() {
    const { knowledgeNode } = this.data;
    
    wx.showToast({
      title: '开始学习: ' + knowledgeNode.name,
      icon: 'none'
    });
    
    // 记录学习开始
    learningStorage.startLearning(knowledgeNode.id);
    
    // 这里应该跳转到具体的学习内容页面
    // 暂时用提示
    setTimeout(() => {
      wx.showModal({
        title: '学习模式',
        content: '具体学习内容页面正在开发中，暂时请使用Anna助手问答模式。',
        showCancel: false
      });
    }, 500);
  },

  /**
   * 开始测验
   */
  startQuiz() {
    const { knowledgeNode } = this.data;
    
    wx.showToast({
      title: '开始测验: ' + knowledgeNode.name,
      icon: 'none'
    });
    
    // 这里应该跳转到测验页面
    // 暂时用提示
    setTimeout(() => {
      wx.showModal({
        title: '测验模式',
        content: '测验功能正在开发中，敬请期待！',
        showCancel: false
      });
    }, 500);
  },

  /**
   * 标记为完成
   */
  markAsComplete() {
    const { knowledgeNode } = this.data;
    
    learningStorage.completeNode(knowledgeNode.id);
    
    wx.showToast({
      title: '标记完成',
      icon: 'success'
    });
    
    // 更新进度显示
    this.updateNodeProgress();
  },

  /**
   * 更新节点进度显示
   */
  updateNodeProgress() {
    const { knowledgeNode } = this.data;
    if (!knowledgeNode) return;
    
    const progress = learningStorage.getNodeProgress(knowledgeNode.id);
    if (progress) {
      this.setData({
        'knowledgeNode.progress': progress.percent || 0,
        'knowledgeNode.studyTime': progress.studyTime || '0分钟'
      });
    }
  },

  /**
   * 获取节点名称（模拟）
   */
  getNodeName(nodeId, module) {
    const nodeNames = {
      javascript: {
        'node_1': 'JavaScript基础',
        'node_2': '函数与作用域',
        'node_3': '对象与原型'
      },
      'html-css': {
        'node_1': 'HTML语义化',
        'node_2': 'CSS布局',
        'node_3': '响应式设计'
      }
    };
    
    return nodeNames[module]?.[nodeId] || '未知知识点';
  },

  /**
   * 获取节点难度（模拟）
   */
  getNodeLevel(nodeId) {
    const levels = {
      'node_1': 'easy',
      'node_2': 'medium',
      'node_3': 'hard'
    };
    
    return levels[nodeId] || 'medium';
  },

  /**
   * 根据难度获取颜色主题
   */
  getLevelColor(level) {
    const colorMap = {
      'easy': 'primary',
      'medium': 'warning',
      'hard': 'danger'
    };
    
    return colorMap[level] || 'default';
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  onUnload() {
    // 页面卸载时保存进度
    if (this.data.knowledgeNode) {
      learningStorage.saveProgress();
    }
  }
});