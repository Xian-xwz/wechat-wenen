"""
工具函数模块 - 提供常用工具函数
"""
import json
import re
import hashlib
import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from pathlib import Path
import time

logger = logging.getLogger(__name__)


def generate_question_id(question_text: str, category: str = "") -> str:
    """
    生成题目唯一ID
    
    Args:
        question_text: 题目文本
        category: 分类（可选）
        
    Returns:
        唯一ID字符串
    """
    # 使用SHA-256哈希生成唯一ID
    content = f"{category}:{question_text}"
    hash_obj = hashlib.sha256(content.encode('utf-8'))
    
    # 取前12个字符作为ID
    return hash_obj.hexdigest()[:12]


def extract_summary(text: str, max_length: int = 200) -> str:
    """
    提取文本摘要
    
    Args:
        text: 原始文本
        max_length: 最大长度
        
    Returns:
        摘要文本
    """
    if not text:
        return ""
    
    # 移除代码块标记
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    
    # 移除HTML标签
    text = re.sub(r'<[^>]+>', '', text)
    
    # 移除多余的空白字符
    text = re.sub(r'\s+', ' ', text).strip()
    
    # 截断
    if len(text) <= max_length:
        return text
    
    # 在完整句子处截断
    truncated = text[:max_length]
    last_period = truncated.rfind('.')
    last_question = truncated.rfind('?')
    last_exclamation = truncated.rfind('!')
    
    cutoff = max(last_period, last_question, last_exclamation)
    if cutoff > max_length * 0.5:  # 确保截断点不要太靠前
        return truncated[:cutoff+1]
    
    return truncated + "..."


def sanitize_markdown(text: str) -> str:
    """
    清理Markdown文本中的特殊格式
    
    Args:
        text: Markdown文本
        
    Returns:
        清理后的文本
    """
    if not text:
        return ""
    
    # 移除代码块标记但保留内容
    text = re.sub(r'```(\w+)?\n', '', text)
    text = re.sub(r'```\n?', '', text)
    
    # 移除行内代码标记
    text = re.sub(r'`([^`]+)`', r'\1', text)
    
    # 移除链接格式但保留文本
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    
    # 移除图片标记
    text = re.sub(r'!\[([^\]]*)\]\([^)]+\)', '', text)
    
    # 移除标题标记但保留文本
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    
    # 移除列表标记但保留文本
    text = re.sub(r'^[\*\-\+]\s*', '', text, flags=re.MULTILINE)
    
    # 移除引用标记
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)
    
    # 移除表格标记
    text = re.sub(r'^\|.*\|$', '', text, flags=re.MULTILINE)
    
    # 移除多余的空白行
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    return text.strip()


def estimate_difficulty(answer: str) -> str:
    """
    根据答案内容估计难度
    
    Args:
        answer: 答案文本
        
    Returns:
        难度级别: easy, medium, hard
    """
    if not answer:
        return "medium"
    
    # 计算文本长度（字符数）
    length = len(answer)
    
    # 计算代码块数量
    code_blocks = len(re.findall(r'```', answer))
    
    # 计算复杂术语（专业术语）
    complex_terms = len(re.findall(
        r'\b(closure|prototype|event delegation|hoisting|currying|memoization|'
        r'debouncing|throttling|virtual DOM|shadow DOM|webpack|babel|'
        r'reactivity|observable|promise|async|await|generator|iterator)\b',
        answer,
        re.IGNORECASE
    ))
    
    # 基于规则评估难度
    if length < 200 and code_blocks == 0 and complex_terms <= 1:
        return "easy"
    elif length >= 500 or code_blocks >= 2 or complex_terms >= 3:
        return "hard"
    else:
        return "medium"


def extract_tags(title: str, answer: str) -> List[str]:
    """
    从题目和答案中提取标签
    
    Args:
        title: 题目标题
        answer: 答案内容
        
    Returns:
        标签列表
    """
    tags = set()
    
    # 从标题中提取关键词
    title_lower = title.lower()
    
    # 常见前端领域标签
    domain_keywords = [
        "javascript", "js", "es6", "ecmascript",
        "html", "css", "dom", "bom",
        "react", "vue", "angular", "svelte",
        "node", "express", "koa",
        "webpack", "babel", "vite", "rollup",
        "typescript", "ts",
        "testing", "jest", "mocha", "cypress",
        "performance", "optimization", "security",
        "responsive", "accessibility", "seo"
    ]
    
    # 从标题中匹配关键词
    for keyword in domain_keywords:
        if keyword in title_lower:
            tags.add(keyword)
    
    # 从答案中提取概念标签
    answer_lower = answer.lower()
    concept_keywords = [
        "闭包", "原型", "继承", "事件委托", "事件冒泡", "事件捕获",
        "异步", "同步", "回调", "promise", "async/await",
        "作用域", "变量提升", "this", "绑定",
        "模块化", "组件化", "状态管理", "路由",
        "虚拟DOM", "diff算法", "生命周期",
        "响应式", "观察者", "发布订阅",
        "防抖", "节流", "缓存", "懒加载"
    ]
    
    for keyword in concept_keywords:
        if keyword in answer_lower:
            # 将中文标签转换为英文或保留中文
            if keyword == "闭包":
                tags.add("closure")
            elif keyword == "原型":
                tags.add("prototype")
            elif keyword == "事件委托":
                tags.add("event-delegation")
            else:
                tags.add(keyword)
    
    # 如果没有提取到标签，添加通用标签
    if not tags:
        tags.add("frontend-basics")
    
    return sorted(list(tags))


def save_json(data: Any, filepath: Union[str, Path], indent: int = 2) -> bool:
    """
    保存数据到JSON文件
    
    Args:
        data: 要保存的数据
        filepath: 文件路径
        indent: 缩进空格数
        
    Returns:
        保存是否成功
    """
    try:
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=indent, ensure_ascii=False)
        
        logger.debug(f"数据已保存到: {filepath}")
        return True
        
    except Exception as e:
        logger.error(f"保存JSON失败: {e}")
        return False


def load_json(filepath: Union[str, Path]) -> Optional[Any]:
    """
    从JSON文件加载数据
    
    Args:
        filepath: 文件路径
        
    Returns:
        加载的数据或None（如果失败）
    """
    try:
        filepath = Path(filepath)
        
        if not filepath.exists():
            logger.warning(f"文件不存在: {filepath}")
            return None
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.debug(f"从文件加载数据: {filepath}")
        return data
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON解析失败: {e}")
        return None
        
    except Exception as e:
        logger.error(f"加载JSON失败: {e}")
        return None


def format_timestamp(timestamp: Optional[float] = None) -> str:
    """
    格式化时间戳
    
    Args:
        timestamp: Unix时间戳（秒），默认为当前时间
        
    Returns:
        格式化后的时间字符串
    """
    if timestamp is None:
        timestamp = time.time()
    
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(timestamp))


def retry_with_backoff(
    func,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0
):
    """
    重试装饰器，带指数退避
    
    Args:
        func: 要重试的函数
        max_retries: 最大重试次数
        base_delay: 基础延迟（秒）
        max_delay: 最大延迟（秒）
        
    Returns:
        装饰后的函数
    """
    import functools
    
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                
                if attempt == max_retries:
                    break
                
                # 计算退避时间
                delay = min(base_delay * (2 ** attempt), max_delay)
                logger.warning(f"函数 {func.__name__} 第{attempt+1}次失败: {e}, {delay}秒后重试")
                
                time.sleep(delay)
        
        # 所有重试都失败
        raise last_exception
    
    return wrapper


class Timer:
    """简单的计时器类"""
    
    def __init__(self, name: str = "操作"):
        self.name = name
        self.start_time = None
        self.end_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        logger.info(f"开始 {self.name}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.time()
        elapsed = self.end_time - self.start_time
        status = "完成" if exc_type is None else "失败"
        logger.info(f"{self.name} {status}: 耗时{elapsed:.2f}秒")
    
    def elapsed(self) -> float:
        """获取经过的时间（秒）"""
        if self.start_time is None:
            return 0.0
        if self.end_time is None:
            return time.time() - self.start_time
        return self.end_time - self.start_time