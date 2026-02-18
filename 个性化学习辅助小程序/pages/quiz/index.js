// 在线答题页面 - 接入云数据库版本
const trackBehavior = require('../../behaviors/track');

// 初始化云数据库
const db = wx.cloud.database();

Page({
  behaviors: [trackBehavior],

  data: {
    currentIndex: 0,
    selectedAnswer: null,
    showResult: false,
    isCorrect: false,
    timer: 0,
    timerInterval: null,
    formattedTime: '00:00',
    optionLabels: ['A', 'B', 'C', 'D'],
    
    // 加载状态
    loading: true,
    loadError: false,
    errorMsg: '',
    dataSource: '', // 数据来源：云端/本地回退

    // 题目列表（从云端获取）
    questions: [],

    // 当前题目（手动更新）
    currentQuestion: null,

    // 答题记录
    answers: [],

    // 题目配置
    category: 'javascript',
    questionCount: 10
  },

  onLoad(options) {
    // 从参数中获取配置，或使用默认值
    const { category = 'javascript', count = 10 } = options || {};
    this.setData({ category, questionCount: parseInt(count) });
    
    // 从云端加载题目
    this.loadQuestionsFromCloud();
  },

  onUnload() {
    this.stopTimer();
  },



  // ========== 云数据库相关方法 ==========

  // 从云端加载题目（带本地回退）
  loadQuestionsFromCloud() {
    const { category, questionCount } = this.data;
    
    this.setData({ loading: true, loadError: false });
    
    console.log(`正在从云端加载 ${questionCount} 道 ${category} 题目...`);

    // 使用简单的 get 查询，避免 aggregate 兼容性问题
    db.collection('questions')
      .where({ category: category })
      .get()
      .then(res => {
        console.log('云端题目加载成功:', res);
        
        if (res.data && res.data.length > 0) {
          // 随机打乱并取指定数量
          const shuffled = res.data.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
          
          // 转换云端数据格式
          const questions = selected.map(item => this.formatQuestion(item));
          
          this.setData({
            questions: questions,
            loading: false,
            dataSource: '云端',
            currentIndex: 0,  // 重置索引
            currentQuestion: questions[0]  // 直接设置第一题
          });
          
          // 开始计时
          this.startTimer();
          
          wx.showToast({
            title: `已加载 ${questions.length} 题`,
            icon: 'success'
          });
        } else {
          console.log('云端无数据，使用本地回退题目');
          this.useLocalFallbackQuestions();
        }
      })
      .catch(err => {
        console.error('云端题目加载失败:', err);
        console.log('错误详情:', err.errMsg || err.message);
        
        // 云端加载失败，使用本地回退
        console.log('云端加载失败，使用本地回退题目');
        this.useLocalFallbackQuestions();
      });
  },

  // 使用本地回退题目
  useLocalFallbackQuestions() {
    const { category, questionCount } = this.data;
    
    console.log('===== 使用本地回退题目 =====');
    console.log('category:', category);
    console.log('questionCount:', questionCount);
    
    const localQuestions = this.getLocalFallbackQuestions(category, questionCount);
    
    console.log('获取到的本地题目:', localQuestions);
    console.log('题目数量:', localQuestions.length);
    
    this.setData({
      questions: localQuestions,
      loading: false,
      dataSource: '本地回退',
      loadError: false, // 本地回退不算错误，只是提示用户
      currentIndex: 0,  // 重置索引
      currentQuestion: localQuestions[0]  // 直接设置第一题
    }, () => {
      // setData 完成后的回调
      console.log('setData 完成，当前 questions:', this.data.questions);
      console.log('当前 currentQuestion:', this.data.currentQuestion);
    });
    
    // 开始计时
    this.startTimer();
    
    wx.showToast({
      title: `已加载 ${localQuestions.length} 题`,
      icon: 'info'
    });
  },

  // 获取本地回退题目
  getLocalFallbackQuestions(category, count) {
    // 基础题目数据（可以根据需要扩展）
    const allQuestions = [
      {
        id: 1,
        type: '单选题',
        title: '以下哪种数据结构最适合实现LRU缓存？',
        options: [
          '数组 + 二分查找',
          '哈希表 + 双向链表',
          '二叉搜索树',
          '堆'
        ],
        correct: 1,
        analysis: 'LRU缓存需要O(1)的查找和删除操作。哈希表提供O(1)查找，双向链表提供O(1)删除和插入，两者结合是最佳方案。',
        difficulty: 'medium',
        category: 'javascript',
        tags: ['数据结构', '缓存']
      },
      {
        id: 2,
        type: '单选题',
        title: '二叉树的前序遍历顺序是？',
        options: [
          '左-根-右',
          '根-左-右',
          '左-右-根',
          '右-根-左'
        ],
        correct: 1,
        analysis: '前序遍历的顺序是：根节点 -> 左子树 -> 右子树，即根-左-右。',
        difficulty: 'easy',
        category: 'javascript',
        tags: ['二叉树', '遍历']
      },
      {
        id: 3,
        type: '单选题',
        title: '快速排序的平均时间复杂度是？',
        options: [
          'O(n)',
          'O(n log n)',
          'O(n²)',
          'O(log n)'
        ],
        correct: 1,
        analysis: '快速排序的平均时间复杂度为O(n log n)，最坏情况下为O(n²)。',
        difficulty: 'medium',
        category: 'javascript',
        tags: ['排序', '算法']
      },
      {
        id: 4,
        type: '单选题',
        title: 'JavaScript中，typeof null 的结果是什么？',
        options: [
          'null',
          'object',
          'undefined',
          'string'
        ],
        correct: 1,
        analysis: 'typeof null 返回 "object"，这是JavaScript的历史遗留bug。',
        difficulty: 'easy',
        category: 'javascript',
        tags: ['数据类型', '基础']
      },
      {
        id: 5,
        type: '单选题',
        title: 'CSS中，以下哪个属性可以设置元素水平居中？',
        options: [
          'vertical-align: middle',
          'text-align: center',
          'margin: auto',
          'position: absolute'
        ],
        correct: 2,
        analysis: '对于块级元素，设置 margin: auto 可以使其在父元素中水平居中。',
        difficulty: 'easy',
        category: 'css',
        tags: ['布局', '居中']
      }
    ];
    
    // 筛选指定分类的题目
    let filteredQuestions = allQuestions;
    if (category !== 'all') {
      filteredQuestions = allQuestions.filter(q => q.category === category);
    }
    
    // 如果筛选后题目不足，使用所有题目
    if (filteredQuestions.length === 0) {
      filteredQuestions = allQuestions;
    }
    
    // 随机选择指定数量的题目
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  },

  // 转换云端数据格式
  formatQuestion(cloudData) {
    // 云端数据结构适配
    // 注意：云端 _id 是系统自动生成的，我们保留原始的 id 字段
    return {
      id: cloudData.id || cloudData._id,
      _cloudId: cloudData._id, // 保存云端ID以便后续使用
      type: cloudData.type || '单选题',
      title: cloudData.title,
      options: cloudData.options || [],
      correct: cloudData.correct,
      analysis: cloudData.analysis || '暂无解析',
      difficulty: cloudData.difficulty || 'medium',
      category: cloudData.category,
      tags: cloudData.tags || []
    };
  },

  // 重试加载
  retryLoad() {
    this.loadQuestionsFromCloud();
  },

  // 开始计时
  startTimer() {
    this.data.timerInterval = setInterval(() => {
      const timer = this.data.timer + 1;
      this.setData({
        timer: timer,
        formattedTime: this.formatTime(timer)
      });
    }, 1000);
  },

  // 停止计时
  stopTimer() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }
  },

  // 格式化时间
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // 获取当前题目（兼容旧代码）
  getCurrentQuestion() {
    return this.data.currentQuestion;
  },

  // 选择选项
  selectOption(e) {
    if (this.data.showResult) return;

    const { index } = e.currentTarget.dataset;
    this.setData({ selectedAnswer: index });

    // 埋点：选项修改轨迹
    this.trackOptionChange(
      this.data.currentQuestion.id,
      this.data.selectedAnswer,
      index
    );
  },

  // 提交答案
  submitAnswer() {
    const { selectedAnswer, currentQuestion, timer } = this.data;
    if (!currentQuestion) {
      wx.showToast({
        title: '题目信息缺失',
        icon: 'none'
      });
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correct;

    // 记录答案
    this.data.answers.push({
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      correct: currentQuestion.correct,
      isCorrect,
      time: timer
    });

    this.setData({
      showResult: true,
      isCorrect
    });

    // 埋点：答题提交
    this.trackAnswerSubmit(currentQuestion.id, selectedAnswer, timer);
  },

  // 下一题
  nextQuestion() {
    const { currentIndex, questions } = this.data;

    if (currentIndex >= questions.length - 1) {
      // 完成所有题目
      this.finishQuiz();
    } else {
      this.setData({
        currentIndex: currentIndex + 1,
        selectedAnswer: null,
        showResult: false,
        isCorrect: false,
        currentQuestion: questions[currentIndex + 1]  // 更新当前题目
      });
    }
  },

  // 加入错题本
  addToWrongBook() {
    const currentQuestion = this.data.currentQuestion;
    if (!currentQuestion) {
      wx.showToast({
        title: '题目信息缺失',
        icon: 'none'
      });
      return;
    }

    // 获取现有错题
    let wrongBook = wx.getStorageSync('wrongBook') || [];

    // 检查是否已存在
    const exists = wrongBook.some(item => item.id === currentQuestion.id);
    if (!exists) {
      wrongBook.push({
        ...currentQuestion,
        wrongAnswer: this.data.selectedAnswer,
        addTime: new Date().toISOString()
      });
      wx.setStorageSync('wrongBook', wrongBook);

      wx.showToast({
        title: '已加入错题本',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '已在错题本中',
        icon: 'none'
      });
    }
  },

  // 完成答题
  finishQuiz() {
    this.stopTimer();

    const { answers, timer, questions } = this.data;
    const correctCount = answers.filter(a => a.isCorrect).length;
    const accuracy = Math.round((correctCount / questions.length) * 100);

    // 保存答题记录
    const record = {
      date: new Date().toISOString(),
      totalQuestions: questions.length,
      correctCount,
      accuracy,
      totalTime: timer,
      answers
    };

    let quizHistory = wx.getStorageSync('quizHistory') || [];
    quizHistory.push(record);
    wx.setStorageSync('quizHistory', quizHistory);

    // 显示结果
    wx.showModal({
      title: '答题完成',
      content: `共${questions.length}题，答对${correctCount}题，正确率${accuracy}%，用时${this.formatTime(timer)}`,
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  },

  // 是否最后一题
  isLastQuestion() {
    return this.data.currentIndex >= this.data.questions.length - 1;
  }
});
