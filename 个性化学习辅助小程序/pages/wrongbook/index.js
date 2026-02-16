// 错题本页面
Page({
  data: {
    currentFilter: 'all',
    isRefreshing: false,
    knowledgePoints: ['数据结构', '算法', '计算机网络', '操作系统', '数据库'],

    // 错题列表
    wrongList: [
      {
        id: 1,
        knowledgePoint: '数据结构',
        title: '以下哪种数据结构最适合实现LRU缓存？',
        options: ['数组 + 二分查找', '哈希表 + 双向链表', '二叉搜索树', '堆'],
        wrongAnswer: 0,
        correct: 1,
        wrongTime: '2024-01-15',
        errorCount: 2,
        isReviewed: false
      },
      {
        id: 2,
        knowledgePoint: '算法',
        title: '快速排序的平均时间复杂度是？',
        options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
        wrongAnswer: 2,
        correct: 1,
        wrongTime: '2024-01-14',
        errorCount: 1,
        isReviewed: true
      },
      {
        id: 3,
        knowledgePoint: '数据结构',
        title: '二叉树的前序遍历顺序是？',
        options: ['左-根-右', '根-左-右', '左-右-根', '右-根-左'],
        wrongAnswer: 0,
        correct: 1,
        wrongTime: '2024-01-13',
        errorCount: 3,
        isReviewed: false
      }
    ],
    // 筛选后的列表
    filteredList: []
  },

  onLoad() {
    this.loadWrongBook();
  },

  onShow() {
    // 每次显示时刷新
    this.loadWrongBook();
  },

  // 加载错题本
  loadWrongBook() {
    // 从本地存储加载
    const wrongBook = wx.getStorageSync('wrongBook') || [];
    if (wrongBook.length > 0) {
      this.setData({ wrongList: wrongBook });
    }

    // 计算统计
    this.calculateStats();
    // 更新筛选列表
    this.updateFilteredList();
  },

  // 计算统计
  calculateStats() {
    const { wrongList } = this.data;
    const masteredCount = wrongList.filter(item => item.isReviewed).length;
    const needReviewCount = wrongList.filter(item => !item.isReviewed).length;

    this.setData({
      masteredCount,
      needReviewCount
    });
  },

  // 设置筛选
  setFilter(e) {
    const { filter } = e.currentTarget.dataset;
    this.setData({ 
      currentFilter: filter 
    }, () => {
      // 筛选条件更新后，重新计算列表
      this.updateFilteredList();
    });
  },

  // 筛选后的列表
  getFilteredList() {
    const { wrongList, currentFilter } = this.data;
    if (currentFilter === 'all') {
      return wrongList;
    }
    return wrongList.filter(item => item.knowledgePoint === currentFilter);
  },

  // 更新筛选后的列表
  updateFilteredList() {
    const filteredList = this.getFilteredList();
    this.setData({ filteredList });
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ isRefreshing: true });

    setTimeout(() => {
      this.loadWrongBook();
      this.setData({ isRefreshing: false });
    }, 1000);
  },

  // 查看详情
  viewDetail(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.wrongList.find(w => w.id === id);

    wx.showModal({
      title: '题目详情',
      content: `${item.title}\n\n你的答案：${item.options[item.wrongAnswer]}\n正确答案：${item.options[item.correct]}`,
      showCancel: false
    });
  },

  // 标记为已复习
  markAsReviewed(e) {
    const { id } = e.currentTarget.dataset;
    const wrongList = this.data.wrongList.map(item => {
      if (item.id === id) {
        return { ...item, isReviewed: !item.isReviewed };
      }
      return item;
    });

    this.setData({ wrongList });
    wx.setStorageSync('wrongBook', wrongList);
    this.calculateStats();
    this.updateFilteredList();

    wx.showToast({
      title: '已更新状态',
      icon: 'success'
    });
  },

  // 去刷题
  goToQuiz() {
    wx.navigateTo({
      url: '/pages/quiz/index'
    });
  }
});
