import request from '~/api/request';

Page({
  data: {
    searchValue: '',
    isColdStart: false, // 是否冷启动（新用户）
    isRefreshing: false,
    currentFilter: 'all',
    
    // 可选兴趣标签
    availableTags: [
      { name: '数据结构', selected: false },
      { name: '算法', selected: false },
      { name: '计算机网络', selected: false },
      { name: '操作系统', selected: false },
      { name: '数据库', selected: false },
      { name: '前端开发', selected: false },
      { name: '后端开发', selected: false },
      { name: '人工智能', selected: false },
      { name: '大数据', selected: false },
      { name: '云计算', selected: false },
    ],
    
    // 用户已选兴趣
    userInterests: [],
    
    // 今日推荐
    dailyRecommend: [
      {
        id: 1,
        title: '二叉树遍历算法详解',
        description: '掌握前序、中序、后序遍历的实现与应用',
        tag: '数据结构',
        tagColor: '#1890FF',
        difficulty: '中等',
        completedCount: 1234
      },
      {
        id: 2,
        title: '动态规划入门指南',
        description: '从斐波那契到背包问题，轻松掌握DP思想',
        tag: '算法',
        tagColor: '#52C41A',
        difficulty: '较难',
        completedCount: 892
      },
      {
        id: 3,
        title: 'HTTP协议深度解析',
        description: '理解Web通信的底层原理',
        tag: '计算机网络',
        tagColor: '#722ED1',
        difficulty: '简单',
        completedCount: 2156
      }
    ],
    
    // 热门内容
    hotContent: [
      { id: 4, title: 'JavaScript闭包详解', type: '文章', tag: '前端开发', hot: '2.3w' },
      { id: 5, title: 'MySQL索引优化实战', type: '视频', tag: '数据库', hot: '1.8w' },
      { id: 6, title: 'Redis缓存设计模式', type: '文章', tag: '后端开发', hot: '1.5w' },
      { id: 7, title: 'Docker容器化部署', type: '教程', tag: '云计算', hot: '1.2w' },
    ],
    
    // 猜你喜欢
    guessYouLike: [],
    
    dialog: {
      title: '确认',
      showCancelButton: true,
      message: '',
    },
    dialogShow: false,
  },

  onLoad() {
    this.checkColdStart();
    this.loadRecommendations();
  },

  onShow() {
    // 每次显示时刷新推荐
    if (!this.data.isColdStart) {
      this.loadRecommendations();
    }
  },

  // 检查是否冷启动（新用户）
  checkColdStart() {
    // 从本地存储检查用户是否已选择兴趣标签
    const interests = wx.getStorageSync('userInterests');
    if (!interests || interests.length === 0) {
      this.setData({ isColdStart: true });
    } else {
      this.setData({ 
        userInterests: interests,
        isColdStart: false 
      });
    }
  },

  // 加载推荐内容
  async loadRecommendations() {
    // TODO: 从后端加载真实推荐数据
    // const { getRecommendations } = require('../../api/request');
    // const data = await getRecommendations({ filter: this.data.currentFilter });
  },

  // 切换兴趣标签选择
  toggleTag(e) {
    const { index } = e.currentTarget.dataset;
    const tags = this.data.availableTags;
    tags[index].selected = !tags[index].selected;
    
    const selectedTags = tags.filter(t => t.selected).map(t => t.name);
    
    this.setData({ 
      availableTags: tags,
      selectedTags
    });
  },

  // 确认兴趣标签
  confirmInterests() {
    const selectedTags = this.data.availableTags
      .filter(t => t.selected)
      .map(t => t.name);
    
    // 保存到本地存储
    wx.setStorageSync('userInterests', selectedTags);
    
    this.setData({
      userInterests: selectedTags,
      isColdStart: false
    });
    
    wx.showToast({
      title: '设置成功',
      icon: 'success'
    });
    
    // 加载推荐内容
    this.loadRecommendations();
  },

  // 设置筛选条件
  setFilter(e) {
    const { filter } = e.currentTarget.dataset;
    this.setData({ currentFilter: filter });
    this.loadRecommendations();
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ isRefreshing: true });
    
    setTimeout(() => {
      this.loadRecommendations();
      this.setData({ isRefreshing: false });
    }, 1000);
  },

  // 跳转到详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/quiz/index?id=${id}`
    });
  },

  // 搜索提交
  handleSubmit(e) {
    const { value } = e.detail;
    if (!value) return;
    
    wx.showToast({
      title: `搜索: ${value}`,
      icon: 'none'
    });
  },

  // 取消搜索
  actionHandle() {
    this.setData({ searchValue: '' });
  },

  // 返回首页
  goBack() {
    wx.switchTab({ url: '/pages/home/index' });
  },

  confirm() {
    this.setData({ dialogShow: false });
  },

  close() {
    this.setData({ dialogShow: false });
  }
});
