// Anna AI对话页面逻辑
const annaService = require('../../utils/anna-service.js');
const app = getApp();

// 🛠️ 修复引用：使用本地 CommonJS 版本的 marked
// 避免 ES 模块兼容性问题
const marked = require('../../utils/marked.js'); 

// 🎨 配置代码块渲染器 (实现 DeepSeek 风格 + 复制按钮)
// 注意：新版 marked 的 renderer 挂载方式可能不同，这里做个兼容判断
const renderer = new (marked.Renderer || marked.marked.Renderer)();

renderer.code = function(code, language) {
  // 1. 安全转义
  const validLang = language || 'plaintext';
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
    
  // 2. 编码内容供复制
  const encodeCodeContent = encodeURIComponent(code);

  // 3. 返回 HTML
  return `
    <div class="code-box" style="margin: 16rpx 0; background: #282c34; border-radius: 12rpx; overflow: hidden; font-family: Consolas, monospace;">
      <div class="code-header" style="display: flex; justify-content: space-between; align-items: center; padding: 8rpx 20rpx; background: #21252b; border-bottom: 1rpx solid #3e4451;">
        <span style="color: #abb2bf; font-size: 24rpx; font-weight: bold;">${validLang}</span>
        <a href="copy://${encodeCodeContent}" style="color: #61afef; font-size: 24rpx; text-decoration: none;">📄 复制</a>
      </div>
      <pre style="margin: 0; padding: 20rpx; overflow-x: auto; color: #abb2bf; font-size: 26rpx; line-height: 1.5; white-space: pre;">${escapedCode}</pre>
    </div>
  `;
};

// 应用配置
// 兼容新版 marked.use 和旧版 marked.setOptions
if (marked.use) {
  marked.use({ renderer, breaks: true, gfm: true });
} else if (marked.marked && marked.marked.use) {
   marked.marked.use({ renderer, breaks: true, gfm: true });
} else {
   marked.setOptions({ renderer, breaks: true, gfm: true });
}

// 兼容调用 parse 方法
const parseMarkdown = (text) => {
    if (typeof marked === 'function') return marked(text);
    if (typeof marked.parse === 'function') return marked.parse(text);
    if (marked.marked && typeof marked.marked.parse === 'function') return marked.marked.parse(text);
    return text; // 兜底
};

Page({
  data: {
    // 用户信息
    userAvatar: '/static/avatar1.png',
    userName: '学习者',
    
    // 聊天数据
    messages: [],
    inputText: '',
    isThinking: false,
    showQuickQuestions: true,
    lastMsgId: 'welcome',
    
    // 快捷问题
    quickQuestions: [
      { id: 1, text: '🗑️ 清除记录', action: 'clear' },
      { id: 2, text: 'let和var的区别？' },
      { id: 3, text: 'Flex布局怎么用？' },
      { id: 4, text: '如何实现响应式设计？' },
      { id: 5, text: 'CSS变量有什么优点？' },
      { id: 6, text: 'JavaScript原型链是什么？' }
    ],
    
    // 菜单
    showMenuPopup: false,
    
    // 从知识图谱传入的问题
    autoQuestion: '',
    
    // 🚀 Anna云函数测试数据
    testReply: '',
    testSuccess: false,
    testError: '',
    
    // 🎨 DeepSeek 风格全套皮肤
    tagStyle: {
      // 1. 代码块 (Pre)
      pre: 'padding: 0; margin: 16rpx 0; background: transparent; border-radius: 12rpx; overflow: hidden;',
      
      // 2. 行内代码 (Code)
      code: 'background: rgba(0, 0, 0, 0.06); padding: 4rpx 8rpx; border-radius: 6rpx; font-family: monospace; color: #c7254e; margin: 0 4rpx;',
      
      // 3. 引用块 (Blockquote)
      blockquote: 'margin: 16rpx 0; padding-left: 24rpx; border-left: 8rpx solid #e0e0e0; color: #666; background: #f9f9f9; padding: 10rpx;',
      
      // 4. 标题 (H1-H6) - 解决 ### 不变大的问题
      h1: 'font-size: 36rpx; font-weight: bold; margin: 24rpx 0 16rpx; border-bottom: 1rpx solid #eee; padding-bottom: 10rpx;',
      h2: 'font-size: 32rpx; font-weight: bold; margin: 20rpx 0 12rpx;',
      h3: 'font-size: 30rpx; font-weight: bold; margin: 16rpx 0 10rpx;',
      
      // 5. 列表 (Ul/Ol)
      ul: 'margin: 10rpx 0; padding-left: 30rpx;',
      ol: 'margin: 10rpx 0; padding-left: 30rpx;',
      li: 'margin: 6rpx 0; line-height: 1.6;',
      
      // 6. 加粗 (Strong) - 让"代码示例"等加粗文本看起来像个小标题
      strong: 'font-weight: 900; color: #374151; font-size: 30rpx; display: inline-block; margin-top: 20rpx; margin-bottom: 8rpx;',
      b: 'font-weight: 900; color: #374151; font-size: 30rpx; display: inline-block; margin-top: 20rpx; margin-bottom: 8rpx;'
    }
  },

  onLoad(options) {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({
        userAvatar: userInfo.avatarUrl || '/static/default-avatar.png',
        userName: userInfo.nickName || '学习者'
      });
    }
    
    if (options.question) {
      this.setData({
        autoQuestion: options.question,
        showQuickQuestions: false
      });
      setTimeout(() => {
        this.sendAutoQuestion(options.question);
      }, 500);
    }
    
    this.loadHistoryMessages();
    
    wx.setNavigationBarTitle({
      title: 'Anna学习助手'
    });

    // 🚀 注释掉这行代码，不要让它在页面一加载就霸占屏幕！
    // this.testAnna();
  },

  onShow() {
    this.scrollToBottom();
  },

  /**
   * 🚀 历史消息加载 (含兼容性修复)
   */
  loadHistoryMessages() {
    try {
      const history = wx.getStorageSync('anna_chat_history');
      if (history && Array.isArray(history)) {
        const convertedHistory = history.map(msg => {
          const newMsg = { ...msg };
          
          // 1. 兼容旧版 role 字段
          if (newMsg.role && !newMsg.sender) {
            if (newMsg.role === 'user') newMsg.sender = 'user';
            else if (newMsg.role === 'assistant') newMsg.sender = 'anna';
          }
          
          // 2. 🆕 关键修复：如果旧消息没有 htmlContent，现场补一个！
          if (newMsg.sender === 'anna' && !newMsg.htmlContent && newMsg.content) {
            try {
              // 现场把 markdown 转成 html，防止旧消息空白
              newMsg.htmlContent = parseMarkdown(newMsg.content);
            } catch (e) {
              newMsg.htmlContent = newMsg.content; // 降级
            }
          }
          
          return newMsg;
        });
        
        this.setData({ messages: convertedHistory });
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
    }
  },

  saveHistoryMessages() {
    try {
      wx.setStorageSync('anna_chat_history', this.data.messages);
    } catch (error) {
      console.error('保存历史消息失败:', error);
    }
  },

  onInput(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  /**
   * 🚀 终极版发送逻辑 (节流 + Marked转换 + 错误熔断)
   */
  async sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.isThinking) return;

    // 1. 上墙用户消息
    const userMsg = {
      id: 'user_' + Date.now(),
      sender: 'user',
      content: text,
      htmlContent: text,
      timestamp: new Date(),
      loading: false
    };
    
    // 2. 占位 Anna 消息
    const annaMsgId = 'anna_' + Date.now();
    const annaMsg = {
      id: annaMsgId,
      sender: 'anna',
      content: '',       // 原始 Markdown
      htmlContent: '',   // 🚀 转换后的 HTML
      thinkContent: '',
      isThinking: true,
      isThinkCollapsed: false,
      timestamp: new Date(),
      loading: true
    };
    
    // 3. 渲染初始状态
    const newMessages = [...this.data.messages, userMsg, annaMsg];
    this.setData({
      messages: newMessages,
      isThinking: true,
      inputText: '',
      lastMsgId: 'msg-' + annaMsgId
    });
    
    // 4. 定义变量
    let isFirstContent = true;
    let contentBuffer = ''; 
    let lastUpdateTime = 0; 
    
    const updateBubbleCallback = (text, type) => {
      const currentAnnaMsgIndex = this.data.messages.findIndex(msg => msg.id === annaMsgId);
      if (currentAnnaMsgIndex === -1) return;
        
      if (type === 'thinking') {
        const currentThinkContent = this.data.messages[currentAnnaMsgIndex].thinkContent || '';
        this.setData({
          [`messages[${currentAnnaMsgIndex}].thinkContent`]: currentThinkContent + text,
          lastMsgId: 'msg-' + annaMsgId 
        });
      } else if (type === 'content') {
        // 关闭 Loading
        if (isFirstContent) {
          this.setData({ isThinking: false }); 
          isFirstContent = false;
        }
        
        contentBuffer += text;
        const currentRawContent = this.data.messages[currentAnnaMsgIndex].content || '';
        const fullMarkdown = currentRawContent + contentBuffer; // 简单拼接

        // 节流渲染：每 100ms 转换一次
        const now = Date.now();
        if (now - lastUpdateTime > 100) {
           let finalHtml = '';
           try {
             // 🚀 改成调用我们封装好的兼容函数
             finalHtml = parseMarkdown(fullMarkdown);
           } catch (err) {
             console.error('Markdown解析失败', err);
             finalHtml = fullMarkdown; // 降级
           }

           this.setData({
            [`messages[${currentAnnaMsgIndex}].content`]: fullMarkdown,
            [`messages[${currentAnnaMsgIndex}].htmlContent`]: finalHtml,
            [`messages[${currentAnnaMsgIndex}].isThinking`]: false, 
            [`messages[${currentAnnaMsgIndex}].isThinkCollapsed`]: true, 
            [`messages[${currentAnnaMsgIndex}].loading`]: false,
            lastMsgId: 'msg-' + annaMsgId
          });
          contentBuffer = ''; 
          lastUpdateTime = now;
        }
      }
    };
    
    try {
      const context = { onUpdateBubble: updateBubbleCallback };
      await annaService.chatWithAnna(text, context);
      
      // 5. 兜底：处理剩余 buffer
      const messages = this.data.messages;
      const index = messages.findIndex(msg => msg.id === annaMsgId);
      if (index !== -1) {
        const finalRaw = messages[index].content + contentBuffer;
        messages[index].content = finalRaw;
        // 最后一次转换
        try {
            messages[index].htmlContent = parseMarkdown(finalRaw);
        } catch (e) {
            messages[index].htmlContent = finalRaw;
        }
        messages[index].loading = false;
        this.setData({ 
          messages: [...messages],
          isThinking: false,
          lastMsgId: 'msg-' + annaMsgId
        });
      }
    } catch (error) {
      console.error('Anna对话失败:', error);
      const errorMsg = {
        id: 'anna_error_' + Date.now(),
        sender: 'anna',
        content: '抱歉，网络好像有点问题，请稍后再试。',
        timestamp: new Date(),
        loading: false
      };
      this.addMessage(errorMsg);
    } finally {
      this.saveHistoryMessages();
    }
  },

  sendQuickQuestion(e) {
    const question = e.currentTarget.dataset.question;
    const index = e.currentTarget.dataset.index;
    
    // 🗑️ 检测是否是清除记录按钮
    const quickItem = this.data.quickQuestions[index];
    if (quickItem && quickItem.action === 'clear') {
      this.clearChat();  // 调用已有的清除方法
      return;
    }
    
    this.setData({ inputText: question });
    setTimeout(() => {
      this.sendMessage();
    }, 100);
  },

  sendAutoQuestion(question) {
    this.setData({ inputText: question });
    setTimeout(() => {
      this.sendMessage();
    }, 800);
  },

  /**
   * 🚀 修复 addMessage 的滚动锚点
   */
  addMessage(message) {
    const messages = this.data.messages;
    messages.push(message);
    this.setData({ 
      messages,
      lastMsgId: 'msg-' + message.id // 👈 加上前缀
    });
  },

  /**
   * 🚀 强制滚动到最新消息
   */
  scrollToBottom() {
    setTimeout(() => {
      if (this.data.messages.length > 0) {
        const lastMsgId = 'msg-' + this.data.messages[this.data.messages.length - 1].id;
        this.setData({
          lastMsgId: lastMsgId
        });
        
        // 双重保险：使用原生滚动API
        wx.pageScrollTo({
          scrollTop: 99999,
          duration: 0
        });
      } else {
        this.setData({ lastMsgId: 'welcome' });
      }
    }, 300); // 稍微延迟确保渲染完成
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.getHours().toString().padStart(2, '0') + ':' + 
             date.getMinutes().toString().padStart(2, '0');
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    return (date.getMonth() + 1) + '月' + date.getDate() + '日';
  },

  goBack() {
    wx.navigateBack();
  },

  showMenu() {
    this.setData({ showMenuPopup: true });
  },

  onMenuPopupChange(e) {
    if (!e.detail.visible) {
      this.setData({ showMenuPopup: false });
    }
  },

  clearChat() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空当前对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ 
            messages: [],
            showQuickQuestions: true 
          });
          wx.removeStorageSync('anna_chat_history');
          this.scrollToBottom();
        }
        this.setData({ showMenuPopup: false });
      }
    });
  },

  showHistory() {
    wx.showToast({
      title: '历史记录功能开发中',
      icon: 'none'
    });
    this.setData({ showMenuPopup: false });
  },

  closeMenu() {
    this.setData({ showMenuPopup: false });
  },

  toggleThink(e) {
    const index = e.currentTarget.dataset.index;
    const messages = this.data.messages;
    
    if (index >= 0 && index < messages.length) {
      const currentCollapsed = messages[index].isThinkCollapsed;
      this.setData({
        [`messages[${index}].isThinkCollapsed`]: !currentCollapsed
      });
    }
  },

  onUnload() {
    this.saveHistoryMessages();
  },

  /**
   * 🔗 拦截富文本点击事件（实现代码复制）
   */
  handleLinkTap(e) {
    const href = e.detail.href || '';
    
    // 如果是复制协议
    if (href.startsWith('copy://')) {
      // 提取并解码代码内容
      const rawCode = decodeURIComponent(href.replace('copy://', ''));
      
      // 调用微信剪贴板
      wx.setClipboardData({
        data: rawCode,
        success: () => {
          wx.showToast({ title: '代码已复制', icon: 'success' });
        }
      });
    }
  },

  // 保留原有的测试方法（未做大幅修改，不影响正常主流程）
  async testAnna() {
    try {
      console.log("🚀 正在呼叫 Anna AI Agent...");
      wx.showLoading({
        title: '正在连接Anna AI...',
        mask: true
      });
      
      const botId = "agent-anna-7gjv69wzc7d985f7";
      const res = await wx.cloud.extend.AI.bot.sendMessage({
        data: {
          botId: botId, 
          messages: [{ role: "user", content: "你好，Anna！请自我介绍一下。" }],
          tools: [],
          context: []
        }
      });
      
      if (res && res.eventStream) {
        let eventText = "";
        try {
          for await (let event of res.eventStream) {
            if (event && event.data) {
              if (typeof event.data === 'string') {
                try {
                  const jsonData = JSON.parse(event.data);
                  if (jsonData.type === 'TEXT_MESSAGE_CONTENT' || jsonData.type === 'THINKING_TEXT_MESSAGE_CONTENT') {
                    eventText += jsonData.delta || '';
                  }
                } catch (e) {
                  eventText += event.data;
                }
              } else if (event.data.text) {
                eventText += event.data.text;
              } else if (event.data.content) {
                eventText += event.data.content;
              }
            }
          }
          
          if (eventText) {
            this.setData({ testReply: eventText, testSuccess: true });
            wx.hideLoading();
            return;
          }
        } catch (eventError) {
          console.warn("eventStream处理失败:", eventError);
        }
      }
      
      wx.hideLoading();
    } catch (err) {
      console.error("❌ AI Agent 调用彻底失败:", err);
      wx.hideLoading();
      this.setData({
        testError: err.errMsg || '未知错误',
        testSuccess: false
      });
    }
  }
});