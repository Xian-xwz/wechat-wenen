"""
Prompt工程模块 - 设计和管理大模型Prompt模板
"""
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class PromptConfig:
    """Prompt配置"""
    
    # 系统提示词模板
    system_template: str = """你是一名资深前端开发工程师和面试官，拥有丰富的前端面试经验。你的任务是：
1. 将前端面试简答题转换为高质量的选择题
2. 生成具有强迷惑性的错误选项，这些选项应该：
   - 基于常见的误解或易混淆概念
   - 与正确答案在知识点上相关
   - 看似合理但实际错误
   - 避免明显的错误（如拼写错误、语法错误）
3. 评估题目的难度级别：
   - easy: 基础概念题，记忆性内容为主
   - medium: 需要理解原理，有一定的应用场景
   - hard: 复杂场景、深度原理或综合应用

请严格遵循输出格式要求。"""
    
    # 用户提示词模板
    user_template: str = """原始面试题信息：
题目：{question}
原始答案：{answer}
所属分类：{category}

请将上述简答题转换为高质量的4选项单选题。

要求：
1. 保持原问题的核心考察点不变
2. 生成4个选项（1个正确答案 + 3个强迷惑性错误选项）
3. 错误选项应基于：
   - 常见误解或错误理解
   - 相关但不同的知识点
   - 部分正确但不完整的答案
   - 实际开发中容易犯的错误
4. 提供详细的答案解析，解释：
   - 为什么正确答案是正确的
   - 每个错误选项为什么是错误的
   - 相关的知识点和注意事项
5. 评估题目难度（easy/medium/hard）

输出格式要求（必须严格遵循JSON格式）：
{{
  "question": "转换后的单选题题干（使用中文）",
  "options": ["选项A内容", "选项B内容", "选项C内容", "选项D内容"],
  "correct_answer_index": 0,
  "explanation": "详细的答案解析，包括正确和错误的解释",
  "difficulty": "easy/medium/hard"
}}

注意：
- 选项内容应为纯文本，不要包含A、B、C、D等前缀
- correct_answer_index必须是0、1、2或3
- 所有内容使用中文
- 不要添加任何额外的说明或注释，只输出JSON对象"""
    
    # 批量处理提示词模板
    batch_template: str = """请将以下{count}个前端面试简答题转换为4选项单选题。

每个题目包含：
1. 原始问题
2. 原始答案
3. 所属分类

要求：
1. 为每个题目生成1个正确答案和3个强迷惑性错误选项
2. 错误选项应基于常见误解、易混淆概念或部分正确答案
3. 为每个题目评估难度（easy/medium/hard）
4. 输出严格的JSON数组格式

题目列表：
{questions_json}

输出格式要求：
[
  {{
    "question": "单选题题干1",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correct_answer_index": 0,
    "explanation": "详细解析1",
    "difficulty": "easy"
  }},
  {{
    "question": "单选题题干2",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correct_answer_index": 2,
    "explanation": "详细解析2",
    "difficulty": "medium"
  }}
  // ... 更多题目
]

请严格按照上述格式输出，不要添加任何额外的说明或注释。"""
    
    # 优化提示词（用于重试或质量改进）
    optimization_template: str = """以下是一个已生成的选择题，但需要改进：

原始题目信息：
题目：{question}
原始答案：{answer}

当前生成的选择题：
{current_json}

需要改进的地方：
{improvement_notes}

请重新生成一个改进版本，要求：
1. 保持核心考察点不变
2. 改进选项的迷惑性或准确性
3. 完善答案解析
4. 重新评估难度

输出改进后的JSON格式（与原始格式相同）。"""
    
    # 字段映射说明（用于验证）
    field_descriptions: Dict[str, str] = field(default_factory=lambda: {
        "question": "单选题题干，应清晰明确地表达问题",
        "options": "4个选项的数组，每个选项应为完整语句",
        "correct_answer_index": "正确答案的索引（0-3的整数）",
        "explanation": "详细的答案解析，解释正确和错误的原因",
        "difficulty": "难度级别：easy/medium/hard"
    })
    
    # 难度评估标准
    difficulty_criteria: Dict[str, List[str]] = field(default_factory=lambda: {
        "easy": [
            "基础概念记忆",
            "语法基础",
            "常见API用法",
            "简单的定义题"
        ],
        "medium": [
            "需要理解原理",
            "涉及多个知识点",
            "简单的应用场景",
            "常见的最佳实践"
        ],
        "hard": [
            "复杂原理深入",
            "多个知识点的综合应用",
            "性能优化相关",
            "系统设计或架构",
            "边缘情况处理"
        ]
    })
    
    def get_system_prompt(self) -> str:
        """获取系统提示词"""
        return self.system_template
    
    def get_user_prompt(
        self,
        question: str,
        answer: str,
        category: str
    ) -> str:
        """获取用户提示词"""
        return self.user_template.format(
            question=question,
            answer=answer,
            category=category
        )
    
    def get_batch_prompt(self, questions: List[Dict[str, Any]]) -> str:
        """获取批量处理提示词"""
        questions_data = []
        for q in questions:
            questions_data.append({
                "question": q.get("question", ""),
                "answer": q.get("answer", ""),
                "category": q.get("category", "")
            })
        
        return self.batch_template.format(
            count=len(questions),
            questions_json=json.dumps(questions_data, ensure_ascii=False, indent=2)
        )
    
    def get_optimization_prompt(
        self,
        question: str,
        answer: str,
        current_json: str,
        improvement_notes: str
    ) -> str:
        """获取优化提示词"""
        return self.optimization_template.format(
            question=question,
            answer=answer,
            current_json=current_json,
            improvement_notes=improvement_notes
        )


class OutputValidator:
    """输出验证器"""
    
    def __init__(self):
        self.required_fields = [
            "question", "options", "correct_answer_index", "explanation"
        ]
        self.optional_fields = ["difficulty"]
    
    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        验证大模型输出
        
        Args:
            data: 待验证的数据
            
        Returns:
            验证结果：{"valid": bool, "errors": List[str], "warnings": List[str]}
        """
        errors = []
        warnings = []
        
        # 检查必需字段
        for field in self.required_fields:
            if field not in data:
                errors.append(f"缺少必需字段: {field}")
        
        # 检查字段类型
        if "question" in data and not isinstance(data["question"], str):
            errors.append("question字段应为字符串类型")
        
        if "options" in data:
            if not isinstance(data["options"], list):
                errors.append("options字段应为数组类型")
            elif len(data["options"]) != 4:
                errors.append(f"options字段应包含4个选项，实际有{len(data['options'])}个")
            else:
                # 检查选项内容
                for i, option in enumerate(data["options"]):
                    if not isinstance(option, str):
                        errors.append(f"选项{i}应为字符串类型")
                    elif not option.strip():
                        warnings.append(f"选项{i}内容为空或仅包含空白字符")
        
        if "correct_answer_index" in data:
            if not isinstance(data["correct_answer_index"], int):
                errors.append("correct_answer_index字段应为整数类型")
            elif data["correct_answer_index"] < 0 or data["correct_answer_index"] > 3:
                errors.append(f"correct_answer_index应在0-3范围内，实际为{data['correct_answer_index']}")
        
        if "explanation" in data and not isinstance(data["explanation"], str):
            errors.append("explanation字段应为字符串类型")
        
        if "difficulty" in data:
            difficulty = data["difficulty"].lower()
            if difficulty not in ["easy", "medium", "hard"]:
                warnings.append(f"难度级别 '{difficulty}' 不是标准值 (easy/medium/hard)")
        
        # 检查选项是否重复
        if "options" in data and isinstance(data["options"], list):
            options = [opt.strip().lower() for opt in data["options"]]
            if len(options) != len(set(options)):
                warnings.append("选项内容存在重复或高度相似")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def normalize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        规范化数据
        
        Args:
            data: 待规范化的数据
            
        Returns:
            规范化后的数据
        """
        normalized = data.copy()
        
        # 确保difficulty字段存在且有效
        if "difficulty" not in normalized:
            normalized["difficulty"] = "medium"
        else:
            difficulty = normalized["difficulty"].lower()
            if difficulty not in ["easy", "medium", "hard"]:
                # 尝试推断
                if "easy" in difficulty:
                    normalized["difficulty"] = "easy"
                elif "hard" in difficulty:
                    normalized["difficulty"] = "hard"
                else:
                    normalized["difficulty"] = "medium"
        
        # 清理选项内容
        if "options" in normalized and isinstance(normalized["options"], list):
            cleaned_options = []
            for option in normalized["options"]:
                if isinstance(option, str):
                    # 移除选项前缀（如"A. "、"1. "等）
                    cleaned = option.strip()
                    if cleaned.startswith(("A.", "B.", "C.", "D.", "a.", "b.", "c.", "d.", 
                                         "1.", "2.", "3.", "4.", "A、", "B、", "C、", "D、")):
                        cleaned = cleaned[2:].strip()
                    cleaned_options.append(cleaned)
                else:
                    cleaned_options.append(str(option))
            normalized["options"] = cleaned_options
        
        # 确保correct_answer_index在有效范围内
        if "correct_answer_index" in normalized:
            index = normalized["correct_answer_index"]
            if not isinstance(index, int) or index < 0 or index > 3:
                # 尝试修复：默认为0
                normalized["correct_answer_index"] = 0
        
        return normalized


class PromptOptimizer:
    """Prompt优化器"""
    
    def __init__(self, validator: Optional[OutputValidator] = None):
        self.validator = validator or OutputValidator()
        self.common_issues = {
            "options_too_similar": "选项之间差异不够明显，需要增加迷惑性",
            "options_unrelated": "错误选项与正确答案关联性不强",
            "explanation_too_short": "答案解析不够详细",
            "difficulty_mismatch": "难度评估与实际内容不匹配",
            "question_not_clear": "题干表述不够清晰"
        }
    
    def analyze_quality(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        分析生成质量
        
        Args:
            data: 生成的数据
            
        Returns:
            质量分析结果
        """
        analysis = {
            "score": 0,  # 质量评分（0-100）
            "issues": [],
            "suggestions": []
        }
        
        # 基础验证
        validation = self.validator.validate(data)
        if not validation["valid"]:
            analysis["issues"].extend(validation["errors"])
            analysis["score"] = 0
            return analysis
        
        # 初始化分数
        score = 100
        
        # 检查题干长度
        question = data.get("question", "")
        if len(question) < 10:
            analysis["issues"].append("题干过短，可能不够清晰")
            score -= 20
        
        # 检查选项质量
        options = data.get("options", [])
        if len(options) == 4:
            # 检查选项长度差异
            lengths = [len(opt) for opt in options]
            max_len = max(lengths)
            min_len = min(lengths)
            if max_len > min_len * 3:
                analysis["issues"].append("选项长度差异过大，可能提示正确答案")
                score -= 15
            
            # 检查选项内容相似度（简单检查）
            if len(set([opt.lower()[:20] for opt in options])) < 3:
                analysis["issues"].append("选项内容过于相似")
                score -= 10
        
        # 检查答案解析
        explanation = data.get("explanation", "")
        if len(explanation) < 50:
            analysis["issues"].append("答案解析过短，可能不够详细")
            score -= 15
        
        # 检查难度一致性
        difficulty = data.get("difficulty", "medium")
        question_text = question.lower()
        
        # 简单难度评估
        hard_keywords = ["为什么", "如何实现", "原理", "机制", "优化", "性能", "安全"]
        easy_keywords = ["是什么", "定义", "简称", "全称", "哪个"]
        
        hard_count = sum(1 for kw in hard_keywords if kw in question_text)
        easy_count = sum(1 for kw in easy_keywords if kw in question_text)
        
        if difficulty == "easy" and hard_count > easy_count:
            analysis["suggestions"].append("题目可能比评估的难度更高")
        elif difficulty == "hard" and easy_count > hard_count:
            analysis["suggestions"].append("题目可能比评估的难度更低")
        
        analysis["score"] = max(0, score)
        
        # 根据问题提供建议
        if analysis["score"] < 70:
            analysis["suggestions"].append("建议重新生成以改进质量")
        elif analysis["score"] < 85:
            analysis["suggestions"].append("质量可接受，但有改进空间")
        else:
            analysis["suggestions"].append("质量良好")
        
        return analysis
    
    def generate_improvement_notes(self, analysis: Dict[str, Any]) -> str:
        """
        生成改进说明
        
        Args:
            analysis: 质量分析结果
            
        Returns:
            改进说明文本
        """
        if not analysis["issues"]:
            return "质量良好，无需改进"
        
        notes = ["检测到以下问题需要改进："]
        notes.extend([f"- {issue}" for issue in analysis["issues"]])
        
        if analysis["suggestions"]:
            notes.append("\n改进建议：")
            notes.extend([f"- {suggestion}" for suggestion in analysis["suggestions"]])
        
        return "\n".join(notes)


# 全局实例
_prompt_config: Optional[PromptConfig] = None
_output_validator: Optional[OutputValidator] = None
_prompt_optimizer: Optional[PromptOptimizer] = None


def get_prompt_config() -> PromptConfig:
    """获取全局Prompt配置实例"""
    global _prompt_config
    if _prompt_config is None:
        _prompt_config = PromptConfig()
    return _prompt_config


def get_output_validator() -> OutputValidator:
    """获取全局输出验证器实例"""
    global _output_validator
    if _output_validator is None:
        _output_validator = OutputValidator()
    return _output_validator


def get_prompt_optimizer() -> PromptOptimizer:
    """获取全局Prompt优化器实例"""
    global _prompt_optimizer
    if _prompt_optimizer is None:
        _prompt_optimizer = PromptOptimizer(get_output_validator())
    return _prompt_optimizer


def format_for_final_output(
    llm_output: Dict[str, Any],
    original_question: str,
    original_answer: str,
    category: str,
    question_id: str
) -> Dict[str, Any]:
    """
    将大模型输出格式化为最终输出格式
    
    Args:
        llm_output: 大模型输出的原始数据
        original_question: 原始问题
        original_answer: 原始答案
        category: 分类
        question_id: 题目ID
        
    Returns:
        格式化后的最终输出
    """
    # 验证和规范化
    validator = get_output_validator()
    validation_result = validator.validate(llm_output)
    
    if not validation_result["valid"]:
        logger.error(f"输出验证失败: {validation_result['errors']}")
        raise ValueError(f"输出格式无效: {validation_result['errors']}")
    
    normalized = validator.normalize(llm_output)
    
    # 构建最终输出格式（符合用户要求）
    final_output = {
        "id": question_id,
        "category": category,
        "title": normalized["question"],
        "options": normalized["options"],
        "correct": normalized["correct_answer_index"],
        "analysis": normalized["explanation"],
        "difficulty": normalized["difficulty"],
        "_meta": {
            "source_question": original_question,
            "source_answer": original_answer,
            "generation_model": "qwen-turbo",  # 可配置
            "validation_result": {
                "valid": True,
                "warnings": validation_result["warnings"]
            }
        }
    }
    
    return final_output