#!/usr/bin/env python3
"""
配置模块测试
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import init_config, get_config

def test_config_loading():
    """测试配置加载"""
    print("=== 测试配置加载 ===")
    
    # 初始化配置
    success = init_config('.env')
    print(f"配置初始化: {'成功' if success else '失败'}")
    
    if success:
        config = get_config()
        print(f"配置已加载: {config.is_loaded()}")
        print(config)
        
        # 验证关键配置
        print("\n=== 关键配置验证 ===")
        print(f"API密钥: {'已设置' if config.llm.api_key else '未设置'}")
        print(f"模型: {config.llm.model}")
        print(f"批大小: {config.processing.batch_size}")
        print(f"错误日志文件: {config.processing.error_log_file}")
        
        return True
    return False

def test_env_file_exists():
    """测试.env文件是否存在"""
    print("\n=== 检查环境文件 ===")
    env_files = ['.env', '.env.example']
    for env_file in env_files:
        exists = os.path.exists(env_file)
        print(f"{env_file}: {'存在' if exists else '不存在'}")
        if exists and env_file == '.env':
            # 检查API密钥是否设置
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()
                has_api_key = 'DASHSCOPE_API_KEY=' in content or 'OPENAI_API_KEY=' in content
                print(f"  包含API密钥: {'是' if has_api_key else '否'}")

if __name__ == "__main__":
    test_env_file_exists()
    if test_config_loading():
        print("\n✅ 配置测试通过")
    else:
        print("\n❌ 配置测试失败")
        sys.exit(1)