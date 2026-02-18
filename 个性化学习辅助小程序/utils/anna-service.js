// Anna AI助手服务封装
// 提供与Anna Agent交互的统一接口

const storageKey = 'anna_chat_history';
const maxHistory = 50; // 最大历史消息数

/**
 * 调用Anna AI助手（使用腾讯云AI Agent原生服务）
 * @param {string} message - 用户消息
 * @param {Object} context - 上下文信息
 * @returns {Promise<string>} - Anna的回复
 */
async function chatWithAnna(message, context = {}) {
  console.log('调用Anna AI助手:', message);
  


  try {
    console.log('开始调用Anna AI Agent...');
    
    // 使用腾讯云Agent网关ID
    const botId = "agent-anna-7gjv69wzc7d985f7";
    console.log('🔍 使用Agent网关ID:', botId);
    
    // 调用真实的AI Agent
    const res = await wx.cloud.extend.AI.bot.sendMessage({
      data: {
        botId: botId, // 使用Agent网关ID
        // ❌ 彻底删除 threadId 这一行，让 Coze 自己去生成新会话！
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        tools: [],
        context: []
      }
    });
    
    let fullText = "";
    let chunkCount = 0;
    
    // 处理流式输出
    if (res && res.eventStream) {
      console.log('🔍 检测到 eventStream，开始读取最底层原始数据...');
      
      // 监听流式输出（直接遍历底层事件流）
      for await (let event of res.eventStream) {
        if (event && event.data) {
          try {
            // 解析 Coze 返回的 JSON
            const dataObj = JSON.parse(event.data);
            
            // 🚀 分流处理并立刻交还给前端 UI
            if (dataObj.type === 'THINKING_TEXT_MESSAGE_CONTENT') {
              console.log("🧠 提取到思考:", dataObj.delta);
              // 极其关键：调用回调函数，把字传回 index.js
              if (context && typeof context.onUpdateBubble === 'function') {
                context.onUpdateBubble(dataObj.delta, 'thinking');
              }
            } 
            else if (dataObj.type === 'TEXT_MESSAGE_CONTENT') {
              console.log("✅ 提取到正文:", dataObj.delta);
              // 极其关键：调用回调函数，把字传回 index.js
              if (context && typeof context.onUpdateBubble === 'function') {
                context.onUpdateBubble(dataObj.delta, 'content');
              }
            }
          } catch (e) {
            // 忽略心跳包或非 JSON 数据
          }
        }
      }
      
      console.log(`✅ 事件流读取完成，共处理 ${chunkCount} 个事件，总长度:`, fullText.length);
    } else if (res && res.textStream) {
      console.log('⚠️ 未检测到 eventStream，回退到 textStream...');
      
      for await (let str of res.textStream) {
        chunkCount++;
        fullText += str;
        console.log(`📝 收到第 ${chunkCount} 块数据:`, str);
      }
      
      console.log(`✅ 流读取完成，共 ${chunkCount} 块，总长度:`, fullText.length);
      
      // 🆕 保险逻辑：如果 textStream 结束时收集到的字符串为空
      if (!fullText || fullText.trim() === '') {
        console.error('❌ 警告：textStream 流式输出为空，API 可能返回了空流');

        return '抱歉，Anna暂时无法回复，请稍后再试。';
      }
    }
    
    // 🆕 修复：如果流式输出为空，尝试其他方式
    if (!fullText && res && typeof res === 'object') {
      const possibleFields = ['text', 'content', 'message', 'reply', 'result', 'data', 'answer'];
      for (const field of possibleFields) {
        if (res[field]) {
          fullText = typeof res[field] === 'string' ? res[field] : JSON.stringify(res[field]);
          break;
        }
      }
    }

    // 🆕 修复：如果还是空，尝试检查 res 本身是否是字符串
    if (!fullText && typeof res === 'string') {
      fullText = res;
    }

    // 🆕 修复：如果所有方法都失败，返回默认错误
    if (!fullText) {
      fullText = '抱歉，Anna暂时无法回复，请稍后再试。';
    }
    
    // 保存对话记录
    const chatRecord = {
      id: generateMessageId(),
      sender: 'user',
      content: message,
      timestamp: new Date().getTime(),
      context
    };
    
    const annaReply = {
      id: generateMessageId(),
      sender: 'anna',
      content: fullText,
      timestamp: new Date().getTime()
    };
    
    saveChatHistory(chatRecord);
    saveChatHistory(annaReply);
    
    return fullText;
    
  } catch (error) {
    console.error('Anna AI调用失败:', error);
    
    // 降级回复
    const fallbackReplies = [
      '我刚刚走神了，能再说一遍吗？',
      '网络有点不稳定，请稍后再试。',
      '这个问题有点复杂，让我想想...',
      '我还在学习这个知识点，换个问题问我吧！'
    ];
    
    const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    return randomReply;
  } finally {

  }
}

/**
 * 根据知识点生成推荐问题
 * @param {string} knowledgePoint - 知识点名称
 * @returns {Array<string>} - 推荐问题数组
 */
function generateSuggestedQuestions(knowledgePoint) {
  const suggestions = [
    `请详细讲解${knowledgePoint}的原理`,
    `${knowledgePoint}有哪些实际应用场景？`,
    `学习${knowledgePoint}需要注意哪些常见误区？`,
    `能给我一个${knowledgePoint}的代码示例吗？`,
    `${knowledgePoint}和它相关的知识点有什么联系？`
  ];
  
  return suggestions;
}

/**
 * 从知识图谱跳转自动生成问题
 * @param {string} knowledgePoint - 知识点名称
 * @param {string} module - 所属模块
 * @returns {string} - 自动生成的问题
 */
function autoGenerateQuestion(knowledgePoint, module) {
  return `我是一个前端学习者，正在学习${module}模块中的"${knowledgePoint}"这个知识点。请详细给我讲解这个知识点的核心原理、关键概念、常见应用场景，并给出一个实用的代码示例。`;
}

/**
 * 保存聊天记录
 */
function saveChatHistory(message) {
  try {
    let history = wx.getStorageSync(storageKey) || [];
    
    // 添加到历史记录
    history.push(message);
    
    // 限制历史记录数量
    if (history.length > maxHistory) {
      history = history.slice(history.length - maxHistory);
    }
    
    wx.setStorageSync(storageKey, history);
  } catch (error) {
    console.error('保存聊天记录失败:', error);
  }
}

/**
 * 获取聊天历史
 * @returns {Array} - 历史消息数组
 */
function getChatHistory() {
  try {
    return wx.getStorageSync(storageKey) || [];
  } catch (error) {
    return [];
  }
}

/**
 * 清空聊天历史
 */
function clearChatHistory() {
  try {
    wx.removeStorageSync(storageKey);
    return true;
  } catch (error) {
    console.error('清空聊天历史失败:', error);
    return false;
  }
}

/**
 * 生成唯一消息ID
 */
function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  chatWithAnna,
  generateSuggestedQuestions,
  autoGenerateQuestion,
  getChatHistory,
  clearChatHistory
};