"""
大模型API客户端模块 - 实现OpenAI兼容的API调用
支持DashScope通义千问和其他OpenAI兼容API
"""
import json
import os
import asyncio
import time
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor
import httpx

from .config import get_config

logger = logging.getLogger(__name__)


@dataclass
class LLMRequest:
    """大模型请求数据"""
    question: str
    answer: str
    category: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "question": self.question,
            "answer": self.answer,
            "category": self.category,
            "metadata": self.metadata
        }


@dataclass
class LLMResponse:
    """大模型响应数据"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    request_data: Optional[Dict[str, Any]] = None
    latency: float = 0.0
    
    def get_question(self) -> Optional[str]:
        """获取生成的单选题题干"""
        if self.success and self.data:
            return self.data.get("question")
        return None
    
    def get_options(self) -> Optional[List[str]]:
        """获取生成的选项列表"""
        if self.success and self.data:
            return self.data.get("options")
        return None
    
    def get_correct_index(self) -> Optional[int]:
        """获取正确答案索引"""
        if self.success and self.data:
            return self.data.get("correct_answer_index")
        return None
    
    def get_explanation(self) -> Optional[str]:
        """获取答案解析"""
        if self.success and self.data:
            return self.data.get("explanation")
        return None
    
    def get_difficulty(self) -> Optional[str]:
        """获取难度评估"""
        if self.success and self.data:
            return self.data.get("difficulty")
        return None


class LLMClient:
    """大模型API客户端"""
    
    def __init__(self):
        self.config = get_config()
        self.llm_config = self.config.llm
        self.processing_config = self.config.processing
        
        # HTTP客户端配置
        self.timeout = httpx.Timeout(
            timeout=self.llm_config.timeout,
            connect=10.0
        )
        
        # 请求头
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.llm_config.api_key}"
        }
        
        # 如果是DashScope，需要额外头部
        if "dashscope.aliyuncs.com" in self.llm_config.base_url:
            self.headers["X-DashScope-SSE"] = "disable"
        
        logger.info(f"LLM客户端初始化: model={self.llm_config.model}, base_url={self.llm_config.base_url}")
    
    async def _make_request(
        self, 
        prompt: str,
        system_prompt: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        发送API请求
        
        Args:
            prompt: 用户提示词
            system_prompt: 系统提示词
            
        Returns:
            API响应或None（如果失败）
        """
        start_time = time.time()
        
        # 构建请求数据
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        request_data = {
            "model": self.llm_config.model,
            "messages": messages,
            "temperature": self.llm_config.temperature,
            "max_tokens": self.llm_config.max_tokens,
            "response_format": {"type": "json_object"}
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url=self.llm_config.base_url,
                    headers=self.headers,
                    json=request_data
                )
                
                latency = time.time() - start_time
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    if content:
                        try:
                            # 尝试解析JSON
                            parsed = json.loads(content)
                            logger.info(f"API请求成功: latency={latency:.2f}s")
                            return parsed
                        except json.JSONDecodeError as e:
                            logger.error(f"JSON解析失败: {e}, content: {content[:200]}")
                            return None
                    else:
                        logger.error(f"API响应内容为空")
                        return None
                else:
                    latency = time.time() - start_time
                    error_msg = f"API请求失败: status={response.status_code}, error={response.text}"
                    logger.error(f"{error_msg}, latency={latency:.2f}s")
                    return None
                    
        except httpx.TimeoutException:
            latency = time.time() - start_time
            logger.error(f"API请求超时: latency={latency:.2f}s")
            return None
            
        except httpx.RequestError as e:
            latency = time.time() - start_time
            logger.error(f"API请求错误: {e}, latency={latency:.2f}s")
            return None
            
        except Exception as e:
            latency = time.time() - start_time
            logger.error(f"未知错误: {e}, latency={latency:.2f}s")
            return None
    
    async def generate_single_choice(
        self, 
        request: LLMRequest
    ) -> LLMResponse:
        """
        为单个问题生成单选题
        
        Args:
            request: 包含问题、答案和分类的请求数据
            
        Returns:
            LLMResponse: 包含生成结果或错误的响应
        """
        start_time = time.time()
        
        # 从prompt_engineer模块导入Prompt模板
        # 这里使用临时模板，后续会从prompt_engineer模块导入
        system_prompt = """你是一名专业的前端面试官，擅长将简答题转换为高质量的选择题。
要求：
1. 生成4个选项，其中1个为正确答案，3个为强迷惑性错误选项
2. 错误选项必须：与知识点相关、常见错误理解、看似合理但实际错误
3. 输出严格的JSON格式：{"question": "...", "options": ["选项A", "选项B", "选项C", "选项D"], "correct_answer_index": 0, "explanation": "...", "difficulty": "easy/medium/hard"}
4. 所有内容使用中文
5. 评估题目难度：easy（基础概念）、medium（需要理解原理）、hard（复杂场景或深度原理）"""
        
        user_prompt = f"""原始简答题：
题目：{request.question}
答案：{request.answer}
知识点分类：{request.category}

请将上述简答题转换为高质量的4选项单选题。
要求生成3个具有强迷惑性的错误选项，这些选项应该基于常见的误解或易混淆的概念。

请严格按照指定的JSON格式输出。"""
        
        logger.info(f"开始生成单选题: question='{request.question[:50]}...'")
        
        # 发送请求
        result = await self._make_request(user_prompt, system_prompt)
        latency = time.time() - start_time
        
        if result:
            # 验证必需字段
            required_fields = ["question", "options", "correct_answer_index", "explanation"]
            missing_fields = [field for field in required_fields if field not in result]
            
            if missing_fields:
                error_msg = f"响应缺少必需字段: {missing_fields}"
                logger.error(error_msg)
                return LLMResponse(
                    success=False,
                    error=error_msg,
                    request_data=request.to_dict(),
                    latency=latency
                )
            
            # 验证选项数量
            options = result.get("options", [])
            if len(options) != 4:
                error_msg = f"选项数量不正确: 期望4个，实际{len(options)}个"
                logger.error(error_msg)
                return LLMResponse(
                    success=False,
                    error=error_msg,
                    request_data=request.to_dict(),
                    latency=latency
                )
            
            # 验证正确答案索引
            correct_index = result.get("correct_answer_index")
            if not isinstance(correct_index, int) or correct_index < 0 or correct_index > 3:
                error_msg = f"正确答案索引无效: {correct_index}，应为0-3的整数"
                logger.error(error_msg)
                return LLMResponse(
                    success=False,
                    error=error_msg,
                    request_data=request.to_dict(),
                    latency=latency
                )
            
            # 验证难度字段（如果有）
            difficulty = result.get("difficulty", "medium")
            if difficulty not in ["easy", "medium", "hard"]:
                result["difficulty"] = "medium"
                logger.warning(f"难度字段无效: {difficulty}，使用默认值'medium'")
            
            logger.info(f"单选题生成成功: latency={latency:.2f}s, difficulty={result.get('difficulty', 'medium')}")
            return LLMResponse(
                success=True,
                data=result,
                request_data=request.to_dict(),
                latency=latency
            )
        else:
            error_msg = "API请求失败，无有效响应"
            logger.error(error_msg)
            return LLMResponse(
                success=False,
                error=error_msg,
                request_data=request.to_dict(),
                latency=latency
            )
    
    async def batch_generate_choices(
        self, 
        requests: List[LLMRequest],
        max_workers: int = 3
    ) -> List[LLMResponse]:
        """
        批量生成单选题
        
        Args:
            requests: 请求数据列表
            max_workers: 最大并发数
            
        Returns:
            响应列表，顺序与请求列表一致
        """
        logger.info(f"开始批量生成: 共{len(requests)}个问题，并发数={max_workers}")
        
        # 使用信号量限制并发
        semaphore = asyncio.Semaphore(max_workers)
        
        async def process_with_semaphore(request: LLMRequest) -> LLMResponse:
            async with semaphore:
                return await self.generate_single_choice(request)
        
        # 创建任务
        tasks = [process_with_semaphore(request) for request in requests]
        
        # 并发执行
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常结果
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"处理第{i}个请求时发生异常: {result}")
                processed_results.append(LLMResponse(
                    success=False,
                    error=f"处理异常: {str(result)}",
                    request_data=requests[i].to_dict() if i < len(requests) else None
                ))
            else:
                processed_results.append(result)
        
        # 统计成功率
        success_count = sum(1 for r in processed_results if r.success)
        logger.info(f"批量生成完成: 成功{success_count}/{len(requests)}，成功率{success_count/len(requests)*100:.1f}%")
        
        return processed_results


class ErrorLogger:
    """错误日志管理器"""
    
    def __init__(self, log_file: str = "error_log.json"):
        self.log_file = log_file
        self.errors: List[Dict[str, Any]] = []
        
        # 加载现有错误日志
        self._load_existing_logs()
    
    def _load_existing_logs(self):
        """加载现有错误日志"""
        try:
            if os.path.exists(self.log_file):
                with open(self.log_file, 'r', encoding='utf-8') as f:
                    self.errors = json.load(f)
                logger.info(f"已加载{len(self.errors)}条现有错误记录")
        except Exception as e:
            logger.error(f"加载错误日志失败: {e}")
            self.errors = []
    
    def log_error(
        self,
        request_data: Dict[str, Any],
        error_message: str,
        timestamp: Optional[str] = None
    ):
        """
        记录错误
        
        Args:
            request_data: 请求数据
            error_message: 错误信息
            timestamp: 时间戳（可选）
        """
        if timestamp is None:
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        
        error_record = {
            "timestamp": timestamp,
            "request_data": request_data,
            "error_message": error_message
        }
        
        self.errors.append(error_record)
        logger.warning(f"记录错误: {error_message}")
        
        # 定期保存
        if len(self.errors) % 10 == 0:
            self.save()
    
    def save(self):
        """保存错误日志到文件"""
        try:
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(self.errors, f, indent=2, ensure_ascii=False)
            logger.info(f"错误日志已保存: {self.log_file} (共{len(self.errors)}条记录)")
        except Exception as e:
            logger.error(f"保存错误日志失败: {e}")
    
    def get_errors(self) -> List[Dict[str, Any]]:
        """获取所有错误记录"""
        return self.errors
    
    def clear(self):
        """清空错误日志"""
        self.errors = []
        self.save()
        logger.info("错误日志已清空")


# 全局客户端实例
_client: Optional[LLMClient] = None
_error_logger: Optional[ErrorLogger] = None


def get_client() -> LLMClient:
    """获取全局LLM客户端实例（单例模式）"""
    global _client
    if _client is None:
        _client = LLMClient()
    return _client


def get_error_logger() -> ErrorLogger:
    """获取全局错误日志管理器（单例模式）"""
    global _error_logger
    if _error_logger is None:
        config = get_config()
        _error_logger = ErrorLogger(config.processing.error_log_file)
    return _error_logger


async def process_question(
    question: str,
    answer: str,
    category: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    处理单个问题的便捷函数
    
    Args:
        question: 原始问题
        answer: 原始答案
        category: 分类
        metadata: 额外元数据
        
    Returns:
        处理结果字典，包含成功状态和数据
    """
    client = get_client()
    error_logger = get_error_logger()
    
    request = LLMRequest(
        question=question,
        answer=answer,
        category=category,
        metadata=metadata or {}
    )
    
    response = await client.generate_single_choice(request)
    
    if not response.success:
        # 记录错误但不生成垃圾数据
        error_logger.log_error(
            request_data=request.to_dict(),
            error_message=response.error or "未知错误"
        )
    
    return {
        "success": response.success,
        "data": response.data if response.success else None,
        "error": response.error if not response.success else None,
        "latency": response.latency,
        "request_data": request.to_dict()
    }


async def process_batch(
    questions: List[Dict[str, Any]],
    category: str
) -> List[Dict[str, Any]]:
    """
    批量处理问题的便捷函数
    
    Args:
        questions: 问题列表，每个元素包含question和answer字段
        category: 分类
        
    Returns:
        处理结果列表
    """
    client = get_client()
    error_logger = get_error_logger()
    
    # 创建请求列表
    requests = []
    for i, q in enumerate(questions):
        request = LLMRequest(
            question=q.get("question", ""),
            answer=q.get("answer", ""),
            category=category,
            metadata={"index": i, "original_title": q.get("title", "")}
        )
        requests.append(request)
    
    # 批量生成
    responses = await client.batch_generate_choices(requests)
    
    # 记录错误
    for response in responses:
        if not response.success and response.request_data:
            error_logger.log_error(
                request_data=response.request_data,
                error_message=response.error or "批量处理失败"
            )
    
    # 构建结果
    results = []
    for response in responses:
        results.append({
            "success": response.success,
            "data": response.data if response.success else None,
            "error": response.error if not response.success else None,
            "latency": response.latency,
            "request_data": response.request_data
        })
    
    # 保存错误日志
    error_logger.save()
    
    return results


def get_error_summary() -> Dict[str, Any]:
    """获取错误摘要"""
    error_logger = get_error_logger()
    errors = error_logger.get_errors()
    
    return {
        "total_errors": len(errors),
        "errors_by_category": {},
        "recent_errors": errors[-10:] if errors else []
    }