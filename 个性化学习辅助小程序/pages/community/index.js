// 知识社区列表页
Page({
  data: {
    currentFilter: 'all',
    isRefreshing: false,
    isLoadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    
    // 帖子列表
    postList: [
      {
        id: 1,
        authorName: '算法小王子',
        authorAvatar: '',
        publishTime: '2小时前',
        tag: '问答',
        title: '如何理解动态规划中的状态转移方程？',
        summary: '最近在刷DP题目，总是搞不清状态转移方程怎么写，有没有大佬能讲讲思路？',
        images: [],
        likeCount: 23,
        commentCount: 8,
        isLiked: false
      },
      {
        id: 2,
        authorName: '前端爱好者',
        authorAvatar: '',
        publishTime: '5小时前',
        tag: '笔记',
        title: 'Vue3 组合式 API 学习笔记',
        summary: '整理了Vue3 Composition API的核心概念和使用技巧，分享给大家...',
        images: [],
        likeCount: 56,
        commentCount: 12,
        isLiked: true
      },
      {
        id: 3,
        authorName: '全栈工程师',
        authorAvatar: '',
        publishTime: '1天前',
        tag: '分享',
        title: '推荐几个优质的学习资源网站',
        summary: '整理了平时常用的学习网站，包括算法、前端、后端等各个领域...',
        images: [],
        likeCount: 128,
        commentCount: 34,
        isLiked: false
      },
      {
        id: 4,
        authorName: '数据结构小白',
        authorAvatar: '',
        publishTime: '1天前',
        tag: '问答',
        title: '二叉树遍历的递归和非递归实现',
        summary: '请问各位大佬，二叉树的前序遍历非递归实现中，为什么要用栈？',
        images: [],
        likeCount: 15,
        commentCount: 6,
        isLiked: false
      }
    ]
  },

  onLoad() {
    this.loadPosts();
  },

  onShow() {
    // 每次显示时刷新列表
    this.loadPosts();
  },

  // 设置筛选条件
  setFilter(e) {
    const { filter } = e.currentTarget.dataset;
    this.setData({ 
      currentFilter: filter,
      page: 1,
      hasMore: true,
      postList: []
    });
    this.loadPosts();
  },

  // 加载帖子列表
  async loadPosts() {
    // TODO: 从后端加载真实数据
    // const { getPosts } = require('../../api/request');
    // const res = await getPosts({ 
    //   filter: this.data.currentFilter,
    //   page: this.data.page,
    //   pageSize: this.data.pageSize
    // });
    
    // 模拟数据
    if (this.data.page === 1) {
      // 刷新数据
    } else {
      // 加载更多数据
      const morePosts = this.generateMockPosts();
      this.setData({
        postList: [...this.data.postList, ...morePosts],
        isLoadingMore: false,
        hasMore: morePosts.length >= this.data.pageSize
      });
    }
  },

  // 生成模拟数据
  generateMockPosts() {
    const tags = ['问答', '笔记', '分享'];
    const titles = [
      'Redis缓存穿透、击穿、雪崩解决方案',
      'JavaScript闭包详解及应用场景',
      'MySQL索引优化实战总结',
      'Docker容器化部署教程',
      '计算机网络TCP/IP协议栈详解'
    ];
    
    return Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + i,
      authorName: `用户${Math.floor(Math.random() * 1000)}`,
      authorAvatar: '',
      publishTime: `${Math.floor(Math.random() * 24)}小时前`,
      tag: tags[Math.floor(Math.random() * tags.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      summary: '这是帖子的摘要内容，详细描述了问题的背景和需求...',
      images: [],
      likeCount: Math.floor(Math.random() * 100),
      commentCount: Math.floor(Math.random() * 20),
      isLiked: false
    }));
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ 
      isRefreshing: true,
      page: 1,
      hasMore: true
    });
    
    setTimeout(() => {
      this.loadPosts();
      this.setData({ isRefreshing: false });
    }, 1000);
  },

  // 加载更多
  onLoadMore() {
    if (!this.data.hasMore || this.data.isLoadingMore) return;
    
    this.setData({ 
      isLoadingMore: true,
      page: this.data.page + 1
    });
    
    setTimeout(() => {
      this.loadPosts();
    }, 500);
  },

  // 跳转到详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/release/index?id=${id}&mode=detail`
    });
  },

  // 点赞
  onLike(e) {
    const { id } = e.currentTarget.dataset;
    const posts = this.data.postList.map(post => {
      if (post.id === id) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
        };
      }
      return post;
    });
    
    this.setData({ postList: posts });
    
    wx.showToast({
      title: posts.find(p => p.id === id).isLiked ? '点赞成功' : '取消点赞',
      icon: 'none'
    });
  },

  // 跳转到发布页
  goToRelease() {
    wx.navigateTo({
      url: '/pages/release/index'
    });
  }
});
