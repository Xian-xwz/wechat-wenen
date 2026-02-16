/**
 * 学习行为数据采集 Behavior
 * 用于隐形埋点采集用户学习行为数据
 * 
 * 使用方式：
 * const trackBehavior = require('../behaviors/track');
 * Page({
 *   behaviors: [trackBehavior],
 *   trackOptions: {
 *     pageName: 'quiz',
 *     enableDuration: true,
 *     enableClick: true
 *   }
 * })
 */

module.exports = Behavior({
  data: {
    // 埋点相关状态
    _trackEnterTime: null,
    _trackEvents: [],
    _trackTimer: null,
    _trackDebounceTimer: null
  },

  lifetimes: {
    attached() {
      // 初始化埋点配置
      this._trackInit();
    },

    detached() {
      // 页面销毁时上报剩余数据
      this._trackFlush();
    }
  },

  pageLifetimes: {
    show() {
      // 记录进入时间
      this._trackEnterTime = Date.now();
      
      // 上报页面访问事件
      this._trackEvent('page_view', {
        timestamp: Date.now()
      });
    },

    hide() {
      // 计算停留时长
      if (this._trackEnterTime) {
        const duration = Math.floor((Date.now() - this._trackEnterTime) / 1000);
        this._trackEvent('page_exit', {
          duration,
          timestamp: Date.now()
        });
        
        // 立即上报
        this._trackFlush();
      }
    }
  },

  methods: {
    /**
     * 初始化埋点
     */
    _trackInit() {
      const options = this.trackOptions || {};
      this._trackConfig = {
        pageName: options.pageName || this.route || 'unknown',
        enableDuration: options.enableDuration !== false,
        enableClick: options.enableClick !== false,
        debounceTime: options.debounceTime || 5000, // 默认5秒防抖
        batchSize: options.batchSize || 10 // 批量上报阈值
      };
    },

    /**
     * 记录事件
     * @param {string} eventType - 事件类型
     * @param {object} metadata - 附加数据
     */
    _trackEvent(eventType, metadata = {}) {
      const event = {
        event_type: eventType,
        page_name: this._trackConfig.pageName,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          userAgent: wx.getSystemInfoSync().model
        }
      };

      // 添加到事件队列
      this.data._trackEvents.push(event);

      // 防抖上报
      this._trackDebounceUpload();

      // 达到批量阈值立即上报
      if (this.data._trackEvents.length >= this._trackConfig.batchSize) {
        this._trackFlush();
      }
    },

    /**
     * 防抖上报
     */
    _trackDebounceUpload() {
      if (this.data._trackDebounceTimer) {
        clearTimeout(this.data._trackDebounceTimer);
      }

      this.data._trackDebounceTimer = setTimeout(() => {
        this._trackFlush();
      }, this._trackConfig.debounceTime);
    },

    /**
     * 立即上报所有事件
     */
    _trackFlush() {
      if (this.data._trackEvents.length === 0) return;

      const events = [...this.data._trackEvents];
      this.data._trackEvents = [];

      // 这里可以调用实际的上报接口
      // 暂时使用 console.log 模拟，后续接入 request.js
      console.log('[Track] 上报事件:', events);

      // TODO: 接入实际的上报接口
      // this._trackUploadToServer(events);
    },

    /**
     * 上报到服务器（预留接口）
     * @param {array} events - 事件列表
     */
    _trackUploadToServer(events) {
      // 后续接入 request.js 中的 uploadBehavior API
      // const { uploadBehavior } = require('../api/request');
      // uploadBehavior({ events });
    },

    /**
     * 记录点击事件（供页面调用）
     * @param {string} element - 点击元素标识
     * @param {object} extra - 附加数据
     */
    trackClick(element, extra = {}) {
      if (!this._trackConfig.enableClick) return;
      
      this._trackEvent('click', {
        element,
        ...extra
      });
    },

    /**
     * 记录选项变更（用于答题页面）
     * @param {string} questionId - 题目ID
     * @param {string} oldOption - 原选项
     * @param {string} newOption - 新选项
     */
    trackOptionChange(questionId, oldOption, newOption) {
      this._trackEvent('option_change', {
        question_id: questionId,
        old_option: oldOption,
        new_option: newOption
      });
    },

    /**
     * 记录答题提交
     * @param {string} questionId - 题目ID
     * @param {string} answer - 用户答案
     * @param {number} duration - 答题时长（秒）
     */
    trackAnswerSubmit(questionId, answer, duration) {
      this._trackEvent('answer_submit', {
        question_id: questionId,
        answer,
        duration
      });
      
      // 答题提交时立即上报
      this._trackFlush();
    },

    /**
     * 记录自定义事件
     * @param {string} eventName - 事件名称
     * @param {object} data - 事件数据
     */
    trackCustom(eventName, data = {}) {
      this._trackEvent(eventName, data);
    }
  }
});
