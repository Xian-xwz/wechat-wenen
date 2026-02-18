"""
前端面试题库生成器主入口
"""

import asyncio
import sys
from pathlib import Path

# 添加项目根目录到Python路径，以便导入模块
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from skills.frontend_interview_cleaner import generate_questions, export_questions
from skills.frontend_interview_cleaner.config import get_config, init_config


async def main():
    """
    主函数 - 生成前端面试题库
    
    优先级顺序：
    1. 先处理JavaScript章节
    2. 验证生成的JSON质量无误后，再处理HTML和CSS
    """
    # 初始化配置
    init_config()
    config = get_config()
    
    print("=" * 60)
    print("前端面试题库生成器")
    print("=" * 60)
    print(f"API端点: {config.llm.base_url}")
    print(f"模型: {config.llm.model}")
    print(f"批处理大小: {config.processing.batch_size}")
    print(f"输出目录: {config.output.output_dir}")
    print("=" * 60)
    
    # 询问处理哪些分类（默认先处理JavaScript）
    categories = input("请输入要处理的分类（用逗号分隔，默认：javascript）: ").strip()
    if not categories:
        categories = ["javascript"]
    else:
        categories = [cat.strip().lower() for cat in categories.split(",")]
    
    # 询问处理数量限制
    max_per_category = input("请输入每类最大处理数量（默认：5，测试用）: ").strip()
    if not max_per_category:
        max_per_category = 5
    else:
        try:
            max_per_category = int(max_per_category)
        except ValueError:
            print("输入无效，使用默认值5")
            max_per_category = 5
    
    print(f"\n开始处理分类: {categories}")
    print(f"每类最大数量: {max_per_category}")
    print("-" * 40)
    
    try:
        # 生成题目
        results = await generate_questions(
            categories=categories,
            max_per_category=max_per_category
        )
        
        if not results:
            print("没有成功生成任何题目")
            return
            
        # 导出题目
        output_files = export_questions(results)
        
        print("\n✅ 处理完成！")
        print(f"成功生成题目数量: {len(results)}")
        print(f"输出文件:")
        for filepath in output_files:
            print(f"  - {filepath}")
            
        # 显示错误日志统计（如果有）
        error_logger = get_config().processing.error_logger
        if error_logger and Path(error_logger.error_log_path).exists():
            print(f"\n⚠️  有部分题目处理失败，详情请查看: {error_logger.error_log_path}")
            
    except KeyboardInterrupt:
        print("\n⏹️  用户中断处理")
    except Exception as e:
        print(f"\n❌ 处理失败: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    # 运行异步主函数
    exit_code = asyncio.run(main())
    sys.exit(exit_code)