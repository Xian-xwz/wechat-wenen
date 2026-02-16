// 在线答题页面
const trackBehavior = require('../../behaviors/track');

Page({
  behaviors: [trackBehavior],

  data: {
    currentIndex: 0,
    selectedAnswer: null,
    showResult: false,
    isCorrect: false,
    timer: 0,
    timerInterval: null,
    optionLabels: ['A', 'B', 'C', 'D'],

    // 题目列表
    questions: [
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
        analysis: 'LRU缓存需要O(1)的查找和删除操作。哈希表提供O(1)查找，双向链表提供O(1)删除和插入，两者结合是最佳方案。'
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
        analysis: '前序遍历的顺序是：根节点 -> 左子树 -> 右子树，即根-左-右。'
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
        analysis: '快速排序的平均时间复杂度为O(n log n)，最坏情况下为O(n²)。'
      }
    ],

    // 答题记录
    answers: []
  },

  onLoad() {
    this.startTimer();
  },

  onUnload() {
    this.stopTimer();
  },

  // 开始计时
  startTimer() {
    this.data.timerInterval = setInterval(() => {
      this.setData({
        timer: this.data.timer + 1
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

  // 获取当前题目
  getCurrentQuestion() {
    return this.data.questions[this.data.currentIndex];
  },

  // 选择选项
  selectOption(e) {
    if (this.data.showResult) return;

    const { index } = e.currentTarget.dataset;
    this.setData({ selectedAnswer: index });

    // 埋点：选项修改轨迹
    this.trackOptionChange(
      this.getCurrentQuestion().id,
      this.data.selectedAnswer,
      index
    );
  },

  // 提交答案
  submitAnswer() {
    const { selectedAnswer, currentIndex, questions, timer } = this.data;
    const currentQuestion = questions[currentIndex];

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
        isCorrect: false
      });
    }
  },

  // 加入错题本
  addToWrongBook() {
    const currentQuestion = this.getCurrentQuestion();

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
