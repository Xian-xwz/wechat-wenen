"""
frontend-interview-cleaner - 前端面试题清洗工具
将 front-end-interview-handbook 的 Markdown 简答题转换为小程序可用的选择题题库

用法:
    python -m skills.frontend_interview_cleaner.cli [命令] [选项]
    
    或
    
    python skills/frontend_interview_cleaner/cli.py [命令] [选项]

命令:
    pipeline    运行完整清洗管道（生成 + 导出）
    generate    仅生成选择题
    test        测试API连接和配置

示例:
    python -m skills.frontend_interview_cleaner.cli pipeline
    python -m skills.frontend_interview_cleaner.cli test
"""
__version__ = "1.0.0"
__author__ = "个性化学习辅助小程序项目组"

from .config import get_config, init_config, AppConfig
from .llm_client import (
    LLMRequest, LLMResponse, LLMClient, ErrorLogger,
    get_client, get_error_logger, process_question, process_batch, get_error_summary
)
from .prompt_engineer import (
    PromptConfig, OutputValidator, PromptOptimizer,
    get_prompt_config, get_output_validator, get_prompt_optimizer
)
from .transformer import (
    transform_llm_output_to_quiz_format,
    transform_batch_llm_outputs,
    generate_question_id,
    estimate_difficulty_from_content,
    extract_tags
)
from .generator import (
    QuestionGenerator, QuestionExporter,
    get_generator, get_exporter,
    generate_questions, export_questions
)
from .utils import (
    extract_summary, sanitize_markdown,
    save_json, load_json
)

__all__ = [
    # 配置模块
    "get_config", "init_config", "AppConfig",
    
    # LLM客户端模块
    "LLMRequest", "LLMResponse", "LLMClient", "ErrorLogger",
    "get_client", "get_error_logger", "process_question", "process_batch", "get_error_summary",
    
    # Prompt工程模块
    "PromptConfig", "OutputValidator", "PromptOptimizer",
    "get_prompt_config", "get_output_validator", "get_prompt_optimizer",
    
    # 数据转换模块
    "transform_llm_output_to_quiz_format",
    "transform_batch_llm_outputs",
    "generate_question_id",
    "estimate_difficulty_from_content",
    "extract_tags",
    
    # 生成器模块
    "QuestionGenerator", "QuestionExporter",
    "get_generator", "get_exporter",
    "generate_questions", "export_questions",
    
    # 工具模块
    "extract_summary", "sanitize_markdown",
    "save_json", "load_json"
]