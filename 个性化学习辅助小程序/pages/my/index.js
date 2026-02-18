import request from '~/api/request';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    personalInfo: {},
    
    // 用户等级和积分
    userLevel: 5,
    userPoints: 1250,
    
    // 学习统计
    learningStats: {
      totalDays: 28,
      totalQuestions: 356,
      masteredPoints: 42
    },
    
    // 学习功能入口
    learningGridList: [
      {
        name: '在线刷题',
        icon: 'edit',
        type: 'quiz',
        url: '/pages/quiz/index',
      },
      {
        name: '错题本',
        icon: 'file-copy',
        type: 'wrongbook',
        url: '/pages/wrongbook/index',
      },
      {
        name: '学习路径',
        icon: 'chart',
        type: 'learningPath',
        url: '/pages/learning-path/index',
      },
      {
        name: '数据中心',
        icon: 'data',
        type: 'dataCenter',
        url: '/pages/data-center/index',
      },
    ],

    // 兴趣标签
    interestTags: ['数据结构', '算法', '前端开发', '计算机网络'],

    // 设置列表
    settingList: [
      { name: '兴趣标签', icon: 'tag', type: 'interests' },
      { name: '联系客服', icon: 'service', type: 'service' },
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],
  },

  onLoad() {
    this.loadUserData();
  },

  async onShow() {
    const Token = wx.getStorageSync('access_token');
    const personalInfo = await this.getPersonalInfo();

    if (Token) {
      this.setData({
        isLoad: true,
        personalInfo,
      });
    }
  },

  // 加载用户数据（模拟数据）
  loadUserData() {
    // TODO: 从后端加载真实数据
  },

  async getPersonalInfo() {
    const info = await request('/api/genPersonalInfo').then((res) => res.data.data);
    return info;
  },

  onLogin(e) {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  onNavigateTo() {
    wx.navigateTo({ url: `/pages/my/info-edit/index` });
  },

  // 学习功能入口点击
  onLearningItemClick(e) {
    const { url, name } = e.currentTarget.dataset.data;
    if (url) {
      wx.navigateTo({ url });
    } else {
      this.onShowToast('#t-toast', `${name} 功能开发中`);
    }
  },

  // 编辑兴趣标签
  editInterests() {
    this.onShowToast('#t-toast', '编辑兴趣标签功能开发中');
  },

  onEleClick(e) {
    const { name, url } = e.currentTarget.dataset.data;
    if (url) return;
    this.onShowToast('#t-toast', name);
  },
});
