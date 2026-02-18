#!/usr/bin/env python3
"""
LLM客户端测试
"""
import sys
import os
import asyncio
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llm_client import LLMRequest, process_question, process_batch, get_error_summary


async def test_single_question():
    """测试单个问题处理"""
    print("=== 测试单个问题处理 ===")
    
    # 测试数据
    question = "Explain event delegation in JavaScript"
    answer = "Event delegation is a technique where you attach a single event listener to a parent element instead of attaching listeners to each child element. This works because events bubble up from the target element to its ancestors. Benefits include better performance and handling of dynamically added elements."
    category = "JavaScript"
    
    print(f"问题: {question}")
    print(f"分类: {category}")
    
    result = await process_question(question, answer, category)
    
    print(f"成功: {result['success']}")
    print(f"延迟: {result['latency']:.2f}s")
    
    if result['success']:
        data = result['data']
        print(f"生成的题目: {data.get('question')}")
        print(f"选项: {data.get('options')}")
        print(f"正确答案索引: {data.get('correct_answer_index')}")
        print(f"难度: {data.get('difficulty', '未设置')}")
        print(f"解析: {data.get('explanation', '')[:100]}...")
    else:
        print(f"错误: {result['error']}")
    
    return result['success']


async def test_batch_processing():
    """测试批量处理"""
    print("\n=== 测试批量处理 ===")
    
    # 测试数据
    questions = [
        {
            "question": "What is the difference between let, const, and var?",
            "answer": "var is function-scoped and can be redeclared. let is block-scoped and can be reassigned but not redeclared. const is block-scoped and cannot be reassigned or redeclared."
        },
        {
            "question": "What is a closure in JavaScript?",
            "answer": "A closure is a function that has access to variables from its outer (enclosing) function even after the outer function has returned. This is possible because the inner function maintains a reference to its outer scope."
        }
    ]
    
    print(f"批量处理 {len(questions)} 个问题")
    
    results = await process_batch(questions, "JavaScript")
    
    success_count = sum(1 for r in results if r['success'])
    print(f"成功: {success_count}/{len(questions)}")
    
    for i, result in enumerate(results):
        print(f"\n问题 {i+1}:")
        print(f"  成功: {result['success']}")
        if result['success']:
            data = result['data']
            print(f"  题目: {data.get('question', '')[:50]}...")
            print(f"  选项数: {len(data.get('options', []))}")
        else:
            print(f"  错误: {result['error']}")
    
    return success_count > 0


def test_error_logging():
    """测试错误日志"""
    print("\n=== 测试错误日志 ===")
    
    summary = get_error_summary()
    print(f"总错误数: {summary['total_errors']}")
    
    if summary['recent_errors']:
        print("最近错误:")
        for error in summary['recent_errors'][-3:]:
            print(f"  - {error.get('error_message', '未知错误')[:50]}...")


def test_config_check():
    """测试配置检查"""
    print("\n=== 测试配置检查 ===")
    
    from config import get_config
    config = get_config()
    
    print(f"模型: {config.llm.model}")
    print(f"API端点: {config.llm.base_url}")
    print(f"API密钥: {'已设置' if config.llm.api_key else '未设置'}")
    print(f"批大小: {config.processing.batch_size}")
    print(f"错误日志文件: {config.processing.error_log_file}")
    
    return config.llm.api_key != ""


async def main():
    """主测试函数"""
    print("LLM客户端测试开始")
    print("=" * 50)
    
    all_passed = True
    
    # 检查配置
    config_ok = test_config_check()
    if not config_ok:
        print("❌ 配置检查失败: API密钥未设置")
        print("请确保.env文件包含有效的DASHSCOPE_API_KEY")
        return False
    
    # 测试单个问题（可选，会消耗API调用）
    test_single = input("\n是否测试单个API调用？(y/N): ").lower() == 'y'
    if test_single:
        single_ok = await test_single_question()
        all_passed = all_passed and single_ok
    else:
        print("跳过单个API调用测试")
    
    # 测试批量处理（可选，会消耗API调用）
    test_batch = input("\n是否测试批量API调用？(y/N): ").lower() == 'y'
    if test_batch:
        batch_ok = await test_batch_processing()
        all_passed = all_passed and batch_ok
    else:
        print("跳过批量API调用测试")
    
    # 测试错误日志
    test_error_logging()
    
    print("\n" + "=" * 50)
    if all_passed:
        print("✅ 所有测试通过")
    else:
        print("❌ 部分测试失败")
    
    return all_passed


if __name__ == "__main__":
    # 设置事件循环策略（Windows需要）
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    success = asyncio.run(main())
    sys.exit(0 if success else 1)