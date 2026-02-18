"""
配置管理模块 - 负责加载环境变量和应用配置
"""
import os
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from pathlib import Path
import json
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class LLMConfig:
    """大模型配置"""
    api_key: str = ""
    base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    model: str = "qwen-turbo"
    temperature: float = 0.3
    max_tokens: int = 2000
    timeout: int = 30
    
    def validate(self) -> bool:
        """验证配置有效性"""
        if not self.api_key:
            logger.error("API密钥不能为空")
            return False
        if self.temperature < 0 or self.temperature > 1:
            logger.error(f"temperature值必须在0-1之间，当前值: {self.temperature}")
            return False
        return True


@dataclass
class ProcessingConfig:
    """处理配置"""
    batch_size: int = 5
    max_retries: int = 3
    cache_enabled: bool = True
    cache_dir: str = ".cache"
    error_log_file: str = "error_log.json"
    
    def get_cache_path(self) -> Path:
        """获取缓存目录路径"""
        return Path(self.cache_dir)


@dataclass
class OutputConfig:
    """输出配置"""
    output_dir: str = "cleaned_data"
    source_md_dir: str = "source_md"
    json_filename: str = "frontend_questions.json"
    mini_json_filename: str = "frontend_questions_mini.json"
    zip_filename: str = "frontend_questions.zip"
    
    def get_output_path(self) -> Path:
        """获取输出目录路径"""
        return Path(self.output_dir)


@dataclass
class AppConfig:
    """应用主配置"""
    llm: LLMConfig = field(default_factory=LLMConfig)
    processing: ProcessingConfig = field(default_factory=ProcessingConfig)
    output: OutputConfig = field(default_factory=OutputConfig)
    
    # 环境变量加载状态
    _loaded: bool = field(default=False, init=False)
    
    def load_from_env(self, env_file: Optional[str] = None) -> bool:
        """
        从环境变量或.env文件加载配置
        
        Args:
            env_file: 可选的.env文件路径
            
        Returns:
            bool: 加载是否成功
        """
        try:
            # 尝试加载 python-dotenv
            try:
                from dotenv import load_dotenv
                if env_file and os.path.exists(env_file):
                    load_dotenv(env_file)
                    logger.info(f"从文件加载环境变量: {env_file}")
                else:
                    load_dotenv()
                    logger.info("从.env文件加载环境变量")
            except ImportError:
                logger.warning("python-dotenv未安装，仅从系统环境变量读取")
            
            # LLM配置
            self.llm.api_key = os.getenv(
                "DASHSCOPE_API_KEY", 
                os.getenv("OPENAI_API_KEY", "")
            )
            
            # 如果提供了DashScope密钥，使用DashScope
            if self.llm.api_key and "dashscope" in self.llm.api_key.lower():
                self.llm.base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
                self.llm.model = os.getenv("LLM_MODEL", "qwen-turbo")
            else:
                self.llm.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
                self.llm.model = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
            
            self.llm.temperature = float(os.getenv("LLM_TEMPERATURE", "0.3"))
            self.llm.max_tokens = int(os.getenv("LLM_MAX_TOKENS", "2000"))
            self.llm.timeout = int(os.getenv("REQUEST_TIMEOUT", "30"))
            
            # 处理配置
            self.processing.batch_size = int(os.getenv("BATCH_SIZE", "5"))
            self.processing.max_retries = int(os.getenv("MAX_RETRIES", "3"))
            self.processing.cache_enabled = os.getenv("CACHE_ENABLED", "true").lower() == "true"
            self.processing.cache_dir = os.getenv("CACHE_DIR", ".cache")
            self.processing.error_log_file = os.getenv("ERROR_LOG_FILE", "error_log.json")
            
            # 输出配置
            self.output.output_dir = os.getenv("OUTPUT_DIR", "cleaned_data")
            self.output.source_md_dir = os.getenv("SOURCE_MD_DIR", "source_md")
            
            # 验证配置
            if not self.llm.validate():
                return False
            
            self._loaded = True
            logger.info("配置加载成功")
            return True
            
        except Exception as e:
            logger.error(f"配置加载失败: {e}")
            return False
    
    def save_to_file(self, filepath: str) -> bool:
        """
        保存配置到文件（JSON格式）
        
        Args:
            filepath: 保存路径
            
        Returns:
            bool: 保存是否成功
        """
        try:
            config_dict = {
                "llm": {
                    "api_key": self.llm.api_key[:10] + "..." if self.llm.api_key else "",
                    "base_url": self.llm.base_url,
                    "model": self.llm.model,
                    "temperature": self.llm.temperature,
                    "max_tokens": self.llm.max_tokens,
                    "timeout": self.llm.timeout
                },
                "processing": {
                    "batch_size": self.processing.batch_size,
                    "max_retries": self.processing.max_retries,
                    "cache_enabled": self.processing.cache_enabled,
                    "cache_dir": self.processing.cache_dir,
                    "error_log_file": self.processing.error_log_file
                },
                "output": {
                    "output_dir": self.output.output_dir,
                    "source_md_dir": self.output.source_md_dir,
                    "json_filename": self.output.json_filename,
                    "mini_json_filename": self.output.mini_json_filename,
                    "zip_filename": self.output.zip_filename
                }
            }
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(config_dict, f, indent=2, ensure_ascii=False)
            
            logger.info(f"配置已保存到: {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"配置保存失败: {e}")
            return False
    
    def is_loaded(self) -> bool:
        """检查配置是否已加载"""
        return self._loaded
    
    def __str__(self) -> str:
        """配置的字符串表示"""
        return f"""
应用配置:
  LLM配置:
    模型: {self.llm.model}
    API端点: {self.llm.base_url}
    温度: {self.llm.temperature}
    
  处理配置:
    批大小: {self.processing.batch_size}
    最大重试: {self.processing.max_retries}
    缓存: {'启用' if self.processing.cache_enabled else '禁用'}
    
  输出配置:
    输出目录: {self.output.output_dir}
    源文件目录: {self.output.source_md_dir}
"""


# 全局配置实例
_config: Optional[AppConfig] = None


def get_config() -> AppConfig:
    """
    获取全局配置实例（单例模式）
    
    Returns:
        AppConfig: 应用配置实例
    """
    global _config
    if _config is None:
        _config = AppConfig()
        # 尝试自动加载
        env_file = Path(".env")
        if env_file.exists():
            _config.load_from_env(str(env_file))
        else:
            logger.warning(".env文件不存在，使用默认配置")
    
    return _config


def init_config(env_file: Optional[str] = None) -> bool:
    """
    初始化配置
    
    Args:
        env_file: 可选的.env文件路径
        
    Returns:
        bool: 初始化是否成功
    """
    config = get_config()
    if config.is_loaded():
        return True
    
    return config.load_from_env(env_file)