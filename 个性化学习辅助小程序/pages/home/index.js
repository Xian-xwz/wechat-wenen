import Message from 'tdesign-miniprogram/message/index';
import { getRadarOption, getTrendOption } from '~/utils/chart';

// 引入 ECharts（需要在微信开发者工具中构建 npm）
let echarts = null;
try {
  echarts = require('echarts-for-weixin');
} catch (e) {
  console.warn('[Dashboard] echarts-for-weixin 未加载，请先构建 npm');
}

Page({
  data: {
    isRefreshing: false,
    
    // 学习统计数据
    learningStats: {
      totalHours: 128,
      todayQuestions: 25,
      accuracy: 78,
      streakDays: 7
    },
    
    // 雷达图配置
    radarEc: {
      lazyLoad: true
    },
    
    // 折线图配置
    trendEc: {
      lazyLoad: true
    },
    
    // 今日任务列表
    dailyTasks: [
      {
        id: 1,
        title: '完成 10 道算法题',
        desc: '提升算法思维能力',
        points: 20,
        completed: false
      },
      {
        id: 2,
        title: '复习错题本',
        desc: '回顾昨日错题',
        points: 10,
        completed: true
      },
      {
        id: 3,
        title: '学习数据结构',
        desc: '二叉树与图论基础',
        points: 30,
        completed: false
      },
      {
        id: 4,
        title: '参与社区讨论',
        desc: '回答或提出一个问题',
        points: 15,
        completed: false
      }
    ]
  },

  onLoad() {
    // 页面加载时不立即初始化图表，等待组件准备就绪
  },

  onReady() {
    this.loadData();
    // 在 onReady 中初始化图表，确保组件已渲染
    this.initCharts();
  },

  // 初始化图表
  initCharts() {
    if (!echarts) {
      console.warn('[Dashboard] ECharts 未加载');
      return;
    }

    // 初始化雷达图
    this.radarChart = this.selectComponent('#radar-chart');
    if (this.radarChart) {
      this.initRadarChart();
    }

    // 初始化趋势图
    this.trendChart = this.selectComponent('#trend-chart');
    if (this.trendChart) {
      this.initTrendChart();
    }
  },

  // 初始化雷达图
  initRadarChart() {
    const option = getRadarOption(
      [80, 70, 90, 60, 85, 75], // 各维度掌握度
      [
        { name: '数据结构', max: 100 },
        { name: '算法', max: 100 },
        { name: '计算机网络', max: 100 },
        { name: '操作系统', max: 100 },
        { name: '数据库', max: 100 },
        { name: '前端开发', max: 100 }
      ]
    );
    
    this.radarChart.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);
      chart.setOption(option);
      return chart;
    });
  },

  // 初始化趋势图
  initTrendChart() {
    const option = getTrendOption(
      ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      [65, 78, 82, 70, 88, 92, 85], // 活跃度
      [72, 75, 80, 78, 85, 88, 82]  // 正确率
    );
    
    this.trendChart.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);
      chart.setOption(option);
      return chart;
    });
  },

  // 加载数据
  async loadData() {
    // TODO: 从后端加载真实数据
    // const { getLearningStats } = require('../../api/request');
    // const stats = await getLearningStats();
    // this.setData({ learningStats: stats });
  },

  // 刷新数据
  onRefresh() {
    if (this.data.isRefreshing) return;
    
    this.setData({ isRefreshing: true });
    
    // 模拟刷新
    setTimeout(() => {
      this.setData({
        isRefreshing: false,
        'learningStats.todayQuestions': Math.floor(Math.random() * 50) + 10
      });
      
      Message.success({
        context: this,
        content: '刷新成功',
        duration: 2000
      });
    }, 1500);
  },

  // 跳转到刷题页面
  goToQuiz() {
    wx.navigateTo({
      url: '/pages/quiz/index'
    });
  },

  // 跳转到错题本
  goToWrongBook() {
    wx.navigateTo({
      url: '/pages/wrongbook/index'
    });
  },

  // 跳转到学习路径
  goToLearningPath() {
    wx.navigateTo({
      url: '/pages/learning-path/index'
    });
  },

  // 跳转到推荐页面
  goToRecommend() {
    wx.switchTab({
      url: '/pages/search/index'
    });
  },

  // 切换任务完成状态
  toggleTask(e) {
    const { id } = e.currentTarget.dataset;
    const tasks = this.data.dailyTasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    
    this.setData({ dailyTasks: tasks });
    
    const task = tasks.find(t => t.id === id);
    Message.success({
      context: this,
      content: task.completed ? '任务完成！+' + task.points + '积分' : '任务已取消',
      duration: 2000
    });
  },

  // 查看全部任务
  viewAllTasks() {
    Message.info({
      context: this,
      content: '全部任务功能开发中',
      duration: 2000
    });
  }
});
