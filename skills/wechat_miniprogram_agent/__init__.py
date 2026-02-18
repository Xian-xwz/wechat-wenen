"""
微信小程序调用AI Agent技能模块

提供微信小程序与AI Agent集成的标准方法和最佳实践。
"""

from typing import Dict, Any, List, Optional
import json


class WechatMiniProgramAgent:
    """微信小程序AI Agent集成类"""
    
    def __init__(self):
        self.config = {
            "event_stream_handling": {
                "parse_json": True,
                "extract_delta": True,
                "debug_mode": False
            },
            "error_handling": {
                "fallback_replies": [
                    "我刚刚走神了，能再说一遍吗？",
                    "网络有点不稳定，请稍后再试。",
                    "这个问题有点复杂，让我想想...",
                    "我还在学习这个知识点，换个问题问我吧！"
                ]
            }
        }
    
    def process_event_stream(self, event_stream) -> str:
        """
        处理AI Agent的事件流，提取文本内容
        
        Args:
            event_stream: AI Agent返回的事件流
            
        Returns:
            提取的完整文本内容
        """
        full_text = ""
        
        if not event_stream:
            return full_text
            
        try:
            for event in event_stream:
                if event and event.data:
                    if isinstance(event.data, str):
                        try:
                            # 解析JSON格式
                            json_data = json.loads(event.data)
                            if json_data.get("type") in ["TEXT_MESSAGE_CONTENT", "THINKING_TEXT_MESSAGE_CONTENT"]:
                                full_text += json_data.get("delta", "")
                        except json.JSONDecodeError:
                            # 如果不是JSON，直接追加
                            full_text += event.data
                    elif isinstance(event.data, dict):
                        # 处理字典格式的数据
                        full_text += event.data.get("text", event.data.get("content", ""))
                        
        except Exception as e:
            if self.config["event_stream_handling"]["debug_mode"]:
                print(f"事件流处理错误: {e}")
                
        return full_text
    
    def get_fallback_reply(self) -> str:
        """获取降级回复"""
        import random
        replies = self.config["error_handling"]["fallback_replies"]
        return random.choice(replies)
    
    def format_agent_response(self, raw_text: str) -> str:
        """
        格式化AI Agent的回复，去除冗余信息
        
        Args:
            raw_text: 原始回复文本
            
        Returns:
            格式化后的回复文本
        """
        if not raw_text:
            return self.get_fallback_reply()
            
        # 去除流式输出中的重复内容
        lines = raw_text.split('\n')
        cleaned_lines = []
        seen_content = set()
        
        for line in lines:
            line = line.strip()
            if line and line not in seen_content:
                cleaned_lines.append(line)
                seen_content.add(line)
                
        return '\n'.join(cleaned_lines)


# 导出便捷函数
def create_miniprogram_agent() -> WechatMiniProgramAgent:
    """创建微信小程序AI Agent实例"""
    return WechatMiniProgramAgent()


def process_agent_stream(event_stream) -> str:
    """处理AI Agent事件流的便捷函数"""
    agent = create_miniprogram_agent()
    return agent.process_event_stream(event_stream)


def format_agent_reply(raw_text: str) -> str:
    """格式化AI Agent回复的便捷函数"""
    agent = create_miniprogram_agent()
    return agent.format_agent_response(raw_text)