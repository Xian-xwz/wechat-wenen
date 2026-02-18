// 知识图谱气泡组件
// 使用阿基米德螺旋线算法布局：r = a + b * θ

Component({
  properties: {
    // 知识点数据数组
    knowledgePoints: {
      type: Array,
      value: [],
      observer: 'generatePositions'
    },
    // 布局配置
    layoutConfig: {
      type: Object,
      value: {
        a: 80,          // 螺旋线起始半径
        b: 30,          // 螺旋线增长系数
        angleStep: 0.8, // 角度步长（弧度）
        centerX: 375,   // 画布中心X坐标（750rpx基准）
        centerY: 300    // 画布中心Y坐标
      },
      observer: 'generatePositions'
    },
    // 是否显示连线
    showConnections: {
      type: Boolean,
      value: true
    },
    // 中心气泡大小（比例）
    centerBubbleScale: {
      type: Number,
      value: 1.2
    }
  },

  data: {
    // 计算后的气泡位置数据
    bubblePositions: [],
    // 中心主题气泡
    centerBubble: null,
    // 连线数据
    connectionLines: [],
    // 组件尺寸
    componentWidth: 750,
    componentHeight: 600
  },

  lifetimes: {
    attached() {
      this.calculateComponentSize();
      this.generatePositions();
    },
    ready() {
      // 监听窗口变化（响应式适配）
      wx.getSystemInfo({
        success: (res) => {
          this.systemInfo = res;
          this.adaptLayout();
        }
      });
    }
  },

  methods: {
    /**
     * 计算组件尺寸（响应式）
     */
    calculateComponentSize() {
      const query = this.createSelectorQuery();
      query.select('.knowledge-bubbles-container').boundingClientRect();
      query.exec((res) => {
        if (res[0]) {
          this.setData({
            componentWidth: res[0].width || 750,
            componentHeight: res[0].height || 600
          });
          this.generatePositions();
        }
      });
    },

    /**
     * 根据屏幕尺寸自适应布局参数
     */
    adaptLayout() {
      const { windowWidth } = this.systemInfo || { windowWidth: 750 };
      const scale = windowWidth / 750; // 750rpx基准
      
      const config = { ...this.data.layoutConfig };
      config.a = Math.floor(config.a * scale);
      config.b = Math.floor(config.b * scale);
      config.centerX = Math.floor(config.centerX * scale);
      config.centerY = Math.floor(config.centerY * scale);
      
      this.setData({ layoutConfig: config });
      this.generatePositions();
    },

    /**
     * 极坐标转直角坐标
     * @param {number} r - 半径
     * @param {number} theta - 角度（弧度）
     * @returns {Object} {x, y}
     */
    polarToCartesian(r, theta) {
      return {
        x: r * Math.cos(theta),
        y: r * Math.sin(theta)
      };
    },

    /**
     * 计算两点之间距离
     * @param {Object} p1 - 点1 {x, y}
     * @param {Object} p2 - 点2 {x, y}
     * @returns {number} 距离
     */
    calculateDistance(p1, p2) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * 计算两点连线角度（弧度）
     * @param {Object} p1 - 点1 {x, y}
     * @param {Object} p2 - 点2 {x, y}
     * @returns {number} 角度（弧度）
     */
    calculateAngle(p1, p2) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return Math.atan2(dy, dx);
    },

    /**
     * 生成气泡位置（阿基米德螺旋线算法）
     */
    generatePositions() {
      const { knowledgePoints, layoutConfig, showConnections } = this.data;
      if (!knowledgePoints || knowledgePoints.length === 0) {
        this.setData({ bubblePositions: [], centerBubble: null, connectionLines: [] });
        return;
      }

      const positions = [];
      const connectionLines = [];
      const { a, b, angleStep, centerX, centerY } = layoutConfig;

      // 第一个知识点作为中心主题气泡
      const centerPoint = knowledgePoints[0];
      const centerBubble = {
        ...centerPoint,
        x: centerX,
        y: centerY,
        r: a * this.data.centerBubbleScale,
        isCenter: true
      };

      // 其余知识点按螺旋线排列
      for (let i = 1; i < knowledgePoints.length; i++) {
        const point = knowledgePoints[i];
        const theta = (i - 1) * angleStep; // 角度递增
        const r = a + b * theta;           // 半径按螺旋增长
        const pos = this.polarToCartesian(r, theta);

        const bubbleX = pos.x + centerX;
        const bubbleY = pos.y + centerY;
        
        positions.push({
          ...point,
          x: bubbleX,
          y: bubbleY,
          r: a * 0.8, // 周围气泡稍小
          theta,
          isCenter: false,
          index: i - 1
        });

        // 计算连线数据
        if (showConnections) {
          const distance = this.calculateDistance(
            { x: centerX, y: centerY },
            { x: bubbleX, y: bubbleY }
          );
          const angle = this.calculateAngle(
            { x: centerX, y: centerY },
            { x: bubbleX, y: bubbleY }
          );
          
          connectionLines.push({
            index: i - 1,
            distance,
            angle,
            startX: centerX,
            startY: centerY,
            endX: bubbleX,
            endY: bubbleY
          });
        }
      }

      this.setData({
        centerBubble,
        bubblePositions: positions,
        connectionLines
      });
    },

    /**
     * 气泡点击事件
     * @param {Object} e - 事件对象
     */
    onBubbleTap(e) {
      const { index, isCenter } = e.currentTarget.dataset;
      const bubble = isCenter ? this.data.centerBubble : this.data.bubblePositions[index];
      
      this.triggerEvent('bubbletap', {
        bubble,
        isCenter,
        index: isCenter ? 0 : index
      });
    },

    /**
     * 气泡长按事件
     * @param {Object} e - 事件对象
     */
    onBubbleLongPress(e) {
      const { index, isCenter } = e.currentTarget.dataset;
      const bubble = isCenter ? this.data.centerBubble : this.data.bubblePositions[index];
      
      // 添加抖动动画效果
      this.animateBubble(index, isCenter);
      
      this.triggerEvent('bubblelongpress', {
        bubble,
        isCenter,
        index: isCenter ? 0 : index
      });
    },

    /**
     * 气泡动画（长按时抖动）
     */
    animateBubble(index, isCenter) {
      const bubbleSelector = isCenter 
        ? '.center-bubble' 
        : `.knowledge-bubble[data-index="${index}"]`;
      
      // 使用小程序动画API
      const animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease'
      });
      
      animation.translateX(5).translateY(5).step();
      animation.translateX(-5).translateY(-5).step();
      animation.translateX(0).translateY(0).step();
      
      this.setData({
        [`${bubbleSelector}.animation`]: animation.export()
      });
      
      // 动画结束后清除
      setTimeout(() => {
        this.setData({
          [`${bubbleSelector}.animation`]: null
        });
      }, 300);
    },

    /**
     * 获取气泡颜色（根据掌握程度）
     * @param {Object} bubble - 气泡数据
     * @returns {string} 颜色类名
     */
    getBubbleColorClass(bubble) {
      if (!bubble || bubble.accuracy === undefined) {
        return 'bubble-color-gray';
      }
      
      const { accuracy } = bubble;
      if (accuracy === 0) return 'bubble-color-gray';
      if (accuracy < 60) return 'bubble-color-light-blue';
      if (accuracy < 80) return 'bubble-color-blue';
      return 'bubble-color-green';
    },

    /**
     * 获取气泡大小（根据重要性）
     * @param {Object} bubble - 气泡数据
     * @returns {string} 尺寸类名
     */
    getBubbleSizeClass(bubble) {
      if (bubble.isCenter) return 'bubble-size-large';
      if (bubble.level === 'hard') return 'bubble-size-medium';
      if (bubble.level === 'medium') return 'bubble-size-small';
      return 'bubble-size-xsmall';
    }
  }
});