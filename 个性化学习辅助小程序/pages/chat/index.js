// 学习智能体页面
Page({
  data: {
    userAvatar: '/static/avatar.png', // 用户头像
    input: '', // 输入框内容
    messages: [], // 消息列表
    anchor: '', // 滚动锚点
    keyboardHeight: 0, // 键盘高度
    showSuggestions: true, // 是否显示建议卡片
    showQuickQuestions: true, // 是否显示快捷问题

    // 建议卡片
    suggestions: [
      { title: '分析我的学习情况', text: '请分析一下我的学习情况，看看哪些地方需要加强？' },
      { title: '推荐今日学习内容', text: '请根据我的兴趣推荐今天的学习内容' },
      { title: '解答二叉树问题', text: '二叉树的前序遍历和中序遍历有什么区别？' },
      { title: '学习建议', text: '如何提高算法题的解题速度？' }
    ],

    // 快捷问题
    quickQuestions: [
      '什么是动态规划？',
      '如何学好数据结构？',
      '推荐几道排序算法题',
      '计算机网络重点知识'
    ]
  },

  onLoad() {
    // 页面加载
  },

  // 处理唤起键盘事件
  handleKeyboardHeightChange(event) {
    const { height } = event.detail;
    if (!height) return;
    this.setData({ 
      keyboardHeight: height,
      showQuickQuestions: false 
    });
    wx.nextTick(this.scrollToBottom);
  },

  // 处理收起键盘事件
  handleBlur() {
    this.setData({ 
      keyboardHeight: 0,
      showQuickQuestions: true 
    });
  },

  // 处理输入事件
  handleInput(event) {
    this.setData({ input: event.detail.value });
  },

  // 发送消息
  sendMessage() {
    const { messages, input: content } = this.data;
    if (!content.trim()) return;

    // 隐藏建议卡片
    this.setData({ showSuggestions: false });

    // 添加用户消息
    messages.push({
      type: 'user',
      content,
      time: Date.now()
    });

    this.setData({ 
      input: '', 
      messages,
      showQuickQuestions: false 
    });

    wx.nextTick(this.scrollToBottom);

    // 模拟智能体回复
    this.simulateAssistantResponse(content);
  },

  // 发送建议/快捷问题
  sendSuggestion(e) {
    const { text } = e.currentTarget.dataset;
    this.setData({ input: text });
    this.sendMessage();
  },

  // 模拟智能体回复
  simulateAssistantResponse(userMessage) {
    setTimeout(() => {
      const responses = this.generateResponse(userMessage);
      const { messages } = this.data;

      messages.push({
        type: 'assistant',
        content: responses.content,
        quickActions: responses.quickActions,
        time: Date.now()
      });

      this.setData({ messages });
      wx.nextTick(this.scrollToBottom);
    }, 1000);
  },

  // 生成回复内容
  generateResponse(userMessage) {
    // 简单的关键词匹配回复
    if (userMessage.includes('学习情况') || userMessage.includes('分析')) {
      return {
        content: '根据你的学习数据分析，你的算法掌握度为75%，数据结构掌握度为80%。建议加强动态规划方面的练习，最近一周你在二叉树相关题目上的正确率有待提高。',
        quickActions: ['查看详细报告', '推荐练习题', '制定学习计划']
      };
    } else if (userMessage.includes('推荐') || userMessage.includes('学习内容')) {
      return {
        content: '基于你的兴趣标签（数据结构、算法），我为你推荐以下内容：\n1. 二叉树的遍历算法详解\n2. 动态规划入门指南\n3. 排序算法对比分析',
        quickActions: ['开始学习', '查看更多推荐', '调整兴趣标签']
      };
    } else if (userMessage.includes('二叉树')) {
      return {
        content: '二叉树是数据结构中的重要概念。前序遍历（根-左-右）、中序遍历（左-根-右）、后序遍历（左-右-根）的主要区别在于访问根节点的时机不同。',
        quickActions: ['查看相关题目', '学习二叉搜索树', '更多数据结构']
      };
    } else if (userMessage.includes('动态规划') || userMessage.includes('DP')) {
      return {
        content: '动态规划（DP）是一种解决复杂问题的算法思想，核心是将大问题分解为子问题，并保存子问题的解以避免重复计算。经典问题包括：斐波那契数列、背包问题、最长公共子序列等。',
        quickActions: ['DP入门教程', '经典DP题目', 'DP练习题']
      };
    } else {
      return {
        content: '我理解你的问题。作为你的学习助手，我可以帮你：\n1. 分析学习情况和薄弱环节\n2. 推荐个性化的学习内容\n3. 解答具体的学习问题\n4. 制定学习计划\n\n请问有什么我可以帮你的吗？',
        quickActions: ['分析学习情况', '推荐学习内容', '解答问题']
      };
    }
  },

  // 反馈
  giveFeedback(e) {
    const { index, type } = e.currentTarget.dataset;
    const { messages } = this.data;
    
    messages[index].feedback = type;
    this.setData({ messages });

    wx.showToast({
      title: '感谢您的反馈',
      icon: 'none'
    });
  },

  // 消息列表滚动到底部
  scrollToBottom() {
    this.setData({ anchor: 'bottom' });
  }
});
