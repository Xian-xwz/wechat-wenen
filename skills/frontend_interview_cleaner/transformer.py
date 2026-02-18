"""
数据映射转换模块 - 将大模型输出转换为小程序quiz格式
"""

import json
import logging
from typing import Dict, List, Any, Optional
import hashlib

logger = logging.getLogger(__name__)


def generate_question_id(question_text: str, category: str) -> str:
    """
    基于问题文本和分类生成唯一ID
    
    Args:
        question_text: 问题文本
        category: 分类
        
    Returns:
        唯一ID字符串
    """
    # 使用MD5生成哈希，保证唯一性
    content = f"{category}:{question_text}"
    return hashlib.md5(content.encode('utf-8')).hexdigest()[:16]


def estimate_difficulty_from_content(question: str, answer: str) -> str:
    """
    基于问题和答案内容估计难度
    
    Args:
        question: 问题文本
        answer: 答案文本
        
    Returns:
        难度级别: easy, medium, hard
    """
    question_lower = question.lower()
    answer_lower = answer.lower()
    
    # 难度关键词
    easy_keywords = [
        "是什么", "定义", "解释", "简述", "简单", "基础", "哪个", "谁",
        "what is", "define", "explain briefly", "basic", "simple"
    ]
    
    hard_keywords = [
        "为什么", "如何实现", "原理", "机制", "优化", "性能", "安全", "设计",
        "how would you", "implement", "optimize", "compare and contrast",
        "design a system", "explain in detail", "advantages and disadvantages"
    ]
    
    # 统计关键词出现次数
    easy_count = sum(1 for kw in easy_keywords if kw in question_lower)
    hard_count = sum(1 for kw in hard_keywords if kw in question_lower)
    
    # 基于答案长度和复杂度
    answer_length = len(answer)
    answer_lines = answer.count('\n') + 1
    
    # 评估逻辑
    if easy_count > 0 and answer_length < 300 and answer_lines < 5:
        return "easy"
    elif hard_count > 0 or answer_length > 500 or answer_lines > 10:
        return "hard"
    else:
        return "medium"


def extract_tags(question: str, answer: str) -> List[str]:
    """
    从问题和答案中提取标签
    
    Args:
        question: 问题文本
        answer: 答案文本
        
    Returns:
        标签列表
    """
    tags = []
    
    # 常见前端标签
    frontend_tags = {
        "javascript": ["js", "javascript", "ecmascript"],
        "html": ["html", "标记语言", "标签"],
        "css": ["css", "样式", "布局"],
        "react": ["react", "组件", "hooks"],
        "vue": ["vue", "响应式", "指令"],
        "typescript": ["typescript", "ts", "类型"],
        "es6": ["es6", "es2015", "箭头函数", "promise"],
        "dom": ["dom", "文档对象模型"],
        "bom": ["bom", "浏览器对象模型"],
        "ajax": ["ajax", "异步", "fetch"],
        "webpack": ["webpack", "打包", "模块"],
        "性能": ["性能", "优化", "缓存", "加载"],
        "安全": ["安全", "xss", "csrf", "注入"],
        "兼容性": ["兼容性", "浏览器", "polyfill"]
    }
    
    content = (question + " " + answer).lower()
    
    # 检查每个标签
    for tag, keywords in frontend_tags.items():
        for keyword in keywords:
            if keyword in content:
                tags.append(tag)
                break  # 避免重复
    
    # 去重并返回
    return list(set(tags))


def transform_llm_output_to_quiz_format(
    llm_output: Dict[str, Any],
    original_question: str,
    original_answer: str,
    category: str,
    question_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    将大模型输出转换为小程序quiz格式
    
    Args:
        llm_output: 大模型输出的原始数据，应包含question, options, correct_answer_index, explanation字段
        original_question: 原始问题（简答题）
        original_answer: 原始答案
        category: 分类（javascript/html/css）
        question_id: 可选的题目ID，如果为None则自动生成
        
    Returns:
        符合小程序quiz格式的数据字典
        
    Raises:
        ValueError: 如果llm_output缺少必需字段或格式无效
    """
    # 必需字段检查
    required_fields = ["question", "options", "correct_answer_index", "explanation"]
    missing_fields = [field for field in required_fields if field not in llm_output]
    
    if missing_fields:
        raise ValueError(f"缺少必需字段: {missing_fields}")
    
    # 验证选项数量
    options = llm_output["options"]
    if not isinstance(options, list) or len(options) != 4:
        raise ValueError(f"选项数量不正确: 期望4个，实际{len(options) if isinstance(options, list) else '非列表'}")
    
    # 验证正确答案索引
    correct_index = llm_output["correct_answer_index"]
    if not isinstance(correct_index, int) or correct_index < 0 or correct_index > 3:
        raise ValueError(f"正确答案索引无效: {correct_index}，应为0-3的整数")
    
    # 生成题目ID（如果未提供）
    if question_id is None:
        question_id = generate_question_id(original_question, category)
    
    # 获取难度（如果llm_output中有则使用，否则估计）
    difficulty = llm_output.get("difficulty")
    if difficulty not in ["easy", "medium", "hard"]:
        # 使用估计难度
        difficulty = estimate_difficulty_from_content(original_question, original_answer)
    
    # 提取标签
    tags = extract_tags(original_question, original_answer)
    
    # 构建最终输出格式（完全符合用户要求）
    final_output = {
        "id": question_id,
        "category": category,
        "title": llm_output["question"],
        "type": "单选题",  # 添加用户要求的type字段
        "options": options,
        "correct": correct_index,
        "analysis": llm_output["explanation"],
        "difficulty": difficulty,
        "_meta": {
            "source_question": original_question,
            "source_answer": original_answer,
            "generation_model": llm_output.get("generation_model", "qwen-turbo"),
            "validation_status": "validated"
        }
    }
    
    # 添加标签（如果非空）
    if tags:
        final_output["tags"] = tags
    
    return final_output


def transform_batch_llm_outputs(
    llm_outputs: List[Dict[str, Any]],
    original_questions: List[Dict[str, Any]],
    category: str
) -> List[Dict[str, Any]]:
    """
    批量转换大模型输出
    
    Args:
        llm_outputs: 大模型输出列表，每个元素应包含success, data等字段
        original_questions: 原始问题列表，每个元素应包含question, answer字段
        category: 分类
        
    Returns:
        转换后的quiz格式数据列表
    """
    transformed_results = []
    
    for i, llm_result in enumerate(llm_outputs):
        if i >= len(original_questions):
            logger.warning(f"索引超出范围: i={i}, 原始问题数量={len(original_questions)}")
            break
        
        if not llm_result.get("success", False):
            logger.warning(f"跳过失败的第{i}个问题")
            continue
        
        llm_data = llm_result.get("data")
        if not llm_data:
            logger.warning(f"第{i}个问题没有数据")
            continue
        
        original_q = original_questions[i]
        
        try:
            transformed = transform_llm_output_to_quiz_format(
                llm_output=llm_data,
                original_question=original_q.get("question", ""),
                original_answer=original_q.get("answer", ""),
                category=category
            )
            transformed_results.append(transformed)
            logger.debug(f"成功转换第{i}个问题")
            
        except ValueError as e:
            logger.error(f"转换第{i}个问题失败: {e}")
        except Exception as e:
            logger.error(f"转换第{i}个问题时发生未知错误: {e}")
    
    logger.info(f"批量转换完成: 成功{len(transformed_results)}/{len(llm_outputs)}")
    return transformed_results


def create_quiz_metadata(questions: List[Dict[str, Any]], version: str = "1.0.0") -> Dict[str, Any]:
    """
    创建quiz的元数据
    
    Args:
        questions: 问题列表
        version: 版本号
        
    Returns:
        元数据字典
    """
    categories = list(set(q.get("category", "Unknown") for q in questions))
    
    return {
        "version": version,
        "source": "front-end-interview-handbook",
        "total_questions": len(questions),
        "categories": categories,
        "format": "quiz",
        "generated_at": json.loads(json.dumps({"timestamp": "placeholder"}, default=str))
    }


def create_final_output(questions: List[Dict[str, Any]], version: str = "1.0.0") -> Dict[str, Any]:
    """
    创建最终的输出结构
    
    Args:
        questions: 转换后的问题列表
        version: 版本号
        
    Returns:
        最终输出结构
    """
    import time
    
    metadata = create_quiz_metadata(questions, version)
    metadata["generated_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    
    return {
        "metadata": metadata,
        "questions": questions
    }