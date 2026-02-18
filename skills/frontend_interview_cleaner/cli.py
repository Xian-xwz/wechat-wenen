#!/usr/bin/env python
"""
前端面试题清洗工具 - 命令行入口

用法:
    python -m skills.frontend_interview_cleaner.cli [命令] [选项]

命令:
    pipeline    运行完整清洗管道（生成 + 导出）
    generate    仅生成选择题
    export      仅导出已有题目
    test        测试API连接和配置

示例:
    python -m skills.frontend_interview_cleaner.cli pipeline --categories javascript
    python -m skills.frontend_interview_cleaner.cli test
"""
import asyncio
import sys
import argparse
from pathlib import Path
from typing import List, Optional

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from skills.frontend_interview_cleaner import (
    generate_questions, export_questions,
    get_generator, get_exporter
)
from skills.frontend_interview_cleaner.config import get_config, init_config
from skills.frontend_interview_cleaner.llm_client import LLMClient, LLMRequest


async def run_pipeline_command(args):
    """运行完整管道命令"""
    print("=" * 60)
    print("前端面试题库完整清洗管道")
    print("=" * 60)
    
    if not init_config():
        print("[失败] 配置初始化失败")
        return False
    
    config = get_config()
    print(f"配置:")
    print(f"  API端点: {config.llm.base_url}")
    print(f"  模型: {config.llm.model}")
    print(f"  批大小: {config.processing.batch_size}")
    print(f"  输出目录: {config.output.output_dir}")
    print("=" * 60)
    
    # 检查源文件
    print("\n[步骤1] 检查源文件...")
    source_dir = Path(config.output.source_md_dir)
    source_dir.mkdir(exist_ok=True)
    
    js_file = source_dir / "javascript-questions.md"
    if not js_file.exists():
        print(f"  [注意] JavaScript源文件不存在: {js_file}")
        print("  请先运行 download.py 下载源文件")
        return False
    else:
        print(f"  [成功] JavaScript源文件已存在: {js_file}")
    
    # 生成选择题
    print("\n[步骤2] 生成选择题...")
    categories = args.categories or ["javascript"]
    max_per_category = args.max_per_category
    
    print(f"  处理参数:")
    print(f"    分类: {categories}")
    print(f"    每类最大数量: {max_per_category or '全部'}")
    
    try:
        result = await generate_questions(categories, max_per_category)
        
        if result.get("success"):
            generated_questions = result.get("all_questions", [])
            print(f"  [成功] 生成完成:")
            print(f"    总生成问题数: {len(generated_questions)}")
            
            category_stats = {}
            for q in generated_questions:
                category = q.get("category", "unknown")
                category_stats[category] = category_stats.get(category, 0) + 1
            
            for cat, count in category_stats.items():
                print(f"    {cat}: {count} 个问题")
        else:
            print(f"  [失败] 生成失败: {result.get('error')}")
            return False
    
    except Exception as e:
        print(f"  [异常] 生成过程中发生异常: {e}")
        return False
    
    # 导出结果
    print("\n[步骤3] 导出结果...")
    try:
        export_result = export_questions(generated_questions)
        
        print(f"  [成功] 导出完成:")
        if export_result.get("full_version"):
            print(f"    完整版: {export_result['full_version']}")
        if export_result.get("mini_version"):
            print(f"    精简版: {export_result['mini_version']}")
        if export_result.get("zip_file"):
            print(f"    ZIP包: {export_result['zip_file']}")
    
    except Exception as e:
        print(f"  [异常] 导出过程中发生异常: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("[完成] 完整清洗管道执行成功!")
    print("=" * 60)
    
    return True


async def run_generate_command(args):
    """运行生成命令"""
    print("[开始] 运行前端面试题库生成器")
    
    if not init_config():
        print("[失败] 配置初始化失败")
        return False
    
    config = get_config()
    print(f"配置:")
    print(f"  API端点: {config.llm.base_url}")
    print(f"  模型: {config.llm.model}")
    print(f"  批大小: {config.processing.batch_size}")
    
    generator = get_generator()
    categories = args.categories or ["javascript"]
    max_per_category = args.max_per_category or 10
    
    print(f"处理参数:")
    print(f"  分类: {categories}")
    print(f"  每类最大数量: {max_per_category}")
    
    results = await generator.generate_questions(categories, max_per_category)
    
    print(f"\n[完成] 生成完成:")
    print(f"  总生成问题数: {len(results)}")
    
    category_stats = {}
    for result in results:
        if result.success:
            category = result.request_data.get("category", "unknown")
            category_stats[category] = category_stats.get(category, 0) + 1
    
    for category, count in category_stats.items():
        print(f"  {category}: {count} 个问题")
    
    return len(results) > 0


async def run_test_command(args):
    """运行测试命令"""
    print("[开始] 测试API连接和配置")
    print("=" * 50)
    
    if not init_config():
        print("[失败] 配置初始化失败")
        return False
    
    config = get_config()
    print(f"配置加载成功:")
    print(f"  API端点: {config.llm.base_url}")
    print(f"  模型: {config.llm.model}")
    print(f"  批大小: {config.processing.batch_size}")
    
    # 测试API连接
    print("\n[测试] 测试API连接...")
    client = LLMClient()
    
    test_request = LLMRequest(
        question="JavaScript中的闭包是什么？",
        answer="闭包是一个函数和其周围状态（lexical environment）的组合。",
        category="JavaScript"
    )
    
    try:
        result = await client.generate_single_choice(test_request)
        
        if result.success:
            print("[成功] API调用成功!")
            print(f"  生成的问题: {result.data['question'][:60]}...")
            print(f"  选项数量: {len(result.data['options'])}")
            print(f"  正确索引: {result.data['correct_answer_index']}")
            return True
        else:
            print(f"[失败] API调用失败: {result.error}")
            return False
    except Exception as e:
        print(f"[异常] 发生异常: {e}")
        return False


def main():
    """主入口"""
    parser = argparse.ArgumentParser(
        description="前端面试题清洗工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s pipeline --categories javascript html
  %(prog)s generate --categories javascript --max 5
  %(prog)s test
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    # pipeline 命令
    pipeline_parser = subparsers.add_parser("pipeline", help="运行完整清洗管道")
    pipeline_parser.add_argument(
        "--categories", "-c",
        nargs="+",
        choices=["javascript", "html", "css"],
        help="要处理的分类"
    )
    pipeline_parser.add_argument(
        "--max-per-category", "-m",
        type=int,
        default=None,
        help="每类最大处理数量（默认全部）"
    )
    
    # generate 命令
    generate_parser = subparsers.add_parser("generate", help="仅生成选择题")
    generate_parser.add_argument(
        "--categories", "-c",
        nargs="+",
        default=["javascript"],
        help="要处理的分类"
    )
    generate_parser.add_argument(
        "--max-per-category", "-m",
        type=int,
        default=10,
        help="每类最大处理数量"
    )
    
    # test 命令
    subparsers.add_parser("test", help="测试API连接和配置")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # 执行命令
    if args.command == "pipeline":
        success = asyncio.run(run_pipeline_command(args))
    elif args.command == "generate":
        success = asyncio.run(run_generate_command(args))
    elif args.command == "test":
        success = asyncio.run(run_test_command(args))
    else:
        parser.print_help()
        sys.exit(1)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
