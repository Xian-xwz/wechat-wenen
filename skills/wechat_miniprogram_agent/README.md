# 微信小程序AI Agent集成技能

提供微信小程序与AI Agent集成的标准方法和最佳实践。

## 功能特性

- ✅ 事件流处理与JSON解析
- ✅ 智能降级回复机制
- ✅ 回复内容格式化去重
- ✅ 调试模式开关
- ✅ 错误处理与容错

## 使用方法

### 1. 基础用法

```python
from skills.wechat_miniprogram_agent import create_miniprogram_agent

# 创建Agent实例
agent = create_miniprogram_agent()

# 处理事件流
raw_text = agent.process_event_stream(event_stream)

# 格式化回复
formatted_reply = agent.format_agent_response(raw_text)
```

### 2. 便捷函数

```python
from skills.wechat_miniprogram_agent import process_agent_stream, format_agent_reply

# 一行代码处理
formatted_reply = format_agent_reply(process_agent_stream(event_stream))
```

### 3. 微信小程序集成示例

```javascript
// pages/chat/index.js
const { processAgentStream, formatAgentReply } = require('../../skills/wechat_miniprogram_agent');

async function handleAgentResponse(res) {
  try {
    // 处理事件流
    let eventText = "";
    
    for await (let event of res.eventStream) {
      if (event && event.data) {
        if (typeof event.data === 'string') {
          try {
            const jsonData = JSON.parse(event.data);
            if (jsonData.type === 'TEXT_MESSAGE_CONTENT' || 
                jsonData.type === 'THINKING_TEXT_MESSAGE_CONTENT') {
              eventText += jsonData.delta || '';
            }
          } catch (e) {
            eventText += event.data;
          }
        }
      }
    }
    
    // 格式化回复
    const reply = formatAgentReply(eventText);
    
    this.setData({
      reply: reply
    });
    
  } catch (error) {
    console.error('AI回复处理失败:', error);
    this.setData({
      reply: '网络有点不稳定，请稍后再试。'
    });
  }
}
```

## 配置选项

```python
agent = create_miniprogram_agent()

# 配置事件流处理
agent.config["event_stream_handling"]["debug_mode"] = False  # 关闭调试模式

# 自定义降级回复
agent.config["error_handling"]["fallback_replies"] = [
    "我刚刚走神了，能再说一遍吗？",
    "网络有点不稳定，请稍后再试。"
]
```

## 最佳实践

### 1. 事件流处理
- 始终使用try-catch处理JSON解析
- 优先提取`delta`字段作为文本内容
- 处理多种事件类型

### 2. 回复格式化
- 去除重复内容
- 清理多余的换行和空格
- 保持回复的自然流畅性

### 3. 错误处理
- 网络异常时使用降级回复
- 记录错误日志便于调试
- 提供用户友好的错误提示

## 文件结构

```
wechat_miniprogram_agent/
├── __init__.py          # 核心功能实现
├── README.md            # 使用文档
└── examples/            # 示例代码
    ├── miniprogram.js   # 小程序示例
    └── backend.py       # 后端示例
```