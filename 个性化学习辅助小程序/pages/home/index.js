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
    echartsInstance: echarts,  // ECharts 实例
    radarEc: {
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
    ],
    
    // 图表就绪标志
    chartsReady: false
  },

  onLoad() {
    // 检查 ECharts 是否加载成功
    if (echarts) {
      console.log('[Dashboard] ECharts 加载成功，版本:', echarts.version);
    } else {
      console.error('[Dashboard] ECharts 加载失败，请检查 npm 构建');
    }
  },

  onReady() {
    this.loadData();
    // 在 onReady 中初始化图表，确保组件已渲染
    this.initCharts();
  },

  // 初始化图表
  initCharts(retryCount = 0) {
    const maxRetries = 3;
    
    // 检查 echarts 是否已加载
    if (!echarts) {
      console.warn('[Dashboard] ECharts 未加载，图表无法初始化');
      return;
    }
    
    // 检查雷达图组件是否存在
    this.radarChart = this.selectComponent('#radar-chart');
    
    if (!this.radarChart) {
      if (retryCount < maxRetries) {
        console.warn(`[Dashboard] 雷达图组件未找到，延迟重试 (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => this.initCharts(retryCount + 1), 500);
      } else {
        console.error('[Dashboard] 雷达图组件初始化失败，已达最大重试次数');
      }
      return;
    }

    try {
      // 初始化雷达图
      this.initRadarChart();
      this.setData({ chartsReady: true });
    } catch (error) {
      console.error('[Dashboard] 图表初始化失败:', error);
    }
  },

  // 初始化雷达图
  initRadarChart() {
    if (!this.radarChart || !echarts) return;
    
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
    
    try {
      this.radarChart.init((canvas, width, height, dpr) => {
        if (!canvas) {
          console.warn('[Dashboard] Canvas 未就绪');
          return null;
        }
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        canvas.setChart(chart);
        chart.setOption(option);
        this.radarChartInstance = chart;  // 保存实例
        return chart;
      });
    } catch (error) {
      console.error('[Dashboard] 雷达图初始化失败:', error);
    }
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

  // 跳转到数据中心
  goToDataCenter() {
    wx.navigateTo({
      url: '/pages/data-center/index'
    });
  },

  // 跳转到Anna AI对话页面
  goToAnnaChat() {
    wx.navigateTo({
      url: '/pages/anna-chat/index'
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
  },

  // 页面卸载时清理图表实例
  onUnload() {
    // 销毁图表实例
    if (this.radarChartInstance) {
      this.radarChartInstance.dispose();
      this.radarChartInstance = null;
    }

  }
});
